import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth, requireRole } from '@/lib/auth'
import { validate, contactSubmissionSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rateLimit'
import { logAPIRequest, logFormSubmission } from '@/lib/security-logger'

const apiRateLimit = rateLimit('api')
const MIN_FORM_TIME_MS = 2000

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

  let checkedSession
  try {
    checkedSession = requireRole(session, ['ADMIN'])
  } catch (error) {
    const status = error instanceof Error && error.message === 'Forbidden: insufficient role' ? 403 : 401
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/contact',
      session?.user?.id,
      status
    )
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status }
    )
  }

  try {
    const contacts = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/contact',
      checkedSession.user.id,
      200
    )

    const response = NextResponse.json(contacts)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'GET',
      '/api/contact',
      checkedSession.user.id,
      500
    )
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const limitedResponse = await apiRateLimit(request)
  if (limitedResponse) return limitedResponse

  try {
    const body = await request.json()

    const validation = validate(contactSubmissionSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 })
    }

    // Honeypot check: if hidden field is filled, it's a bot
    if (validation.data._hp) {
      logFormSubmission(
        getClientIp(request),
        request.headers.get('user-agent') || 'unknown',
        'Contact Form (honeypot)',
        { name: validation.data.name, email: validation.data.email }
      )
      return NextResponse.json({ success: true }, { status: 201 })
    }

    // Timing check: if form submitted too fast, it's likely a bot
    if (validation.data._ts) {
      const formLoadTime = parseInt(validation.data._ts, 10)
      if (!isNaN(formLoadTime) && Date.now() - formLoadTime < MIN_FORM_TIME_MS) {
        logFormSubmission(
          getClientIp(request),
          request.headers.get('user-agent') || 'unknown',
          'Contact Form (timing)',
          { name: validation.data.name, email: validation.data.email }
        )
        return NextResponse.json({ success: true }, { status: 201 })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _hp, _ts, ...contactData } = validation.data

    logFormSubmission(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'Contact Form',
      { name: validation.data.name, email: validation.data.email }
    )

    const contact = await prisma.contactSubmission.create({
      data: contactData,
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'POST',
      '/api/contact',
      undefined,
      201
    )

    return NextResponse.json(contact, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create contact submission' },
      { status: 500 }
    )
  }
}