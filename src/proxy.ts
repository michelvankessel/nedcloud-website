import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = req.nextUrl.pathname === '/admin/login'
  const isVerify2FA = req.nextUrl.pathname === '/admin/verify-2fa'

  // Redirect authenticated users away from login/verify-2fa pages
  if ((isLoginPage || isVerify2FA) && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // Allow unauthenticated access to login and verify-2fa pages
  if (isLoginPage || isVerify2FA) {
    return NextResponse.next()
  }

  // Protect all other admin routes
  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  const response = NextResponse.next()

  if (isAdminRoute) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
})

export const config = {
  matcher: ['/admin/:path*']
}