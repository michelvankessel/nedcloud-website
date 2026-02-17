import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { validate, contactSubmissionSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rateLimit'
import { logAPIRequest, logFormSubmission } from '@/lib/security-logger'

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

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      session.user.id,
      200
    )

    return NextResponse.json(contacts)
  } catch {
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

    logFormSubmission(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'Contact Form',
      { name: validation.data.name, email: validation.data.email }
    )

    const contact = await prisma.contactSubmission.create({
      data: validation.data,
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