"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertTriangle } from "lucide-react"
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

interface InvitationCode {
  invitation_code_id: string
  invitation_code: string
  role: string
  subject_id: string
  district_id: string | null
  academic_year_id: string
  created_by: string
  number_of_uses: number | null
}

interface EditInvitationCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdateCode: (codeId: string, codeData: any) => Promise<boolean>
  onDeleteCode: (codeId: string) => Promise<boolean>
  invitationCode: InvitationCode | null
}

export function EditInvitationCodeModal({
  isOpen,
  onClose,
  onUpdateCode,
  onDeleteCode,
  invitationCode,
}: EditInvitationCodeModalProps) {
  // Form state
  const [formData, setFormData] = useState({
    code: "",
    role: "",
    subjectId: "",
    districtId: "",
    academicYearId: "",
    numberOfUses: "",
    unlimitedUses: false,
  })

  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [existingCodes, setExistingCodes] = useState<string[]>([])

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Populate form with invitation code data when it changes
  useEffect(() => {
    if (invitationCode) {
      setFormData({
        code: invitationCode.invitation_code,
        role: invitationCode.role,
        subjectId: invitationCode.subject_id,
        districtId: invitationCode.district_id || "",
        academicYearId: invitationCode.academic_year_id,
        numberOfUses: invitationCode.number_of_uses !== null ? invitationCode.number_of_uses.toString() : "",
        unlimitedUses: invitationCode.number_of_uses === null,
      })
    }
  }, [invitationCode])

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
      const { data, error } = await supabase.from("invitation_codes").select("invitation_code, invitation_code_id")

      if (error) throw error

      // Filter out the current code to allow keeping the same code
      const filteredCodes = invitationCode
        ? (data || [])
            .filter((item) => item.invitation_code_id !== invitationCode.invitation_code_id)
            .map((item) => item.invitation_code)
        : (data || []).map((item) => item.invitation_code)

      setExistingCodes(filteredCodes)
    } catch (error) {
      console.error("Error fetching existing codes:", error)
      toast({
        title: "Error",
        description: "Failed to load existing codes. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch academic years from database
  const fetchAcademicYears = async () => {
    try {
      // Fetch academic years
      const { data: yearsData, error: yearsError } = await supabase
        .from("academic_years")
        .select("academic_year_id, year_range, expiry_date")
        .order("year_range", { ascending: false })

      if (yearsError) throw yearsError
      setAcademicYears(yearsData || [])
    } catch (error) {
      console.error("Error fetching academic years:", error)
      toast({
        title: "Error",
        description: "Failed to load academic years. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle form field changes
  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = "Invitation code is required"
    } else if (existingCodes.includes(formData.code)) {
      newErrors.code = "This invitation code already exists. Please use a different one."
    }

    if (!formData.role) {
      newErrors.role = "Role is required"
    }

    if (!formData.subjectId) {
      newErrors.subjectId = "Subject is required"
    }

    if (!formData.academicYearId) {
      newErrors.academicYearId = "Academic year is required"
    }

    if (!formData.districtId || formData.districtId === "none") {
      newErrors.districtId = "District is required"
    }

    if (!formData.unlimitedUses && !formData.numberOfUses) {
      newErrors.numberOfUses = "Number of uses is required unless unlimited"
    } else if (!formData.unlimitedUses && Number.parseInt(formData.numberOfUses) <= 0) {
      newErrors.numberOfUses = "Number of uses must be greater than 0"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!invitationCode || !validateForm()) return

    setIsSubmitting(true)

    try {
      const codeData = {
        invitation_code: formData.code,
        role: formData.role,
        subject_id: formData.subjectId,
        district_id: formData.districtId === "none" ? null : formData.districtId,
        academic_year_id: formData.academicYearId,
        number_of_uses: formData.unlimitedUses ? null : Number.parseInt(formData.numberOfUses),
      }

      const success = await onUpdateCode(invitationCode.invitation_code_id, codeData)

      if (success) {
        handleClose()
      }
    } catch (error) {
      console.error("Error updating invitation code:", error)
      toast({
        title: "Error",
        description: "Failed to update invitation code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!invitationCode) return

    setIsDeleting(true)
    const success = await onDeleteCode(invitationCode.invitation_code_id)
    setIsDeleting(false)

    if (success) {
      setShowDeleteConfirm(false)
      handleClose()
    }
  }

  // Handle close
  const handleClose = () => {
    setShowDeleteConfirm(false)
    onClose()
  }

  // Check if manually entered code is unique
  const checkCodeUniqueness = (newCode: string) => {
    handleChange("code", newCode)
    if (newCode && existingCodes.includes(newCode)) {
      setErrors({
        ...errors,
        code: "This invitation code already exists. Please use a different one.",
      })
    } else {
      const { code: _, ...restErrors } = errors
      setErrors(restErrors)
    }
  }

  // Render delete confirmation dialog
  if (showDeleteConfirm) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the invitation code "{invitationCode?.invitation_code}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Code"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Render main edit form
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Invitation Code</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">
                Invitation Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => checkCodeUniqueness(e.target.value)}
                className={errors.code ? "border-red-500" : ""}
                maxLength={6}
              />
              {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
              <p className="text-xs text-muted-foreground">6-character code using capital letters and numbers</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
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
              <Select value={formData.subjectId} onValueChange={(value) => handleChange("subjectId", value)}>
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
              <Select value={formData.districtId} onValueChange={(value) => handleChange("districtId", value)}>
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
              <Select value={formData.academicYearId} onValueChange={(value) => handleChange("academicYearId", value)}>
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
                <Switch
                  id="unlimitedUses"
                  checked={formData.unlimitedUses}
                  onCheckedChange={(checked) => handleChange("unlimitedUses", checked)}
                />
              </div>
            </div>

            {!formData.unlimitedUses && (
              <div className="grid gap-2">
                <Label htmlFor="numberOfUses">
                  Number of Uses <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numberOfUses"
                  type="number"
                  min="1"
                  value={formData.numberOfUses}
                  onChange={(e) => handleChange("numberOfUses", e.target.value)}
                  className={errors.numberOfUses ? "border-red-500" : ""}
                />
                {errors.numberOfUses && <p className="text-red-500 text-sm">{errors.numberOfUses}</p>}
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
