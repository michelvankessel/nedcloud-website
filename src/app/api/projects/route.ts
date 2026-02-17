import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'
import { logAPIRequest } from '@/lib/security-logger'

const apiRateLimit = rateLimit('api')

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIp) return realIp
  return 'unknown'
}

export async function GET(request: NextRequest) {
  const limitedResponse = await apiRateLimit(request)
  if (limitedResponse) return limitedResponse

  const session = await auth()

  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    if (all && !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: all ? {} : { published: true },
      orderBy: { createdAt: 'desc' },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/projects',
      session?.user?.id,
      200
    )

    return NextResponse.json(projects)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const limitedResponse = await apiRateLimit(request)
  if (limitedResponse) return limitedResponse

  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    })

    if (!adminUser) {
      return NextResponse.json({ error: 'No admin user found' }, { status: 500 })
    }

    const project = await prisma.project.create({
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        content: body.content || '',
        image: body.image,
        technologies: body.technologies || [],
        url: body.url,
        github: body.github,
        featured: body.featured || false,
        published: body.published || false,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        authorId: adminUser.id,
        serviceId: body.serviceId,
      },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'POST',
      '/api/projects',
      session.user.id,
      201
    )

    return NextResponse.json(project, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}