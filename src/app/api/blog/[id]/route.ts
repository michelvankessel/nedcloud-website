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
    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true } } },
    })
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    
    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
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
      '/api/blog/[id]',
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

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content,
        coverImage: body.coverImage,
        tags: body.tags || [],
        featured: body.featured ?? false,
        published: body.published ?? false,
        publishedAt: body.published ? body.publishedAt || new Date() : null,
      },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PUT',
      '/api/blog/[id]',
      checkedSession.user.id,
      200
    )
    return NextResponse.json(post)
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PUT',
      '/api/blog/[id]',
      checkedSession.user.id,
      500
    )
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
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
      '/api/blog/[id]',
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
      '/api/blog/[id]',
      checkedSession.user.id,
      200
    )
    await prisma.post.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'DELETE',
      '/api/blog/[id]',
      checkedSession.user.id,
      500
    )
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}