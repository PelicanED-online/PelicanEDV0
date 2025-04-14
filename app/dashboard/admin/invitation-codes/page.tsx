"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Plus, Pencil } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AddInvitationCodeModal } from "@/components/invitation-codes/add-invitation-code-modal"
import { EditInvitationCodeModal } from "@/components/invitation-codes/edit-invitation-code-modal"
import { Toaster } from "@/components/ui/toaster"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InvitationCode {
  invitation_code_id: string
  invitation_code: string
  role: string
  subject_id: string
  district_id: string | null
  academic_year_id: string
  created_by: string
  number_of_uses: number | null
  created_at: string
  code_type: string
}

interface Subject {
  subject_id: string
  name: string
}

interface District {
  district_id: string
  district_name: string
}

interface AcademicYear {
  academic_year_id: string
  year_range: string
  expiry_date: string | null
}

interface CodeUsage {
  [key: string]: number // Maps invitation_code_id to count of uses
}

export default function InvitationCodesPage() {
  const [codes, setCodes] = useState<InvitationCode[]>([])
  const [filteredCodes, setFilteredCodes] = useState<InvitationCode[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [codeUsages, setCodeUsages] = useState<CodeUsage>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState<InvitationCode | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("all")
  const [selectedCodeType, setSelectedCodeType] = useState<string>("admin")
  const { toast } = useToast()

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
        }
      } catch (err) {
        console.error("Error fetching current user:", err)
      }
    }

    fetchCurrentUser()
    fetchData()
  }, [])

  // Filter codes when district selection, code type, or codes change
  useEffect(() => {
    let filtered = codes

    // Filter by code type
    filtered = filtered.filter((code) => code.code_type === selectedCodeType)

    // Filter by district if not "all"
    if (selectedDistrictId !== "all") {
      filtered = filtered.filter((code) => code.district_id === selectedDistrictId)
    }

    setFilteredCodes(filtered)
  }, [selectedDistrictId, selectedCodeType, codes])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch invitation codes
      console.log("Fetching invitation codes...")
      const { data: codesData, error: codesError } = await supabase
        .from("invitation_codes")
        .select("*")
        .order("created_at", { ascending: false })

      if (codesError) {
        console.error("Supabase error fetching codes:", codesError)
        setError(codesError.message)
        toast({
          title: "Error",
          description: `Failed to load invitation codes: ${codesError.message}`,
          variant: "destructive",
        })
        return
      }

      // Fetch subjects
      console.log("Fetching subjects...")
      const { data: subjectsData, error: subjectsError } = await supabase.from("subjects").select("*")

      if (subjectsError) {
        console.error("Supabase error fetching subjects:", subjectsError)
        setError(subjectsError.message)
        toast({
          title: "Error",
          description: `Failed to load subjects: ${subjectsError.message}`,
          variant: "destructive",
        })
        return
      }

      // Fetch districts
      console.log("Fetching districts...")
      const { data: districtsData, error: districtsError } = await supabase
        .from("districts")
        .select("*")
        .order("district_name", { ascending: true })

      if (districtsError) {
        console.error("Supabase error fetching districts:", districtsError)
        setError(districtsError.message)
        toast({
          title: "Error",
          description: `Failed to load districts: ${districtsError.message}`,
          variant: "destructive",
        })
        return
      }

      // Fetch academic years
      console.log("Fetching academic years...")
      const { data: academicYearsData, error: academicYearsError } = await supabase
        .from("academic_years")
        .select("academic_year_id, year_range, expiry_date")

      if (academicYearsError) {
        console.error("Supabase error fetching academic years:", academicYearsError)
        setError(academicYearsError.message)
        toast({
          title: "Error",
          description: `Failed to load academic years: ${academicYearsError.message}`,
          variant: "destructive",
        })
        return
      }

      // Fetch invitation code uses
      console.log("Fetching invitation code uses...")
      const { data: usesData, error: usesError } = await supabase.from("invitation_code_uses").select("*")

      if (usesError) {
        console.error("Supabase error fetching code uses:", usesError)
        setError(usesError.message)
        toast({
          title: "Error",
          description: `Failed to load code usage data: ${usesError.message}`,
          variant: "destructive",
        })
        return
      }

      // Process code usage data
      const usageCounts: CodeUsage = {}
      if (usesData) {
        usesData.forEach((use) => {
          if (use.invitation_code_id) {
            usageCounts[use.invitation_code_id] = (usageCounts[use.invitation_code_id] || 0) + 1
          }
        })
      }

      console.log("Fetched invitation codes:", codesData)
      console.log("Fetched subjects:", subjectsData)
      console.log("Fetched districts:", districtsData)
      console.log("Fetched academic years:", academicYearsData)
      console.log("Processed code usages:", usageCounts)

      // Set default code_type to "admin" if not present
      const codesWithType = (codesData || []).map((code) => ({
        ...code,
        code_type: code.code_type || "admin", // Default to "admin" if code_type is not set
      }))

      setCodes(codesWithType)
      // Initial filtering will be done by the useEffect
      setSubjects(subjectsData || [])
      setDistricts(districtsData || [])
      setAcademicYears(academicYearsData || [])
      setCodeUsages(usageCounts)

      // Removed success toast
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      console.error("Error fetching data:", err)
      setError(errorMessage)
      toast({
        title: "Error",
        description: `Failed to load data: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCode = async (codeData: Omit<InvitationCode, "invitation_code_id" | "created_at" | "code_type">) => {
    try {
      // Add code_type based on the current tab
      const codeWithType = {
        ...codeData,
        code_type: selectedCodeType,
      }

      const { data, error } = await supabase.from("invitation_codes").insert([codeWithType]).select()

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Invitation code generated successfully!",
      })

      // Refresh the codes list
      fetchData()
      return true
    } catch (error: any) {
      console.error("Error adding invitation code:", error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to generate invitation code. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleUpdateCode = async (codeId: string, codeData: Partial<InvitationCode>) => {
    try {
      const { error } = await supabase.from("invitation_codes").update(codeData).eq("invitation_code_id", codeId)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Invitation code updated successfully!",
      })

      // Refresh the codes list
      fetchData()
      return true
    } catch (error: any) {
      console.error("Error updating invitation code:", error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to update invitation code. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        toast({
          title: "Copied!",
          description: `Code ${code} copied to clipboard`,
        })
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        toast({
          title: "Error",
          description: "Failed to copy code to clipboard",
          variant: "destructive",
        })
      })
  }

  const openEditModal = (code: InvitationCode) => {
    setSelectedCode(code)
    setIsEditModalOpen(true)
  }

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return "N/A"
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }

  // Helper function to get subject name from subject_id
  const getSubjectName = (subjectId: string) => {
    if (!subjectId) return "N/A"
    const subject = subjects.find((s) => s.subject_id === subjectId)
    return subject ? subject.name : "Unknown Subject"
  }

  // Helper function to get district name from district_id
  const getDistrictName = (districtId: string | null) => {
    if (!districtId) return "N/A"
    const district = districts.find((d) => d.district_id === districtId)
    return district ? district.district_name : "Unknown District"
  }

  // Helper function to get expiry date from academic_year_id
  const getExpiryDate = (academicYearId: string) => {
    if (!academicYearId) return "N/A"
    const academicYear = academicYears.find((ay) => ay.academic_year_id === academicYearId)

    if (!academicYear || !academicYear.expiry_date) return "N/A"

    // Format the date to be more readable
    const date = new Date(academicYear.expiry_date)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Helper function to check if a code is expired
  const isCodeExpired = (academicYearId: string) => {
    if (!academicYearId) return false
    const academicYear = academicYears.find((ay) => ay.academic_year_id === academicYearId)

    if (!academicYear || !academicYear.expiry_date) return false

    const expiryDate = new Date(academicYear.expiry_date)
    const today = new Date()

    // Set hours, minutes, seconds, and milliseconds to 0 for today to compare just the dates
    today.setHours(0, 0, 0, 0)

    return today > expiryDate
  }

  // Helper function to format code usage
  const formatCodeUsage = (codeId: string, maxUses: number | null) => {
    const usedCount = codeUsages[codeId] || 0
    const totalUses = maxUses === null ? "∞" : maxUses.toString()
    return `${usedCount}/${totalUses}`
  }

  // Helper function to determine code status
  const getCodeStatus = (codeId: string, maxUses: number | null, academicYearId: string) => {
    // First check if the code is expired
    if (isCodeExpired(academicYearId)) {
      return { status: "Expired", isAvailable: false, isExpired: true }
    }

    const usedCount = codeUsages[codeId] || 0

    // If maxUses is null, it means unlimited uses, so always available
    if (maxUses === null) return { status: "Available", isAvailable: true, isExpired: false }

    // If used count equals or exceeds max uses, it's unavailable
    if (usedCount >= maxUses) return { status: "Unavailable", isAvailable: false, isExpired: false }

    // Otherwise it's available
    return { status: "Available", isAvailable: true, isExpired: false }
  }

  const handleDeleteCode = async (codeId: string) => {
    try {
      // First check if the code has been used by counting records with matching invitation_code_id
      // Using the correct column names from the schema
      const { data, error: countError } = await supabase
        .from("invitation_code_uses")
        .select("id")
        .eq("invitation_code_id", codeId)

      if (countError) {
        throw countError
      }

      // If the code has been used (data array has items), we should not delete it
      if (data && data.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This invitation code has already been used and cannot be deleted.",
          variant: "destructive",
        })
        return false
      }

      // If the code hasn't been used, proceed with deletion
      const { error } = await supabase.from("invitation_codes").delete().eq("invitation_code_id", codeId)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Invitation code deleted successfully!",
      })

      // Refresh the codes list
      fetchData()
      return true
    } catch (error: any) {
      console.error("Error deleting invitation code:", error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to delete invitation code. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 w-full p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Invitation Codes</h1>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Generate New Code
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <Tabs
                defaultValue="admin"
                value={selectedCodeType}
                onValueChange={setSelectedCodeType}
                className="w-full md:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="admin">Admin Created</TabsTrigger>
                  <TabsTrigger value="teacher">Teacher Created</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={selectedDistrictId} onValueChange={setSelectedDistrictId}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by district" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Districts</SelectItem>
                    {districts.map((district) => (
                      <SelectItem key={district.district_id} value={district.district_id}>
                        {district.district_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4">
                <p>Error: {error}</p>
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        {codes.length === 0
                          ? "No invitation codes found"
                          : `No ${selectedCodeType} invitation codes match the selected filter`}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCodes.map((code) => {
                      const { status, isAvailable, isExpired } = getCodeStatus(
                        code.invitation_code_id,
                        code.number_of_uses,
                        code.academic_year_id,
                      )
                      return (
                        <TableRow key={code.invitation_code_id}>
                          <TableCell className="font-medium">{code.invitation_code || "N/A"}</TableCell>
                          <TableCell className="capitalize">{capitalizeFirstLetter(code.role)}</TableCell>
                          <TableCell>{getSubjectName(code.subject_id)}</TableCell>
                          <TableCell>{getDistrictName(code.district_id)}</TableCell>
                          <TableCell>{formatCodeUsage(code.invitation_code_id, code.number_of_uses)}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                isExpired
                                  ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                  : isAvailable
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
                              )}
                            >
                              {status}
                            </span>
                          </TableCell>
                          <TableCell>{getExpiryDate(code.academic_year_id)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(code.invitation_code)}
                                disabled={isExpired || !isAvailable}
                              >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Copy code</span>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(code)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit code</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Invitation Code Modal */}
      <AddInvitationCodeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCode={handleAddCode}
        currentUserId={currentUserId}
      />

      {/* Edit Invitation Code Modal */}
      <EditInvitationCodeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateCode={handleUpdateCode}
        onDeleteCode={handleDeleteCode}
        invitationCode={selectedCode}
      />

      {/* Add Toaster component */}
      <Toaster />
    </DashboardLayout>
  )
}
