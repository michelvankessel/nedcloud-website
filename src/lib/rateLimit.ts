import { NextRequest, NextResponse } from 'next/server'
import { securityConfig } from './security.config'

const { windowMs, apiMaxRequests, authMaxRequests } = securityConfig.rateLimit

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return 'unknown'
}

export function rateLimit(type: 'api' | 'auth' = 'api') {
  const maxRequests = type === 'auth' ? authMaxRequests : apiMaxRequests
  
  return async function(request: NextRequest): Promise<NextResponse | null> {
    const ip = getClientIp(request)
    const key = `${type}:${ip}`
    const now = Date.now()
    
    const record = rateLimitStore.get(key)
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
      return null
    }
    
    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetTime.toString(),
          }
        }
      )
    }
    
    record.count++
    return null
  }
}

export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

setInterval(cleanupRateLimitStore, 60 * 1000)