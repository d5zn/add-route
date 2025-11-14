import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'admin_session'

/**
 * Check if session token is valid (basic check without crypto in edge runtime)
 */
function isValidSession(token: string): boolean {
  try {
    const [data, signature] = token.split('.')
    if (!data || !signature) return false
    
    const session = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))
    
    // Check expiration
    if (session.expiresAt < Date.now()) {
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
    
    if (!sessionToken || !isValidSession(sessionToken)) {
      // Redirect to login page
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Protect /api/admin routes
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')) {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
    
    if (!sessionToken || !isValidSession(sessionToken)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
