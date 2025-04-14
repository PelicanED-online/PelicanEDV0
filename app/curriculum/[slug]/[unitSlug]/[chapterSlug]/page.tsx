"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { ArrowLeft, BookOpen } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { generateSlug } from "@/lib/utils"
import { AddLessonModal } from "@/components/curriculum/add-lesson-modal"
import { EditLessonModal } from "@/components/curriculum/edit-lesson-modal"

interface Subject {
  subject_id: string
  name: string
}

interface Unit {
  unit_id: string
  name: string
}

interface Chapter {
  chapter_id: string
  name: string
  description: string | null
}

interface Lesson {
  lesson_id: string
  chapter_id: string
  created_at: string
  lesson_name: string | null
}

export default function LessonsPage() {
  const router = useRouter()
  const params = useParams()
  const subjectSlug = params.slug as string
  const unitSlug = params.unitSlug as string
  const chapterSlug = params.chapterSlug as string

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])

  const fetchLessons = async (chapterId: string) => {
    try {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("lesson_id, chapter_id, lesson_name")
        .eq("chapter_id", chapterId)
        .order("lesson_name", { ascending: true })

      if (lessonsError) throw lessonsError

      setLessons(lessonsData || [])

      // Force a router refresh to ensure navigation works
      router.refresh()
    } catch (error) {
      console.error("Error fetching lessons:", error)
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
        const { data: subjectsData, error: subjectsError } = await supabase.from("subjects").select("subject_id, name")

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
          .select("unit_id, name")
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
        const { data: chaptersData, error: chaptersError } = await supabase
          .from("chapters")
          .select("chapter_id, name, description")
          .eq("unit_id", foundUnit.unit_id)

        if (chaptersError) {
          console.error("Error fetching chapters:", chaptersError)
          router.push(`/curriculum/${subjectSlug}/${unitSlug}`)
          return
        }

        // Find the chapter with the matching slug
        const foundChapter = chaptersData.find((chapter) => {
          const slug = generateSlug(chapter.name)
          return slug === chapterSlug
        })

        if (!foundChapter) {
          console.error("Chapter not found with slug:", chapterSlug)
          router.push(`/curriculum/${subjectSlug}/${unitSlug}`)
          return
        }

        setChapter(foundChapter)

        // Fetch lessons for this chapter
        await fetchLessons(foundChapter.chapter_id)
      } catch (error) {
        console.error("Error in loadUserAndData:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndData()
  }, [router, subjectSlug, unitSlug, chapterSlug])

  const handleBack = () => {
    router.push(`/curriculum/${subjectSlug}/${unitSlug}`)
  }

  const handleLessonUpdated = () => {
    if (chapter) {
      fetchLessons(chapter.chapter_id)
    }
  }

  const handleViewActivities = (lesson: Lesson) => {
    const lessonSlug = generateSlug(lesson.lesson_name || "untitled-lesson")
    router.push(`/curriculum/${subjectSlug}/${unitSlug}/${chapterSlug}/${lessonSlug}`)
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

  if (!subject || !unit || !chapter) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-4 w-full p-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={handleBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Chapter Not Found</h1>
          </div>
          <p className="text-muted-foreground">The requested chapter could not be found.</p>
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
              <h1 className="text-3xl font-bold tracking-tight">{chapter.name}</h1>
              <p className="text-muted-foreground">
                {subject.name} &gt; {unit.name}
              </p>
            </div>
          </div>
          <AddLessonModal
            chapterId={chapter.chapter_id}
            subjectId={subject.subject_id} // Pass the subject_id to the modal
            onLessonAdded={handleLessonUpdated}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{chapter.name}</CardTitle>
            <CardDescription>Chapter Details</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{chapter.description || "No description available"}</p>
          </CardContent>
        </Card>

        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Lessons</h2>

          {lessons.length === 0 ? (
            <div className="text-center py-10 bg-muted rounded-md">
              <p className="text-muted-foreground">No lessons found. Add your first lesson to get started.</p>
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lesson Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.map((lesson) => (
                    <TableRow key={lesson.lesson_id}>
                      <TableCell className="font-medium">{lesson.lesson_name || "Untitled Lesson"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <EditLessonModal lesson={lesson} onLessonUpdated={handleLessonUpdated} />
                          <Button variant="outline" size="sm" onClick={() => handleViewActivities(lesson)}>
                            <BookOpen className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:ml-2">Activities</span>
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
