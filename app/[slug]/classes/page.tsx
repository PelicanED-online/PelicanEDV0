import Link from "next/link"
import { Eye, Pencil, Trash, Plus } from "lucide-react"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { capitalizeText } from "@/lib/utils"

interface ClassItem {
  id: string
  class_name: string
  subject_id: string
  teacher_id: string
  created_at: string
}

interface Subject {
  subject_id: string
  name: string
}

async function getClassesForSlug(slug: string) {
  console.log("Getting classes for slug:", slug)

  try {
    // Create a server component client with cookies
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    // Check authentication state
    const {
      data: { session },
    } = await supabase.auth.getSession()
    console.log("Authentication state in getClassesForSlug:", !!session)

    if (!session) {
      console.log("No authenticated session found in getClassesForSlug")
      return {
        subjectName: slug.replace(/-/g, " "),
        classes: [],
        diagnosticInfo: {
          error: "No authenticated session",
          authenticated: false,
        },
      }
    }

    // Get the current user ID
    const userId = session.user.id
    console.log("Current user ID:", userId)

    // First, check if we can access the classes table at all
    const { data: sampleClasses, error: sampleClassesError } = await supabase.from("classes").select("*").limit(5)

    if (sampleClassesError) {
      console.error("Error accessing classes table:", sampleClassesError)
      return {
        subjectName: slug.replace(/-/g, " "),
        classes: [],
        diagnosticInfo: {
          error: "Cannot access classes table",
          errorDetails: sampleClassesError.message,
          authenticated: !!session,
        },
      }
    }

    console.log("Sample classes (first 5):", sampleClasses)

    // Try to get all subjects
    const { data: subjects, error: subjectsError } = await supabase.from("subjects").select("subject_id, name")

    if (subjectsError) {
      console.error("Error fetching subjects:", subjectsError)
      return {
        subjectName: slug.replace(/-/g, " "),
        classes: [],
        diagnosticInfo: {
          error: "Cannot fetch subjects",
          subjectsError: subjectsError.message,
          authenticated: !!session,
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
    }

    console.log("Using subject:", matchingSubject)

    // Now get classes for this subject and teacher
    const { data: classes, error: classesError } = await supabase
      .from("classes")
      .select("*")
      .eq("subject_id", matchingSubject.subject_id)
      .eq("teacher_id", userId)
      .order("class_name", { ascending: true })

    if (classesError) {
      console.error("Error fetching classes:", classesError)
      return {
        subjectName: matchingSubject.name,
        classes: [],
        diagnosticInfo: {
          error: "Cannot fetch classes for subject and teacher",
          classesError: classesError.message,
          matchingSubject,
          authenticated: !!session,
        },
      }
    }

    console.log(
      `Found ${classes?.length || 0} classes for subject ${matchingSubject.name} (ID: ${matchingSubject.subject_id}) and teacher ${userId}`,
    )

    return {
      subjectName: matchingSubject.name,
      classes: classes || [],
      diagnosticInfo: {
        note: "Successfully found classes for subject and teacher",
        matchingSubject,
        classCount: classes?.length || 0,
        authenticated: !!session,
      },
    }
  } catch (error) {
    console.error("Unexpected error in getClassesForSlug:", error)
    return {
      subjectName: slug.replace(/-/g, " "),
      classes: [],
      diagnosticInfo: {
        error: "Unexpected error in getClassesForSlug",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

export default async function ClassesPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { subjectName, classes, diagnosticInfo } = await getClassesForSlug(slug)

  // Format the subject name for display
  const formattedSubjectName = capitalizeText(subjectName || slug.replace(/-/g, " "))

  // Check authentication state directly in the page component
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{formattedSubjectName} Classes</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Authentication status indicator - visible in all environments */}
      <div className="bg-blue-50 border border-blue-200 p-2 rounded-md text-sm">
        <p>Authentication status: {session ? "Authenticated" : "Not authenticated"}</p>
      </div>

      {/* Temporary diagnostic information - REMOVE AFTER DEBUGGING */}
      {diagnosticInfo && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4 text-sm">
          <h3 className="font-bold mb-2">Diagnostic Information:</h3>
          <pre className="whitespace-pre-wrap overflow-auto max-h-40">{JSON.stringify(diagnosticInfo, null, 2)}</pre>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Class Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length > 0 ? (
              classes.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium">{classItem.class_name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" asChild title="View">
                        <Link href={`/${slug}/classes/${classItem.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" asChild title="Edit">
                        <Link href={`/${slug}/classes/${classItem.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button variant="outline" size="icon" title="Delete">
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  {session ? (
                    <>
                      No classes found for this subject.
                      {diagnosticInfo?.error && (
                        <div className="mt-2 text-sm text-gray-500">Reason: {diagnosticInfo.error}</div>
                      )}
                    </>
                  ) : (
                    <div>
                      <p className="mb-2">You need to be logged in to view classes.</p>
                      <Button asChild>
                        <Link href="/login">Log In</Link>
                      </Button>
                    </div>
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
