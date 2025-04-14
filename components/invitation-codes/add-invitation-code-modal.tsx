"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

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

interface AddInvitationCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCode: (codeData: any) => Promise<boolean>
  currentUserId: string
}

export function AddInvitationCodeModal({ isOpen, onClose, onAddCode, currentUserId }: AddInvitationCodeModalProps) {
  // Form state
  const [invitationCode, setInvitationCode] = useState("")
  const [role, setRole] = useState<string>("")
  const [subjectId, setSubjectId] = useState<string>("")
  const [districtId, setDistrictId] = useState<string>("")
  const [academicYearId, setAcademicYearId] = useState<string>("")
  const [numberOfUses, setNumberOfUses] = useState<string>("")
  const [unlimitedUses, setUnlimitedUses] = useState(false)

  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [existingCodes, setExistingCodes] = useState<string[]>([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSubjects()
      fetchDistricts()
      fetchAcademicYears()
      fetchExistingCodes()
    }
  }, [isOpen])

  // Fetch subjects from database
  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("subject_id, name")
        .order("name", { ascending: true })

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast({
        title: "Error",
        description: "Failed to load subjects. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch districts from database
  const fetchDistricts = async () => {
    try {
      const { data, error } = await supabase
        .from("districts")
        .select("district_id, district_name")
        .order("district_name", { ascending: true })

      if (error) throw error
      setDistricts(data || [])
    } catch (error) {
      console.error("Error fetching districts:", error)
      toast({
        title: "Error",
        description: "Failed to load districts. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch existing invitation codes
  const fetchExistingCodes = async () => {
    try {
      const { data, error } = await supabase.from("invitation_codes").select("invitation_code")

      if (error) throw error
      setExistingCodes((data || []).map((item) => item.invitation_code))

      // Generate a unique code after fetching existing codes
      generateRandomCode()
    } catch (error) {
      console.error("Error fetching existing codes:", error)
      toast({
        title: "Error",
        description: "Failed to load existing codes. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch academic years from database and set default from site settings
  const fetchAcademicYears = async () => {
    try {
      // Fetch academic years
      const { data: yearsData, error: yearsError } = await supabase
        .from("academic_years")
        .select("academic_year_id, year_range, expiry_date")
        .order("year_range", { ascending: false })

      if (yearsError) throw yearsError
      setAcademicYears(yearsData || [])

      // Fetch site settings to get default academic year
      const { data: settingsData, error: settingsError } = await supabase
        .from("site_settings")
        .select("academic_year_id")
        .single()

      if (settingsError && settingsError.code !== "PGRST116") throw settingsError

      // Set default to the site settings academic year if available
      if (settingsData && settingsData.academic_year_id) {
        setAcademicYearId(settingsData.academic_year_id)
      }
      // Otherwise set to the most recent academic year
      else if (yearsData && yearsData.length > 0) {
        setAcademicYearId(yearsData[0].academic_year_id)
      }
    } catch (error) {
      console.error("Error fetching academic years:", error)
      toast({
        title: "Error",
        description: "Failed to load academic years. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Generate a random unique invitation code
  const generateRandomCode = () => {
    setIsGeneratingCode(true)
    try {
      let isUnique = false
      let newCode = ""

      // Keep generating codes until we find a unique one
      while (!isUnique) {
        // Generate a random 6-character alphanumeric code (only capital letters and numbers)
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        newCode = ""
        for (let i = 0; i < 6; i++) {
          newCode += characters.charAt(Math.floor(Math.random() * characters.length))
        }

        // Check if the code already exists
        isUnique = !existingCodes.includes(newCode)
      }

      setInvitationCode(newCode)
    } catch (error) {
      console.error("Error generating code:", error)
      toast({
        title: "Error",
        description: "Failed to generate a random code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingCode(false)
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!invitationCode.trim()) {
      newErrors.invitationCode = "Invitation code is required"
    } else if (existingCodes.includes(invitationCode)) {
      newErrors.invitationCode = "This invitation code already exists. Please generate a new one."
    }

    if (!role) {
      newErrors.role = "Role is required"
    }

    if (!subjectId) {
      newErrors.subjectId = "Subject is required"
    }

    if (!districtId) {
      newErrors.districtId = "District is required"
    }

    if (!academicYearId) {
      newErrors.academicYearId = "Academic year is required"
    }

    if (!unlimitedUses && !numberOfUses) {
      newErrors.numberOfUses = "Number of uses is required unless unlimited"
    } else if (!unlimitedUses && Number.parseInt(numberOfUses) <= 0) {
      newErrors.numberOfUses = "Number of uses must be greater than 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const codeData = {
        invitation_code: invitationCode,
        role,
        subject_id: subjectId,
        district_id: districtId,
        academic_year_id: academicYearId,
        created_by: currentUserId,
        number_of_uses: unlimitedUses ? null : Number.parseInt(numberOfUses),
      }

      const success = await onAddCode(codeData)

      if (success) {
        toast({
          title: "Success",
          description: `Invitation code ${invitationCode} generated successfully!`,
        })
        onClose()
      }
    } catch (error) {
      console.error("Error adding invitation code:", error)
      toast({
        title: "Error",
        description: "Failed to generate invitation code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setInvitationCode("")
    setRole("")
    setSubjectId("")
    setDistrictId("")
    setAcademicYearId("")
    setNumberOfUses("")
    setUnlimitedUses(false)
    setErrors({})
  }

  // Check if manually entered code is unique
  const checkCodeUniqueness = (code: string) => {
    setInvitationCode(code)
    if (code && existingCodes.includes(code)) {
      setErrors({
        ...errors,
        invitationCode: "This invitation code already exists. Please use a different one.",
      })
    } else {
      const { invitationCode, ...restErrors } = errors
      setErrors(restErrors)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Generate New Invitation Code</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="invitationCode">
                  Invitation Code <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRandomCode}
                  disabled={isGeneratingCode}
                >
                  {isGeneratingCode ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Generate
                </Button>
              </div>
              <Input
                id="invitationCode"
                value={invitationCode}
                onChange={(e) => checkCodeUniqueness(e.target.value)}
                className={errors.invitationCode ? "border-red-500" : ""}
                maxLength={6}
              />
              {errors.invitationCode && <p className="text-red-500 text-sm">{errors.invitationCode}</p>}
              <p className="text-xs text-muted-foreground">6-character code using capital letters and numbers</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className={errors.role ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger id="subject" className={errors.subjectId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.subject_id} value={subject.subject_id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subjectId && <p className="text-red-500 text-sm">{errors.subjectId}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="district">
                District <span className="text-red-500">*</span>
              </Label>
              <Select value={districtId} onValueChange={setDistrictId}>
                <SelectTrigger id="district" className={errors.districtId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a district" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.district_id} value={district.district_id}>
                      {district.district_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.districtId && <p className="text-red-500 text-sm">{errors.districtId}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="academicYear">
                Academic Year <span className="text-red-500">*</span>
              </Label>
              <Select value={academicYearId} onValueChange={setAcademicYearId}>
                <SelectTrigger id="academicYear" className={errors.academicYearId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select an academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.academic_year_id} value={year.academic_year_id}>
                      {year.year_range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.academicYearId && <p className="text-red-500 text-sm">{errors.academicYearId}</p>}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="unlimitedUses">Unlimited Uses</Label>
                <Switch id="unlimitedUses" checked={unlimitedUses} onCheckedChange={setUnlimitedUses} />
              </div>
            </div>

            {!unlimitedUses && (
              <div className="grid gap-2">
                <Label htmlFor="numberOfUses">
                  Number of Uses <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numberOfUses"
                  type="number"
                  min="1"
                  value={numberOfUses}
                  onChange={(e) => setNumberOfUses(e.target.value)}
                  className={errors.numberOfUses ? "border-red-500" : ""}
                />
                {errors.numberOfUses && <p className="text-red-500 text-sm">{errors.numberOfUses}</p>}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Code"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
