import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Eye, Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ClassItem {
  id: string
  class_name: string
  subject_id: string
  teacher_id: string
  created_at: string
}

// Replace the existing getClassesForSlug function with this enhanced version:
async function getClassesForSlug(slug: string) {
  try {
    console.log(`Getting classes for slug: ${slug}`)
    console.log(
      "Environment check - NEXT_PUBLIC_SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
    )

    // Get current authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Error getting authenticated user:", authError)
      return { classes: [], subjectName: slug.replace(/-/g, " ") }
    }

    if (!authData || !authData.user) {
      console.error("No authenticated user found")
      return { classes: [], subjectName: slug.replace(/-/g, " ") }
    }

    const userId = authData.user.id
    console.log(`Current authenticated user ID: ${userId}`)

    // First, check if the invitation_code_usage_view table has any data at all
    const { data: sampleViewData, error: sampleViewError } = await supabase
      .from("invitation_code_usage_view")
      .select("*")
      .limit(1)

    if (sampleViewError) {
      console.error("Error accessing invitation_code_usage_view table:", sampleViewError)
    } else {
      console.log("Sample data from invitation_code_usage_view:", sampleViewData)
    }

    // First, get the subject_id from the invitation_code_usage_view table
    const slugWithSpaces = slug.replace(/-/g, " ")
    const { data: subjectData, error: subjectError } = await supabase
      .from("invitation_code_usage_view")
      .select("subject_id, name")
      .or(`name.ilike.%${slug}%,name.ilike.%${slugWithSpaces}%`)
      .limit(1)

    if (subjectError) {
      console.error("Error fetching from invitation_code_usage_view:", subjectError)
    } else {
      console.log("Subject data from invitation_code_usage_view:", subjectData)
    }

    let subjectId = null
    let subjectName = slug.replace(/-/g, " ")

    if (subjectData && subjectData.length > 0) {
      subjectId = subjectData[0].subject_id
      subjectName = subjectData[0].name || subjectName
      console.log(`Found subject in invitation_code_usage_view: ${subjectName} with ID: ${subjectId}`)
    } else {
      console.log("No subject found in invitation_code_usage_view, trying subjects table")

      // Try to find the subject directly in the subjects table
      const { data: directSubjectData, error: directSubjectError } = await supabase
        .from("subjects")
        .select("subject_id, name")
        .or(`name.ilike.%${slug}%,name.ilike.%${slugWithSpaces}%`)
        .limit(1)

      if (directSubjectError) {
        console.error("Error fetching from subjects table:", directSubjectError)
      } else if (directSubjectData && directSubjectData.length > 0) {
        subjectId = directSubjectData[0].subject_id
        subjectName = directSubjectData[0].name || subjectName
        console.log(`Found subject in subjects table: ${subjectName} with ID: ${subjectId}`)
      } else {
        console.log("No subject found in subjects table either")

        // Get a sample of subjects to see what's available
        const { data: sampleSubjects } = await supabase.from("subjects").select("subject_id, name").limit(5)

        console.log("Sample subjects available:", sampleSubjects)
      }
    }

    if (!subjectId) {
      console.error("No subject_id found for slug:", slug)
      return { classes: [], subjectName }
    }

    // Now get classes for this subject AND where teacher_id matches the current user
    const { data: classes, error: classesError } = await supabase
      .from("classes")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("teacher_id", userId)
      .order("created_at", { ascending: false })

    if (classesError) {
      console.error("Error fetching classes:", classesError)
    } else {
      console.log(`Found ${classes?.length || 0} classes for subject: ${subjectName} and teacher: ${userId}`)
    }

    // If no classes found, check if the classes table has any data
    if (!classes || classes.length === 0) {
      const { data: sampleClasses, error: sampleClassesError } = await supabase.from("classes").select("*").limit(5)

      if (sampleClassesError) {
        console.error("Error fetching sample classes:", sampleClassesError)
      } else {
        console.log("Sample classes available:", sampleClasses)

        // Try a more permissive query without teacher_id filter
        const { data: subjectClasses, error: subjectClassesError } = await supabase
          .from("classes")
          .select("*")
          .eq("subject_id", subjectId)
          .limit(5)

        if (subjectClassesError) {
          console.error("Error fetching classes by subject only:", subjectClassesError)
        } else {
          console.log(`Classes for subject ${subjectId} without teacher filter:`, subjectClasses)
        }
      }
    }

    return {
      classes: (classes as ClassItem[]) || [],
      subjectName,
    }
  } catch (error) {
    console.error("Unexpected error in getClassesForSlug:", error)
    return { classes: [], subjectName: slug.replace(/-/g, " ") }
  }
}

export default async function ClassesPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { classes, subjectName } = await getClassesForSlug(slug)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{subjectName} Classes</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Class Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[150px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {classes.length > 0 ? (
                classes.map((classItem) => (
                  <tr
                    key={classItem.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle">{classItem.class_name}</td>
                    <td className="p-4 align-middle">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/${slug}/classes/${classItem.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/${slug}/classes/${classItem.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-muted-foreground">
                    No classes found for this subject.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
