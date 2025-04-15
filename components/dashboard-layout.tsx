"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LogoWithText } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getCurrentUser, signOut, type UserRole } from "@/lib/supabase"
import {
  LogOut,
  School,
  Settings,
  User,
  Users,
  LayoutDashboard,
  Building,
  Key,
  Moon,
  Sun,
  BookOpen,
  CreditCard,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme as useNextTheme } from "next-themes"

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles?: UserRole[]
  isActive?: boolean
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { setTheme, theme } = useNextTheme()

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()
        console.log(
          "Dashboard layout - Current user:",
          currentUser
            ? JSON.stringify({
                id: currentUser.id,
                email: currentUser.email,
                role: currentUser.userInfo?.role || currentUser.userInfo?.data?.role,
                hasUserInfo: !!currentUser.userInfo,
              })
            : "No user",
        )

        if (!currentUser) {
          router.push("/login")
          return
        }

        setUser(currentUser)
      } catch (error) {
        console.error("Error loading user in dashboard layout:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pelican"></div>
      </div>
    )
  }

  // Safely extract the user role, with fallback to "admin" if not found
  // Handle different data structures between environments
  const userRole = (user?.userInfo?.role || user?.userInfo?.data?.role || "admin") as UserRole
  console.log("Dashboard layout - Detected user role:", userRole)

  const userName = user?.userInfo?.firstName
    ? `${user.userInfo.firstName} ${user.userInfo.lastName || ""}`
    : user?.email

  const getInitials = () => {
    if (user?.userInfo?.firstName && user?.userInfo?.lastName) {
      return `${user.userInfo.firstName[0]}${user.userInfo.lastName[0]}`.toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || "U"
  }

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Define navigation items - simplified approach to ensure items are shown
  let navItems: NavItem[] = []

  // Add admin-specific items if the user is an admin
  if (userRole === "admin") {
    console.log("Adding admin-specific navigation items")
    navItems = [
      {
        title: "Dashboard",
        href: `/dashboard/${userRole}`,
        icon: LayoutDashboard,
        isActive: pathname === `/dashboard/${userRole}`,
      },
      {
        title: "Curriculum",
        href: "/curriculum",
        icon: BookOpen,
        isActive: pathname === "/curriculum" || pathname.startsWith("/curriculum/"),
      },
      {
        title: "Lesson Plans",
        href: "/lesson-plans",
        icon: FileText,
        isActive: pathname === "/lesson-plans" || pathname.startsWith("/lesson-plan/"),
      },
      {
        title: "Districts",
        href: "/dashboard/districts-admin",
        icon: Building,
        isActive: pathname === "/dashboard/districts-admin",
      },
      {
        title: "Schools",
        href: "/dashboard/schools-admin",
        icon: School,
        isActive: pathname === "/dashboard/schools-admin",
      },
      {
        title: "Subscriptions",
        href: "/dashboard/admin/subscription-management",
        icon: CreditCard,
        isActive: pathname === "/dashboard/admin/subscription-management",
      },
      {
        title: "Users",
        href: "/dashboard/users-admin",
        icon: Users,
        isActive: pathname === "/dashboard/users-admin",
      },
      {
        title: "Invitation Codes",
        href: "/dashboard/admin/invitation-codes",
        icon: Key,
        isActive: pathname === "/dashboard/admin/invitation-codes",
      },
    ]
  } else {
    // For non-admin users, just add the dashboard
    navItems = [
      {
        title: "Dashboard",
        href: `/dashboard/${userRole}`,
        icon: LayoutDashboard,
        isActive: pathname === `/dashboard/${userRole}`,
      },
    ]
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="hidden md:flex">
          <SidebarHeader className="border-b h-14">
            <div className="flex items-center h-full px-4">
              <LogoWithText />
            </div>
          </SidebarHeader>
          <SidebarContent>
            {/* Direct rendering of navigation items with consistent styling */}
            <nav className="flex-1 px-2 space-y-2 mt-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md w-full",
                    pathname === item.href || item.isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted hover:text-primary",
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </SidebarContent>
          <SidebarFooter>
            <div className="p-3 border-t">
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="justify-start" size="sm">
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    <span>Account</span>
                  </Link>
                </Button>

                {userRole === "admin" && (
                  <Button asChild variant="outline" className="justify-start" size="sm">
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Settings</span>
                    </Link>
                  </Button>
                )}

                <Button variant="outline" className="justify-start" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background w-full">
            <div className="flex items-center md:hidden">
              <SidebarTrigger />
            </div>
            <div className="flex flex-1 items-center justify-between w-full px-4">
              <div className="flex items-center gap-4">
                <div className="md:hidden">
                  <LogoWithText />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground hidden sm:flex items-center">
                  Welcome back, <span className="font-medium ml-1 mr-3">{user?.userInfo?.firstName || "User"}</span>
                  {/* Theme toggle button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-8 w-8 rounded-full"
                    aria-label="Toggle theme"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </p>

                {/* Avatar with no dropdown or hover effects */}
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-pelican text-white">{getInitials()}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="flex-1 w-full bg-background min-h-screen">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}

