import { handlers } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

const authRateLimit = rateLimit('auth')

export const { GET } = handlers

export async function POST(request: NextRequest) {
  const limitedResponse = await authRateLimit(request)
  if (limitedResponse) return limitedResponse
  return handlers.POST(request)
}