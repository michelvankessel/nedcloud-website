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
    const project = await prisma.project.findUnique({
      where: { id },
      include: { author: { select: { name: true } } },
    })
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    return NextResponse.json(project)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
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
      '/api/projects/[id]',
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

    const project = await prisma.project.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        content: body.content,
        image: body.image,
        technologies: body.technologies || [],
        url: body.url,
        github: body.github,
        featured: body.featured ?? false,
        published: body.published ?? false,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PUT',
      '/api/projects/[id]',
      checkedSession.user.id,
      200
    )
    return NextResponse.json(project)
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PUT',
      '/api/projects/[id]',
      checkedSession.user.id,
      500
    )
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
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
      '/api/projects/[id]',
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
      '/api/projects/[id]',
      checkedSession.user.id,
      200
    )
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'DELETE',
      '/api/projects/[id]',
      checkedSession.user.id,
      500
    )
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}