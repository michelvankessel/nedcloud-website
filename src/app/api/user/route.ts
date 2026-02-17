import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

export async function PATCH(request: NextRequest) {
  const limitedResponse = await apiRateLimit(request)
  if (limitedResponse) return limitedResponse

  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name } = body

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { name },
      select: { id: true, name: true, email: true },
    })

    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PATCH',
      '/api/user',
      session.user.id,
      200
    )

    return NextResponse.json(user)
  } catch {
    logAPIRequest(
      getClientIp(request),
      request.headers.get('user-agent') || 'unknown',
      'PATCH',
      '/api/user',
      session?.user?.id,
      500
    )
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}