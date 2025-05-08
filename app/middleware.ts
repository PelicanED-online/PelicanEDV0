import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  // Create a response object that we'll modify and return
  const res = NextResponse.next()

  // Create a Supabase client specifically for the middleware
  const supabase = createMiddlewareClient({ req, res })

  // Get the session - this refreshes the session if needed
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Log authentication state for debugging
  console.log(`Middleware - Path: ${req.nextUrl.pathname}, Authenticated: ${!!session}`)

  // If no session and trying to access protected routes
  if (
    !session &&
    (req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname === "/settings" ||
      req.nextUrl.pathname.startsWith("/curriculum") ||
      req.nextUrl.pathname.startsWith("/lesson-plan") ||
      req.nextUrl.pathname.startsWith("/profile"))
  ) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Special case for [slug] routes - these should be accessible with a session
  // This ensures routes like /[slug]/lessons can access authenticated data
  if (session && req.nextUrl.pathname.match(/^\/[^/]+\/(lessons|classes)/)) {
    console.log(`Authenticated user accessing ${req.nextUrl.pathname}`)
    // Allow access but ensure the session is attached to the response
    return res
  }

  // If session exists but user is on auth pages
  if (session && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/")) {
    try {
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
    } catch (error) {
      console.error("Error in middleware while fetching user role:", error)
      // If there's an error, still allow access to the page
      return res
    }
  }

  // For the settings page, check if user has admin role
  if (session && req.nextUrl.pathname === "/settings") {
    try {
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
    } catch (error) {
      console.error("Error in middleware while checking admin role:", error)
      // If there's an error, still allow access to the page
      return res
    }
  }

  return res
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/settings",
    "/curriculum/:path*",
    "/lesson-plan/:path*",
    "/profile",
    "/:slug/lessons",
    "/:slug/classes",
  ],
}
