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

async function getClassesForSlug(slug: string) {
  try {
    console.log(`Getting classes for slug: ${slug}`)

    // Get current authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      console.error("Error getting authenticated user:", authError)
      return { classes: [], subjectName: slug.replace(/-/g, " ") }
    }

    const userId = authData.user.id
    console.log(`Current authenticated user ID: ${userId}`)

    // First, get the subject_id from the invitation_code_usage_view table
    const { data: subjectData, error: subjectError } = await supabase
      .from("invitation_code_usage_view")
      .select("subject_id, name")
      .ilike("name", slug.replace(/-/g, " "))
      .limit(1)

    if (subjectError) {
      console.error("Error fetching from invitation_code_usage_view:", subjectError)
      return { classes: [], subjectName: slug.replace(/-/g, " ") }
    }

    if (!subjectData || subjectData.length === 0) {
      console.log("No subject found in invitation_code_usage_view, trying subjects table")

      // Try to find the subject directly in the subjects table
      const { data: directSubjectData, error: directSubjectError } = await supabase
        .from("subjects")
        .select("subject_id, name")
        .or(`name.ilike.${slug.replace(/-/g, " ")},name.ilike.${slug.replace(/-/g, "%")}`)
        .limit(1)

      if (directSubjectError || !directSubjectData || directSubjectData.length === 0) {
        console.error("Error or no results from subjects table:", directSubjectError)
        return { classes: [], subjectName: slug.replace(/-/g, " ") }
      }

      subjectData[0] = directSubjectData[0]
    }

    const subjectId = subjectData[0]?.subject_id
    const subjectName = subjectData[0]?.name || slug.replace(/-/g, " ")

    console.log(`Found subject: ${subjectName} with ID: ${subjectId}`)

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
      return { classes: [], subjectName }
    }

    console.log(`Found ${classes?.length || 0} classes for subject: ${subjectName} and teacher: ${userId}`)

    return {
      classes: (classes as ClassItem[]) || [],
      subjectName,
    }
  } catch (error) {
    console.error("Error in getClassesForSlug:", error)
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
