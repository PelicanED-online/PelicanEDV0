"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { ArrowLeft, BookOpen } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { generateSlug } from "@/lib/utils"
import { AddChapterModal } from "@/components/curriculum/add-chapter-modal"
import { EditChapterModal } from "@/components/curriculum/edit-chapter-modal"

interface Subject {
  subject_id: string
  name: string
  curriculum_title: string | null
  curriculum_description: string | null
}

interface Unit {
  unit_id: string
  subject_id: string
  name: string
  unit_title: string | null
}

interface Chapter {
  chapter_id: string
  unit_id: string
  name: string
  description: string | null
}

export default function ChaptersPage() {
  const router = useRouter()
  const params = useParams()
  const subjectSlug = params.slug as string
  const unitSlug = params.unitSlug as string

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])

  const fetchChapters = async (unitId: string) => {
    try {
      const { data, error } = await supabase
        .from("chapters")
        .select("chapter_id, unit_id, name, description")
        .eq("unit_id", unitId)
        .order("name")

      if (error) throw error

      setChapters(data || [])

      // Force a router refresh to ensure navigation works
      router.refresh()
    } catch (error) {
      console.error("Error fetching chapters:", error)
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

        // Fetch subject data by slug
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("subject_id, name, curriculum_title, curriculum_description")

        if (subjectsError) {
          console.error("Error fetching subjects:", subjectsError)
          router.push("/curriculum")
          return
        }

        // Find the subject with the matching slug
        const foundSubject = subjectsData.find((subject) => {
          const slug = generateSlug(subject.name)
          return slug === subjectSlug
        })

        if (!foundSubject) {
          console.error("Subject not found with slug:", subjectSlug)
          router.push("/curriculum")
          return
        }

        setSubject(foundSubject)

        // Fetch units for this subject
        const { data: unitsData, error: unitsError } = await supabase
          .from("units")
          .select("unit_id, subject_id, name, unit_title")
          .eq("subject_id", foundSubject.subject_id)

        if (unitsError) {
          console.error("Error fetching units:", unitsError)
          router.push(`/curriculum/${subjectSlug}`)
          return
        }

        // Find the unit with the matching slug
        const foundUnit = unitsData.find((unit) => {
          const slug = generateSlug(unit.name)
          return slug === unitSlug
        })

        if (!foundUnit) {
          console.error("Unit not found with slug:", unitSlug)
          router.push(`/curriculum/${subjectSlug}`)
          return
        }

        setUnit(foundUnit)

        // Fetch chapters for this unit
        await fetchChapters(foundUnit.unit_id)
      } catch (error) {
        console.error("Error in loadUserAndData:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndData()
  }, [router, subjectSlug, unitSlug])

  const handleBack = () => {
    router.push(`/curriculum/${subjectSlug}`)
  }

  const handleChapterUpdated = () => {
    if (unit) {
      fetchChapters(unit.unit_id)
    }
  }

  const handleViewLessons = (chapter: Chapter) => {
    const chapterSlug = generateSlug(chapter.name)
    router.push(`/curriculum/${subjectSlug}/${unitSlug}/${chapterSlug}`)
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

  if (!subject || !unit) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-4 w-full p-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={handleBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Unit Not Found</h1>
          </div>
          <p className="text-muted-foreground">The requested unit could not be found.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 w-full p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={handleBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{unit.name}</h1>
              <p className="text-muted-foreground">{subject.name} Curriculum</p>
            </div>
          </div>
          <AddChapterModal unitId={unit.unit_id} onChapterAdded={handleChapterUpdated} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{unit.unit_title || unit.name}</CardTitle>
            <CardDescription>Unit Details</CardDescription>
          </CardHeader>
        </Card>

        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Chapters</h2>

          {chapters.length === 0 ? (
            <div className="text-center py-10 bg-muted rounded-md">
              <p className="text-muted-foreground">No chapters found. Add your first chapter to get started.</p>
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chapters.map((chapter) => (
                    <TableRow key={chapter.chapter_id}>
                      <TableCell className="font-medium">{chapter.name}</TableCell>
                      <TableCell>{chapter.description || "No description"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <EditChapterModal chapter={chapter} onChapterUpdated={handleChapterUpdated} />
                          <Button variant="outline" size="sm" onClick={() => handleViewLessons(chapter)}>
                            <BookOpen className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:ml-2">Lessons</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
        <Toaster />
      </div>
    </DashboardLayout>
  )
}
