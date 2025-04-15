"use client"

import { useEffect, useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface AcademicYear {
  academic_year_id: string
  year_range: string
  expiry_date: string | null
}

export default function SettingsClient() {
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAcademicYear() {
      try {
        setLoading(true)

        // First, get the academic_year_id from site_settings
        const { data: siteSettings, error: siteError } = await supabase
          .from("site_settings")
          .select("academic_year_id")
          .single()

        if (siteError) {
          throw new Error(`Error fetching site settings: ${siteError.message}`)
        }

        if (!siteSettings?.academic_year_id) {
          setAcademicYear(null)
          return
        }

        // Then, get the academic year details
        const { data: academicYearData, error: academicYearError } = await supabase
          .from("academic_years")
          .select("academic_year_id, year_range, expiry_date")
          .eq("academic_year_id", siteSettings.academic_year_id)
          .single()

        if (academicYearError) {
          throw new Error(`Error fetching academic year: ${academicYearError.message}`)
        }

        setAcademicYear(academicYearData)
      } catch (err) {
        console.error("Error fetching academic year:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchAcademicYear()
  }, [])

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Academic Year</CardTitle>
          <CardDescription>The current academic year used throughout the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          ) : error ? (
            <div className="text-red-500">
              <p>Error loading academic year information:</p>
              <p>{error}</p>
            </div>
          ) : !academicYear ? (
            <p className="text-muted-foreground">No academic year is currently set.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-lg">{academicYear.year_range}</span>
              </div>
              {academicYear.expiry_date && (
                <p className="text-sm text-muted-foreground">Expires on: {formatDate(academicYear.expiry_date)}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
