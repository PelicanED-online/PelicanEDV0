"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditSiteSettingsModal } from "@/components/settings/edit-site-settings-modal"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

export default function SettingsClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [academicYear, setAcademicYear] = useState("")
  const [academicYearId, setAcademicYearId] = useState<string | null>(null)
  const [siteSettingsId, setSiteSettingsId] = useState<number | null>(null)
  const [expiryDate, setExpiryDate] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Function to refresh data without page reload
  const refreshData = useCallback(() => {
    setLoading(true)
    setRefreshKey((prevKey) => prevKey + 1)
  }, [])

  // Function to fetch settings data
  const fetchSettings = useCallback(async () => {
    try {
      // Fetch the site settings to get the current academic year ID
      const { data: siteSettingsData, error: siteSettingsError } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)

      if (siteSettingsError) {
        console.error("Error fetching site settings:", siteSettingsError)
      } else if (siteSettingsData && siteSettingsData.length > 0) {
        console.log("Site settings data:", siteSettingsData[0])
        setSiteSettingsId(siteSettingsData[0].id)

        const currentAcademicYearId = siteSettingsData[0].academic_year_id
        setAcademicYearId(currentAcademicYearId)

        if (currentAcademicYearId) {
          // Fetch the academic year details
          const { data: academicYearData, error: academicYearError } = await supabase
            .from("academic_years")
            .select("*")
            .eq("academic_year_id", currentAcademicYearId)
            .single()

          if (academicYearError) {
            console.error("Error fetching academic year details:", academicYearError)
          } else if (academicYearData) {
            console.log("Academic year data:", academicYearData)
            setAcademicYear(academicYearData.year_range)
            setExpiryDate(academicYearData.expiry_date)
          }
        }
      }
    } catch (fetchError) {
      console.error("Exception fetching settings:", fetchError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser()

        // Handle different data structures
        const role = user?.userInfo?.role || user?.userInfo?.data?.role

        if (!user || role !== "admin") {
          router.push("/login")
          return
        }

        setIsAuthorized(true)
        await fetchSettings()
      } catch (error) {
        console.error("Error checking auth:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router, fetchSettings, refreshKey])

  const handleSettingsSaved = () => {
    toast({
      title: "Success",
      description: "Academic year updated successfully",
    })
    setIsEditModalOpen(false)
    refreshData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pelican"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicYear || "Not set"}</div>
            <p className="text-xs text-muted-foreground">
              Current academic year for all schools
              {expiryDate && ` (Expires: ${new Date(expiryDate).toLocaleDateString()})`}
            </p>
            <div className="mt-4">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isEditModalOpen}
                data-state={isEditModalOpen ? "open" : "closed"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-pencil mr-2 h-4 w-4"
                >
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
                  <path d="m15 5 4 4"></path>
                </svg>
                Edit
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditSiteSettingsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentAcademicYearId={academicYearId}
        siteSettingsId={siteSettingsId}
        onSaved={handleSettingsSaved}
      />

      <Toaster />
    </>
  )
}

