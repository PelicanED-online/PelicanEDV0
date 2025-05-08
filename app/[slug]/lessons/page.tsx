import Link from "next/link"
import { Eye, Send, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { capitalizeText } from "@/lib/utils"

interface Lesson {
  id: string
  lesson_name: string
  chapter_id: string
  subject_id: string
}

interface Subject {
  subject_id: string
  name: string
}

async function getLessonsForSlug(slug: string) {
  console.log("Getting lessons for slug:", slug)

  try {
    // Log environment information
    console.log(
      "Environment check - NEXT_PUBLIC_SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
    )

    // First, check if we can access the lessons table at all
    const { data: sampleLessons, error: sampleLessonsError } = await supabase.from("lessons").select("*").limit(5)

    if (sampleLessonsError) {
      console.error("Error accessing lessons table:", sampleLessonsError)
      return {
        subjectName: slug.replace(/-/g, " "),
        lessons: [],
        diagnosticInfo: {
          error: "Cannot access lessons table",
          errorDetails: sampleLessonsError.message,
          sampleLessons: null,
        },
      }
    }

    console.log("Sample lessons (first 5):", sampleLessons)

    if (!sampleLessons || sampleLessons.length === 0) {
      console.log("No lessons found in the database at all")
      return {
        subjectName: slug.replace(/-/g, " "),
        lessons: [],
        diagnosticInfo: {
          error: "No lessons in database",
          sampleLessons: [],
        },
      }
    }

    // Try to get all subjects
    const { data: subjects, error: subjectsError } = await supabase.from("subjects").select("subject_id, name")

    if (subjectsError) {
      console.error("Error fetching subjects:", subjectsError)
      // If we can't get subjects, let's try to get lessons directly
      const { data: directLessons, error: directLessonsError } = await supabase
        .from("lessons")
        .select("*")
        .order("lesson_name", { ascending: true })
        .limit(20)

      if (directLessonsError) {
        console.error("Error fetching direct lessons:", directLessonsError)
        return {
          subjectName: slug.replace(/-/g, " "),
          lessons: [],
          diagnosticInfo: {
            error: "Cannot fetch subjects or direct lessons",
            subjectsError: subjectsError.message,
            directLessonsError: directLessonsError.message,
            sampleLessons,
          },
        }
      }

      console.log(`Found ${directLessons?.length || 0} direct lessons without subject filtering`)
      return {
        subjectName: slug.replace(/-/g, " "),
        lessons: directLessons || [],
        diagnosticInfo: {
          note: "Using direct lessons without subject filtering",
          subjectsError: subjectsError.message,
          sampleLessons,
          directLessons,
        },
      }
    }

    console.log("All subjects:", subjects)

    // Try different ways to match the slug to a subject
    let matchingSubject = null

    // 1. Direct match on name
    matchingSubject = subjects?.find((s) => s.name.toLowerCase() === slug.toLowerCase())
    if (matchingSubject) console.log("Found direct match on name:", matchingSubject)

    // 2. Match on hyphenated name
    if (!matchingSubject) {
      matchingSubject = subjects?.find((s) => s.name.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase())
      if (matchingSubject) console.log("Found match on hyphenated name:", matchingSubject)
    }

    // 3. Match on name with spaces instead of hyphens
    if (!matchingSubject) {
      const slugWithSpaces = slug.replace(/-/g, " ")
      matchingSubject = subjects?.find((s) => s.name.toLowerCase() === slugWithSpaces.toLowerCase())
      if (matchingSubject) console.log("Found match on name with spaces:", matchingSubject)
    }

    // 4. Partial match
    if (!matchingSubject) {
      matchingSubject = subjects?.find(
        (s) => slug.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(slug.toLowerCase()),
      )
      if (matchingSubject) console.log("Found partial match:", matchingSubject)
    }

    // If we still don't have a match, try to get the subject_id from invitation_code_usage_view
    if (!matchingSubject) {
      console.log("Trying to find subject_id in invitation_code_usage_view for slug:", slug)

      // Try with spaces instead of hyphens
      const slugWithSpaces = slug.replace(/-/g, " ")

      const { data: invitationData, error: invitationError } = await supabase
        .from("invitation_code_usage_view")
        .select("name, subject_id")
        .or(`name.ilike.%${slug}%,name.ilike.%${slugWithSpaces}%`)

      if (invitationError) {
        console.error("Error querying invitation_code_usage_view:", invitationError)
      } else {
        console.log("Invitation data for slug:", invitationData)

        if (invitationData && invitationData.length > 0) {
          const subjectId = invitationData[0].subject_id

          // Find the subject with this ID
          matchingSubject = subjects?.find((s) => s.subject_id === subjectId)

          if (!matchingSubject && subjectId) {
            // If we have a subject_id but no matching subject, create a placeholder
            matchingSubject = { subject_id: subjectId, name: invitationData[0].name || slug }
            console.log("Created placeholder subject from invitation data:", matchingSubject)
          }
        }
      }
    }

    // If we still don't have a match, use the first subject as a fallback
    if (!matchingSubject && subjects && subjects.length > 0) {
      console.log("No matching subject found, using first subject as fallback")
      matchingSubject = subjects[0]
    }

    // If we still don't have a subject, create a placeholder
    if (!matchingSubject) {
      console.log("No subjects found at all, creating placeholder")
      matchingSubject = { subject_id: "unknown", name: slug.replace(/-/g, " ") }

      // Since we couldn't find a subject, let's return all lessons as a fallback
      const { data: allLessons, error: allLessonsError } = await supabase
        .from("lessons")
        .select("*")
        .order("lesson_name", { ascending: true })
        .limit(20)

      if (allLessonsError) {
        console.error("Error fetching all lessons:", allLessonsError)
      } else {
        console.log(`Found ${allLessons?.length || 0} lessons without subject filtering`)
        return {
          subjectName: matchingSubject.name,
          lessons: allLessons || [],
          diagnosticInfo: {
            note: "Using all lessons without subject filtering",
            matchingSubject,
            sampleLessons,
          },
        }
      }
    }

    console.log("Using subject:", matchingSubject)

    // Now get lessons for this subject
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("*")
      .eq("subject_id", matchingSubject.subject_id)
      .order("lesson_name", { ascending: true })

    if (lessonsError) {
      console.error("Error fetching lessons for subject:", lessonsError)

      // Try a more permissive query as fallback
      const { data: fallbackLessons, error: fallbackError } = await supabase
        .from("lessons")
        .select("*")
        .order("lesson_name", { ascending: true })
        .limit(20)

      if (fallbackError) {
        console.error("Error fetching fallback lessons:", fallbackError)
        return {
          subjectName: matchingSubject.name,
          lessons: [],
          diagnosticInfo: {
            error: "Cannot fetch lessons for subject or fallback lessons",
            lessonsError: lessonsError.message,
            fallbackError: fallbackError.message,
            matchingSubject,
            sampleLessons,
          },
        }
      }

      console.log(`Found ${fallbackLessons?.length || 0} fallback lessons without subject filtering`)
      return {
        subjectName: matchingSubject.name,
        lessons: fallbackLessons || [],
        diagnosticInfo: {
          note: "Using fallback lessons without subject filtering",
          lessonsError: lessonsError.message,
          matchingSubject,
          sampleLessons,
          fallbackLessons,
        },
      }
    }

    console.log(
      `Found ${lessons?.length || 0} lessons for subject ${matchingSubject.name} (ID: ${matchingSubject.subject_id})`,
    )

    // If no lessons found with the subject_id, try a more permissive query
    if (!lessons || lessons.length === 0) {
      console.log("No lessons found with exact subject_id match, trying fallback query")

      // Try a more permissive query as fallback
      const { data: fallbackLessons, error: fallbackError } = await supabase
        .from("lessons")
        .select("*")
        .order("lesson_name", { ascending: true })
        .limit(20)

      if (fallbackError) {
        console.error("Error fetching fallback lessons:", fallbackError)
        return {
          subjectName: matchingSubject.name,
          lessons: [],
          diagnosticInfo: {
            error: "No lessons for subject and cannot fetch fallback lessons",
            fallbackError: fallbackError.message,
            matchingSubject,
            sampleLessons,
          },
        }
      }

      console.log(`Found ${fallbackLessons?.length || 0} fallback lessons without subject filtering`)
      return {
        subjectName: matchingSubject.name,
        lessons: fallbackLessons || [],
        diagnosticInfo: {
          note: "Using fallback lessons without subject filtering",
          matchingSubject,
          sampleLessons,
          fallbackLessons,
        },
      }
    }

    return {
      subjectName: matchingSubject.name,
      lessons: lessons || [],
      diagnosticInfo: {
        note: "Successfully found lessons for subject",
        matchingSubject,
        lessonCount: lessons?.length || 0,
      },
    }
  } catch (error) {
    console.error("Unexpected error in getLessonsForSlug:", error)
    return {
      subjectName: slug.replace(/-/g, " "),
      lessons: [],
      diagnosticInfo: {
        error: "Unexpected error in getLessonsForSlug",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

export default async function LessonsPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { subjectName, lessons, diagnosticInfo } = await getLessonsForSlug(slug)

  // Format the subject name for display
  const formattedSubjectName = capitalizeText(subjectName || slug.replace(/-/g, " "))

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{formattedSubjectName} Lessons</h1>
      </div>

      {/* Temporary diagnostic information - REMOVE AFTER DEBUGGING */}
      {process.env.NODE_ENV !== "production" && diagnosticInfo && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4 text-sm">
          <h3 className="font-bold mb-2">Diagnostic Information:</h3>
          <pre className="whitespace-pre-wrap overflow-auto max-h-40">{JSON.stringify(diagnosticInfo, null, 2)}</pre>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Lesson Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length > 0 ? (
              lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium">{lesson.lesson_name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" asChild title="View">
                        <Link href={`/${slug}/lessons/${lesson.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" asChild title="Assign">
                        <Link href={`/${slug}/lessons/${lesson.id}/assign`}>
                          <Send className="h-4 w-4" />
                          <span className="sr-only">Assign</span>
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" asChild title="Stats">
                        <Link href={`/${slug}/lessons/${lesson.id}/stats`}>
                          <BarChart3 className="h-4 w-4" />
                          <span className="sr-only">Stats</span>
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  No lessons found for this subject.
                  {/* Show a more detailed message in non-production environments */}
                  {process.env.NODE_ENV !== "production" && diagnosticInfo?.error && (
                    <div className="mt-2 text-sm text-gray-500">Reason: {diagnosticInfo.error}</div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
