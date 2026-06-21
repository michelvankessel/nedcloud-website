import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, requireRole } from '@/lib/auth'
import { validate, contactStatusSchema } from '@/lib/validations'
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
  const session = await auth()

  let checkedSession
  try {
    checkedSession = requireRole(session, ['ADMIN'])
  } catch (error) {
    const status = error instanceof Error && error.message === 'Forbidden: insufficient role' ? 403 : 401
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/contact/[id]',
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
    const contact = await prisma.contactSubmission.findUnique({ where: { id } })
    
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/contact/[id]',
      checkedSession.user.id,
      200
    )
    return NextResponse.json(contact)
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/contact/[id]',
      checkedSession.user.id,
      500
    )
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  let checkedSession
  try {
    checkedSession = requireRole(session, ['ADMIN'])
  } catch (error) {
    const status = error instanceof Error && error.message === 'Forbidden: insufficient role' ? 403 : 401
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PATCH',
      '/api/contact/[id]',
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

    const validation = validate(contactStatusSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    const contact = await prisma.contactSubmission.update({
      where: { id },
      data: { status: validation.data.status },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PATCH',
      '/api/contact/[id]',
      checkedSession.user.id,
      200
    )
    return NextResponse.json(contact)
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PATCH',
      '/api/contact/[id]',
      checkedSession.user.id,
      500
    )
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  let checkedSession
  try {
    checkedSession = requireRole(session, ['ADMIN'])
  } catch (error) {
    const status = error instanceof Error && error.message === 'Forbidden: insufficient role' ? 403 : 401
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'DELETE',
      '/api/contact/[id]',
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
      '/api/contact/[id]',
      checkedSession.user.id,
      200
    )
    await prisma.contactSubmission.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'DELETE',
      '/api/contact/[id]',
      checkedSession.user.id,
      500
    )
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}