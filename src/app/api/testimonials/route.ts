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

    const testimonials = await prisma.testimonial.findMany({
      where: all ? {} : { approved: true, featured: true },
      orderBy: { createdAt: 'desc' },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/testimonials',
      session?.user?.id,
      200
    )

    return NextResponse.json(testimonials)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
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
    const testimonial = await prisma.testimonial.create({
      data: {
        name: body.name,
        role: body.role,
        company: body.company,
        content: body.content,
        avatar: body.avatar,
        rating: body.rating || 5,
        featured: body.featured || false,
        approved: body.approved || false,
      },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'POST',
      '/api/testimonials',
      session.user.id,
      201
    )

    return NextResponse.json(testimonial, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create testimonial' },
      { status: 500 }
    )
  }
}