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

    const team = await prisma.teamMember.findMany({
      where: all ? {} : { published: true },
      orderBy: { order: 'asc' },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/team',
      session?.user?.id,
      200
    )

    return NextResponse.json(team)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
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
    const member = await prisma.teamMember.create({
      data: {
        name: body.name,
        role: body.role,
        bio: body.bio,
        image: body.image,
        email: body.email,
        linkedin: body.linkedin,
        github: body.github,
        twitter: body.twitter,
        order: body.order || 0,
        published: body.published || false,
      },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'POST',
      '/api/team',
      session.user.id,
      201
    )

    return NextResponse.json(member, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    )
  }
}