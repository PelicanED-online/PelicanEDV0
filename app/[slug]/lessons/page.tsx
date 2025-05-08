import Link from "next/link"
import { Eye, Send, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { supabase } from "@/lib/supabase"

interface Lesson {
  id: string
  lesson_name: string
  chapter_id: string
  subject_id: string
}

interface Subject {
  subject_id: string // Changed from id to subject_id
  name: string
}

async function getLessonsForSlug(slug: string) {
  console.log("Getting lessons for slug:", slug)

  // First, check if the invitation_code_usage_view table has any data at all
  const { data: sampleData, error: sampleError } = await supabase
    .from("invitation_code_usage_view")
    .select("name, subject_id")
    .limit(1)

  if (sampleError) {
    console.error("Error accessing invitation_code_usage_view table:", sampleError)
    console.log("The invitation_code_usage_view table might not exist or is inaccessible")
  } else {
    console.log("Sample data from invitation_code_usage_view:", sampleData)
  }

  // Try to get all subjects first as our primary approach
  const { data: subjects, error: subjectsError } = await supabase.from("subjects").select("subject_id, name") // Changed from id to subject_id

  if (subjectsError) {
    console.error("Error fetching subjects:", subjectsError)
    return { subjectName: slug, lessons: [] }
  }

  console.log("All subjects:", subjects)

  // Try different ways to match the slug to a subject
  let matchingSubject = null

  // 1. Direct match on name
  matchingSubject = subjects?.find((s) => s.name.toLowerCase() === slug.toLowerCase())

  // 2. Match on hyphenated name
  if (!matchingSubject) {
    matchingSubject = subjects?.find((s) => s.name.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase())
  }

  // 3. Match on name with spaces instead of hyphens
  if (!matchingSubject) {
    const slugWithSpaces = slug.replace(/-/g, " ")
    matchingSubject = subjects?.find((s) => s.name.toLowerCase() === slugWithSpaces.toLowerCase())
  }

  // 4. Partial match
  if (!matchingSubject) {
    matchingSubject = subjects?.find(
      (s) => slug.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(slug.toLowerCase()),
    )
  }

  // If we still don't have a match, try to get the subject_id from invitation_code_usage_view
  if (!matchingSubject && sampleData && sampleData.length > 0) {
    console.log("Trying to find subject_id in invitation_code_usage_view for slug:", slug)

    const { data: invitationData } = await supabase
      .from("invitation_code_usage_view")
      .select("name, subject_id")
      .ilike("name", `%${slug}%`)

    console.log("Invitation data for slug:", invitationData)

    if (invitationData && invitationData.length > 0) {
      const subjectId = invitationData[0].subject_id

      // Find the subject with this ID
      matchingSubject = subjects?.find((s) => s.subject_id === subjectId) // Changed from id to subject_id

      if (!matchingSubject && subjectId) {
        // If we have a subject_id but no matching subject, create a placeholder
        matchingSubject = { subject_id: subjectId, name: invitationData[0].name || slug } // Changed from id to subject_id
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
    matchingSubject = { subject_id: "unknown", name: slug.replace(/-/g, " ") } // Changed from id to subject_id
  }

  console.log("Using subject:", matchingSubject)

  // Now get lessons for this subject
  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("*")
    .eq("subject_id", matchingSubject.subject_id) // Changed from id to subject_id
    .order("lesson_name", { ascending: true })

  if (lessonsError) {
    console.error("Error fetching lessons:", lessonsError)
    return {
      subjectName: matchingSubject.name,
      lessons: [],
    }
  }

  console.log(
    `Found ${lessons?.length || 0} lessons for subject ${matchingSubject.name} (ID: ${matchingSubject.subject_id})`,
  ) // Changed from id to subject_id

  return {
    subjectName: matchingSubject.name,
    lessons: lessons || [],
  }
}

export default async function LessonsPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { subjectName, lessons } = await getLessonsForSlug(slug)

  // Format the subject name for display
  const formattedSubjectName = subjectName
    ? subjectName.charAt(0).toUpperCase() + subjectName.slice(1)
    : slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{formattedSubjectName} Lessons</h1>
      </div>

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
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
