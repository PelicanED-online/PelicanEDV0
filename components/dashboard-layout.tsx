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
import { getCurrentUser, signOut, supabase, type UserRole } from "@/lib/supabase"
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
  ChevronDown,
  ChevronRight,
  Presentation,
  NotebookText,
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

interface Subject {
  id?: string
  name: string
}

interface UserInformation {
  firstName: string
  lastName: string
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<UserInformation | null>(null)
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const { setTheme, theme } = useNextTheme()
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({})
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

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

        // Set avatar URL if available
        if (currentUser.user_metadata?.avatar_url) {
          setAvatarUrl(currentUser.user_metadata.avatar_url)
        }

        // Directly fetch user information from the database
        if (currentUser.id) {
          const { data: userInfoData, error: userInfoError } = await supabase
            .from("user_information")
            .select("firstName, lastName")
            .eq("user_id", currentUser.id)
            .single()

          if (userInfoError) {
            console.error("Error fetching user information:", userInfoError)
          } else if (userInfoData) {
            console.log("User information fetched:", userInfoData)
            setUserInfo(userInfoData as UserInformation)
          }
        }

        // If user is a teacher, load their subjects
        const userRole = (currentUser?.userInfo?.role || currentUser?.userInfo?.data?.role || "admin") as UserRole
        if (userRole === "teacher") {
          await loadTeacherSubjects(currentUser.id)
        }
      } catch (error) {
        console.error("Error loading user in dashboard layout:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  // Add this after the first useEffect
  useEffect(() => {
    // Extract the current slug from the pathname
    const pathParts = pathname.split("/")
    if (pathParts.length >= 2) {
      const currentSlug = pathParts[1]

      // Find the matching subject and open its dropdown
      subjects.forEach((subject) => {
        const subjectId = subject.id || subject.name
        const subjectSlug = subject.name.toLowerCase().replace(/\s+/g, "-")

        if (subjectSlug === currentSlug) {
          setOpenSubjects((prev) => ({
            ...prev,
            [subjectId]: true,
          }))
        }
      })
    }
  }, [pathname, subjects])

  const loadTeacherSubjects = async (userId: string) => {
    try {
      // Get current academic year ID from site_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("site_settings")
        .select("academic_year_id")
        .single()

      if (settingsError) {
        console.error("Error fetching academic year ID:", settingsError)
        return
      }

      const currentAcademicYearId = settingsData.academic_year_id

      // Get subjects for the teacher
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("invitation_code_usage_view")
        .select("*")
        .eq("user_id", userId)
        .eq("academic_year_id", currentAcademicYearId)

      if (subjectsError) {
        console.error("Error fetching teacher subjects:", subjectsError)
        return
      }

      console.log("Teacher subjects:", subjectsData)

      // Map the data to our Subject interface
      const mappedSubjects =
        subjectsData?.map((item, index) => ({
          id: item.id || String(index),
          name: item.name || "Unknown Subject",
        })) || []

      setSubjects(mappedSubjects)

      // Initialize open state for each subject (all closed by default)
      const initialOpenState: Record<string, boolean> = {}
      mappedSubjects.forEach((subject) => {
        initialOpenState[subject.id || String(subject.name)] = false
      })
      setOpenSubjects(initialOpenState)
    } catch (error) {
      console.error("Error loading teacher subjects:", error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const toggleSubject = (subjectId: string) => {
    console.log("Toggling subject:", subjectId)
    setOpenSubjects((prev) => {
      const newState = {
        ...prev,
        [subjectId]: !prev[subjectId],
      }
      console.log("New open state:", newState)
      return newState
    })
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

  const userName = userInfo?.firstName ? `${userInfo.firstName} ${userInfo.lastName || ""}` : user?.email

  const getInitials = () => {
    // Log the user information to debug
    console.log("Getting initials from userInfo:", userInfo)

    // Use the directly fetched user information
    if (userInfo?.firstName && userInfo?.lastName) {
      return `${userInfo.firstName[0]}${userInfo.lastName[0]}`.toUpperCase()
    }

    // If we have a first name but no last name, use first initial twice
    if (userInfo?.firstName && !userInfo?.lastName) {
      return `${userInfo.firstName[0]}${userInfo.firstName[0]}`.toUpperCase()
    }

    // Fall back to email or a default
    if (user?.email) {
      return user.email[0].toUpperCase()
    }

    // Last resort
    return "U"
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

  // Get the initials once and store them to prevent re-calculation
  const userInitials = getInitials()

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

              {/* Teacher-specific subject dropdowns */}
              {userRole === "teacher" && subjects.length > 0 && (
                <div className="mt-6 space-y-1">
                  <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    My Subjects
                  </h3>
                  {subjects.map((subject) => {
                    const subjectId = subject.id || subject.name
                    const isOpen = openSubjects[subjectId] || false
                    const slug = subject.name.toLowerCase().replace(/\s+/g, "-")

                    return (
                      <div key={subjectId} className="w-full">
                        <button
                          onClick={() => toggleSubject(subjectId)}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-muted"
                        >
                          <span className="flex items-center">
                            <BookOpen className="mr-3 h-5 w-5" />
                            {subject.name}
                          </span>
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>

                        {isOpen && (
                          <div className="pl-8 space-y-1 mt-1">
                            <Link
                              href={`/${slug}/lessons`}
                              className={cn(
                                "flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted",
                                pathname === `/${slug}/lessons` ? "bg-primary/10 text-primary" : "",
                              )}
                            >
                              <NotebookText className="mr-3 h-4 w-4" />
                              Lessons
                            </Link>
                            <Link
                              href={`/${slug}/lesson-plans`}
                              className={cn(
                                "flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted",
                                pathname === `/${slug}/lesson-plans` ? "bg-primary/10 text-primary" : "",
                              )}
                            >
                              <FileText className="mr-3 h-4 w-4" />
                              Lesson Plans
                            </Link>
                            <Link
                              href={`/${slug}/slide-decks`}
                              className={cn(
                                "flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted",
                                pathname === `/${slug}/slide-decks` ? "bg-primary/10 text-primary" : "",
                              )}
                            >
                              <Presentation className="mr-3 h-4 w-4" />
                              Slide Decks
                            </Link>
                            <Link
                              href={`/${slug}/classes`}
                              className={cn(
                                "flex items-center px-3 py-2 text-sm rounded-md hover:bg-muted",
                                pathname === `/${slug}/classes` ? "bg-primary/10 text-primary" : "",
                              )}
                            >
                              <School className="mr-3 h-4 w-4" />
                              Classes
                            </Link>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
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
                  Welcome back, <span className="font-medium ml-1 mr-3">{userInfo?.firstName || "User"}</span>
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
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="User avatar" />
                  ) : (
                    <AvatarFallback className="bg-pelican text-white">{userInitials}</AvatarFallback>
                  )}
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
