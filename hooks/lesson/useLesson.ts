"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { generateSlug } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase"

export function useLesson(params: any) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState<any>(null)
  const [unit, setUnit] = useState<any>(null)
  const [chapter, setChapter] = useState<any>(null)
  const [lesson, setLesson] = useState<any>(null)

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

        const subjectSlug = params.slug
        const unitSlug = params.unitSlug
        const chapterSlug = params.chapterSlug
        const lessonSlug = params.lessonSlug

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

        setSubject({
          ...foundSubject,
          slug: subjectSlug,
        })

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

        setUnit({
          ...foundUnit,
          slug: unitSlug,
        })

        // Fetch chapters for this unit
        const { data: chaptersData, error: chaptersError } = await supabase
          .from("chapters")
          .select("chapter_id, name")
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

        setChapter({
          ...foundChapter,
          slug: chapterSlug,
        })

        // Fetch lessons for this chapter
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons")
          .select("lesson_id, chapter_id, lesson_name")
          .eq("chapter_id", foundChapter.chapter_id)

        if (lessonsError) {
          console.error("Error fetching lessons:", lessonsError)
          router.push(`/curriculum/${subjectSlug}/${unitSlug}/${chapterSlug}`)
          return
        }

        // Find the lesson with the matching slug
        const foundLesson = lessonsData.find((lesson) => {
          const slug = generateSlug(lesson.lesson_name || "untitled-lesson")
          return slug === lessonSlug
        })

        if (!foundLesson) {
          console.error("Lesson not found with slug:", lessonSlug)
          router.push(`/curriculum/${subjectSlug}/${unitSlug}/${chapterSlug}`)
          return
        }

        setLesson(foundLesson)
      } catch (error) {
        console.error("Error in loadUserAndData:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndData()
  }, [params, router])

  return {
    user,
    loading,
    subject,
    unit,
    chapter,
    lesson,
  }
}
