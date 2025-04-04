"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { Eye } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { generateSlug } from "@/lib/utils"

interface Subject {
  subject_id: string
  name: string
  curriculum_title: string | null
  curriculum_description: string | null
}

export default function LessonPlansPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("subject_id, name, curriculum_title, curriculum_description")
        .order("name")

      if (error) {
        console.error("Error fetching subjects:", error)
      } else {
        setSubjects(data || [])
      }

      // Force a router refresh to ensure navigation works
      router.refresh()
    } catch (error) {
      console.error("Error in fetchSubjects:", error)
    }
  }

  useEffect(() => {
    async function loadUserAndData() {
      try {
        // Get current user and check if admin
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/login")
          return
        }

        if (currentUser.userInfo?.role !== "admin") {
          // Redirect non-admin users to their dashboard
          router.push(`/dashboard/${currentUser.userInfo?.role || ""}`)
          return
        }

        setUser(currentUser)
        await fetchSubjects()
      } catch (error) {
        console.error("Error in loadUserAndData:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndData()
  }, [router])

  const handleView = (subjectName: string) => {
    const slug = generateSlug(subjectName)
    router.push(`/lesson-plan/${slug}`)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pelican"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 w-full p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Lesson Plans</h1>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No curriculum found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Card key={subject.subject_id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{subject.name}</CardTitle>
                  <CardDescription>{subject.curriculum_title || "No title provided"}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {subject.curriculum_description || "No description available"}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end mt-auto">
                  <Button variant="outline" size="sm" onClick={() => handleView(subject.name)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        <Toaster />
      </div>
    </DashboardLayout>
  )
}

