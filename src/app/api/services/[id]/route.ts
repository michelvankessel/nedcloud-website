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
    const service = await prisma.service.findUnique({
      where: { id },
    })
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    
    return NextResponse.json(service)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    )
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
      '/api/services/[id]',
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
    
    const service = await prisma.service.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        content: body.content,
        icon: body.icon,
        features: body.features || [],
        order: body.order,
        published: body.published,
      },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PUT',
      '/api/services/[id]',
      checkedSession.user.id,
      200
    )
    
    return NextResponse.json(service)
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PUT',
      '/api/services/[id]',
      checkedSession.user.id,
      500
    )
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
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
      '/api/services/[id]',
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
      '/api/services/[id]',
      checkedSession.user.id,
      200
    )
    await prisma.service.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'DELETE',
      '/api/services/[id]',
      checkedSession.user.id,
      500
    )
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}