"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { ArrowLeft, BookOpen } from "lucide-react"
import { AddUnitModal } from "@/components/curriculum/add-unit-modal"
import { EditUnitModal } from "@/components/curriculum/edit-unit-modal"
import { Toaster } from "@/components/ui/toaster"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { generateSlug } from "@/lib/utils"

interface Subject {
  subject_id: string
  name: string
  curriculum_title: string | null
  curriculum_description: string | null
}

// Updated to match the actual database structure
interface Unit {
  unit_id: string
  subject_id: string
  name: string
  unit_title: string | null
}

export default function CurriculumViewPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [units, setUnits] = useState<Unit[]>([])

  const fetchUnits = async (subjectId: string) => {
    try {
      const { data, error } = await supabase
        .from("units")
        .select("unit_id, subject_id, name, unit_title") // Select the correct columns
        .eq("subject_id", subjectId)
        .order("name")

      if (error) throw error

      setUnits(data || [])

      // Force a router refresh to ensure navigation works
      router.refresh()
    } catch (error) {
      console.error("Error fetching units:", error)
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
        const { data, error } = await supabase
          .from("subjects")
          .select("subject_id, name, curriculum_title, curriculum_description")

        if (error) {
          console.error("Error fetching subjects:", error)
          router.push("/curriculum")
          return
        }

        // Find the subject with the matching slug
        const foundSubject = data.find((subject) => {
          const subjectSlug = generateSlug(subject.name)
          return subjectSlug === slug
        })

        if (!foundSubject) {
          console.error("Subject not found with slug:", slug)
          router.push("/curriculum")
          return
        }

        setSubject(foundSubject)

        // Fetch units for this subject
        await fetchUnits(foundSubject.subject_id)
      } catch (error) {
        console.error("Error in loadUserAndData:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndData()
  }, [router, slug])

  const handleBack = () => {
    router.push("/curriculum")
  }

  const handleUnitUpdated = () => {
    if (subject) {
      fetchUnits(subject.subject_id)
    }
  }

  const handleViewChapters = (unit: Unit) => {
    const unitSlug = generateSlug(unit.name)
    router.push(`/curriculum/${slug}/${unitSlug}`)
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

  if (!subject) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-4 w-full p-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={handleBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Curriculum Not Found</h1>
          </div>
          <p className="text-muted-foreground">The requested curriculum could not be found.</p>
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
            <h1 className="text-3xl font-bold tracking-tight">{subject.name}</h1>
          </div>
          <AddUnitModal subjectId={subject.subject_id} onUnitAdded={handleUnitUpdated} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{subject.curriculum_title || "No title provided"}</CardTitle>
            <CardDescription>Curriculum Details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Description</h3>
                <p className="mt-1 text-muted-foreground">
                  {subject.curriculum_description || "No description available"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Units</h2>

          {units.length === 0 ? (
            <div className="text-center py-10 bg-muted rounded-md">
              <p className="text-muted-foreground">No units found. Add your first unit to get started.</p>
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.unit_id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>{unit.unit_title || "No title"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <EditUnitModal unit={unit} onUnitUpdated={handleUnitUpdated} />
                          <Button variant="outline" size="sm" onClick={() => handleViewChapters(unit)}>
                            <BookOpen className="h-4 w-4" />
                            <span className="sr-only md:not-sr-only md:ml-2">Chapters</span>
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

