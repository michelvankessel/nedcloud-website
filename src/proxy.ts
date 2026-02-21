import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = req.nextUrl.pathname === '/admin/login'

  if (isLoginPage) {
    return NextResponse.next()
  }

  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  const response = NextResponse.next()

  if (isAdminRoute && !isLoginPage) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
})

export const config = {
  matcher: ['/admin/:path*']
}