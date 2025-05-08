import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and trying to access protected routes
  if (!session && (req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname === "/settings")) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If session exists but user is on auth pages
  if (session && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/")) {
    // Get user info to determine which dashboard to redirect to
    const { data: userInfo } = await supabase
      .from("user_information")
      .select("role")
      .eq("user_id", session.user.id)
      .single()

    // Handle different data structures
    const role = userInfo?.role || userInfo?.data?.role

    if (role) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = `/dashboard/${role}`
      return NextResponse.redirect(redirectUrl)
    }
  }

  // For the settings page, check if user has admin role
  if (session && req.nextUrl.pathname === "/settings") {
    const { data: userInfo } = await supabase
      .from("user_information")
      .select("role")
      .eq("user_id", session.user.id)
      .single()

    // Handle different data structures
    const role = userInfo?.role || userInfo?.data?.role

    if (role !== "admin") {
      // If not admin, redirect to their dashboard
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = `/dashboard/${role}`
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/settings"],
}
