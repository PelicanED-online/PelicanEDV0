"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { Eye } from "lucide-react"
import { generateSlug } from "@/lib/utils"

interface Subject {
  id?: string
  name: string
  curriculum_title: string | null
  curriculum_description: string | null
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])

  useEffect(() => {
    async function loadUserAndSubjects() {
      try {
        // Get current user
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/login")
          return
        }

        setUser(currentUser)

        // Get current academic year ID from site_settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("site_settings")
          .select("academic_year_id")
          .single()

        if (settingsError) {
          console.error("Error fetching academic year ID:", settingsError)
          setLoading(false)
          return
        }

        const currentAcademicYearId = settingsData.academic_year_id

        // Get subjects directly from invitation_code_usage_view
        // Select all columns to see what's available
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("invitation_code_usage_view")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("academic_year_id", currentAcademicYearId)

        if (subjectsError) {
          console.error("Error fetching subjects:", subjectsError)
          setLoading(false)
          return
        }

        // Log the first item to see what columns are available
        if (subjectsData && subjectsData.length > 0) {
          console.log("Available columns:", Object.keys(subjectsData[0]))
        }

        // Map the data to our Subject interface
        const mappedSubjects =
          subjectsData?.map((item, index) => ({
            id: item.id || String(index), // Use id if available, otherwise use index
            name: item.name || "Unknown Subject",
            curriculum_title: item.curriculum_title || null,
            curriculum_description: item.curriculum_description || null,
          })) || []

        setSubjects(mappedSubjects)
      } catch (error) {
        console.error("Error in loadUserAndSubjects:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndSubjects()
  }, [router])

  const handleView = (subjectName: string) => {
    const slug = generateSlug(subjectName)
    router.push(`/curriculum/${slug}`)
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No subjects found for the current academic year.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {subjects.map((subject, index) => (
              <Card key={subject.id || index} className="flex flex-col">
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
      </div>
    </DashboardLayout>
  )
}
