"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { Pencil, Plus, FileText } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddLessonPlanModal } from "@/components/lesson-plans/add-lesson-plan-modal"

interface LessonPlan {
  lesson_plan_id: string
  lesson_id: string | null
  subject_id: string
  lesson_name?: string
}

interface PageProps {
  params: {
    slug: string
  }
}

export default function LessonPlanPage({ params }: PageProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [subjectName, setSubjectName] = useState("")
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const fetchLessonPlans = async (subjectSlug: string) => {
    try {
      // First, get the subject_id from the slug
      const formattedSlug = decodeURIComponent(subjectSlug)

      // This is a simplified approach - in a real app, you'd have a more robust slug-to-name conversion
      const subjectName = formattedSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      setSubjectName(subjectName)

      const { data: subjectData, error: subjectError } = await supabase
        .from("subjects")
        .select("subject_id, name")
        .ilike("name", subjectName)
        .single()

      if (subjectError) {
        console.error("Error fetching subject:", subjectError)
        return
      }

      if (!subjectData) {
        console.error("Subject not found")
        return
      }

      // Set the actual subject name from the database
      setSubjectName(subjectData.name)
      setSubjectId(subjectData.subject_id)

      // Now we can directly query lesson_plans by subject_id
      const { data: plansData, error: plansError } = await supabase
        .from("lesson_plans")
        .select(`
          lesson_plan_id,
          lesson_id,
          subject_id
        `)
        .eq("subject_id", subjectData.subject_id)

      if (plansError) {
        console.error("Error fetching lesson plans:", plansError)
        return
      }

      if (!plansData || plansData.length === 0) {
        console.log("No lesson plans found for this subject")
        setLessonPlans([])
        return
      }

      // Get all unique lesson_ids to fetch their names
      const lessonIds = plansData.map((plan) => plan.lesson_id).filter((id): id is string => id !== null) // Filter out null values and type assertion

      // If there are no valid lesson IDs, just return the plans without lesson names
      if (lessonIds.length === 0) {
        const transformedData = plansData.map((item) => ({
          ...item,
          lesson_name: "Unnamed Lesson",
        }))
        setLessonPlans(transformedData)
        return
      }

      // Fetch lesson names
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("lesson_id, lesson_name")
        .in("lesson_id", lessonIds)

      if (lessonsError) {
        console.error("Error fetching lessons:", lessonsError)
        // Continue with what we have, just without lesson names
        const transformedData = plansData.map((item) => ({
          ...item,
          lesson_name: "Unnamed Lesson",
        }))
        setLessonPlans(transformedData)
        return
      }

      // Create a map of lesson_id to lesson_name for easy lookup
      const lessonMap =
        lessonsData?.reduce(
          (map, lesson) => {
            map[lesson.lesson_id] = lesson.lesson_name
            return map
          },
          {} as Record<string, string>,
        ) || {}

      // Transform the data to include lesson_name from our map
      const transformedData = plansData.map((item) => ({
        ...item,
        lesson_name: item.lesson_id && lessonMap[item.lesson_id] ? lessonMap[item.lesson_id] : "Unnamed Lesson",
      }))

      // Sort the lesson plans by lesson_name in ascending order
      const sortedData = transformedData.sort((a, b) => {
        const nameA = a.lesson_name?.toLowerCase() || ""
        const nameB = b.lesson_name?.toLowerCase() || ""
        return nameA.localeCompare(nameB)
      })

      setLessonPlans(sortedData)
    } catch (error) {
      console.error("Error in fetchLessonPlans:", error)
    }
  }

  useEffect(() => {
    async function loadUserAndData() {
      try {
        setLoading(true)
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
        await fetchLessonPlans(params.slug)
        setDataLoaded(true)
      } catch (error) {
        console.error("Error in loadUserAndData:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndData()
  }, [router, params.slug])

  const handleEdit = (lessonPlanId: string) => {
    // This would navigate to an edit page or open an edit modal
    console.log("Edit lesson plan:", lessonPlanId)
  }

  const handleDescriptions = (lessonPlanId: string) => {
    // Find the lesson plan in our state
    const plan = lessonPlans.find((p) => p.lesson_plan_id === lessonPlanId)
    if (!plan || !plan.lesson_name) return

    // Generate a slug from the lesson name
    const lessonSlug = plan.lesson_name.toLowerCase().replace(/\s+/g, "-")

    // Navigate to the descriptions page
    router.push(`/lesson-plan/${params.slug}/${lessonSlug}`)
  }

  const handleAddLessonPlan = () => {
    if (subjectId) {
      setIsAddModalOpen(true)
    }
  }

  const handleAddSuccess = () => {
    // Refresh the lesson plans list
    if (params.slug) {
      fetchLessonPlans(params.slug)
    }
  }

  if (loading && !dataLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pelican"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 w-full p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">{subjectName} Lesson Plans</h1>
          <Button onClick={handleAddLessonPlan}>
            <Plus className="mr-2 h-4 w-4" /> Lesson Plan
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lesson Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {lessonPlans.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No lesson plans found for this subject.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lesson Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessonPlans.map((plan) => (
                    <TableRow key={plan.lesson_plan_id}>
                      <TableCell className="font-medium">{plan.lesson_name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3"
                            onClick={() => handleEdit(plan.lesson_plan_id)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleDescriptions(plan.lesson_plan_id)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Descriptions
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {subjectId && (
          <AddLessonPlanModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            subjectId={subjectId}
            onSuccess={handleAddSuccess}
          />
        )}

        <Toaster />
      </div>
    </DashboardLayout>
  )
}

