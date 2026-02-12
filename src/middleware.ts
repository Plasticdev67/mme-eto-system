import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow auth API routes, portal routes, and static files always
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/portal")) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  const isLoggedIn = !!token
  const isLoginPage = pathname === "/login"

  // Redirect logged-in users away from login page
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Redirect unauthenticated users to login
  if (!isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protect everything except static files, _next, and favicon
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
