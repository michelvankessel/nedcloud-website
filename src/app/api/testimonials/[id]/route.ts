import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, requireRole } from '@/lib/auth'
import { logAPIRequest } from '@/lib/security-logger'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIp) return realIp
  return 'unknown'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const testimonial = await prisma.testimonial.findUnique({ where: { id } })
    
    if (!testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 })
    }
    
    return NextResponse.json(testimonial)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch testimonial' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  let checkedSession
  try {
    checkedSession = requireRole(session, ['ADMIN', 'EDITOR'])
  } catch (error) {
    const status = error instanceof Error && error.message === 'Forbidden: insufficient role' ? 403 : 401
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PUT',
      '/api/testimonials/[id]',
      session?.user?.id,
      status
    )
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        company: body.company,
        content: body.content,
        avatar: body.avatar,
        rating: body.rating ?? 5,
        featured: body.featured ?? false,
        approved: body.approved ?? false,
      },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PUT',
      '/api/testimonials/[id]',
      checkedSession.user.id,
      200
    )

    return NextResponse.json(testimonial)
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PUT',
      '/api/testimonials/[id]',
      checkedSession.user.id,
      500
    )
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  let checkedSession
  try {
    checkedSession = requireRole(session, ['ADMIN', 'EDITOR'])
  } catch (error) {
    const status = error instanceof Error && error.message === 'Forbidden: insufficient role' ? 403 : 401
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'DELETE',
      '/api/testimonials/[id]',
      session?.user?.id,
      status
    )
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status }
    )
  }

  try {
    const { id } = await params
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'DELETE',
      '/api/testimonials/[id]',
      checkedSession.user.id,
      200
    )
    await prisma.testimonial.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'DELETE',
      '/api/testimonials/[id]',
      checkedSession.user.id,
      500
    )
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
  }
}