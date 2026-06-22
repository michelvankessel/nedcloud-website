import { NextResponse } from 'next/server'
import { clearRateLimitStore } from '@/lib/rateLimit'

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  clearRateLimitStore()

  return NextResponse.json({ ok: true })
}
