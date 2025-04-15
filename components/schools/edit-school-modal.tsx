"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { School, District } from "@/app/dashboard/schools-admin/page"

interface EditSchoolModalProps {
  isOpen: boolean
  onClose: () => void
  school: School | null
  districts: District[]
  onUpdateSchool: (school: School) => Promise<boolean>
  onDeleteSchool: (schoolId: string) => Promise<boolean>
}

export function EditSchoolModal({
  isOpen,
  onClose,
  school,
  districts,
  onUpdateSchool,
  onDeleteSchool,
}: EditSchoolModalProps) {
  const [schoolName, setSchoolName] = useState("")
  const [districtId, setDistrictId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errors, setErrors] = useState<{ schoolName?: string }>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (school) {
      setSchoolName(school.school_name || "")
      setDistrictId(school.district_id)
    }
  }, [school])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!school) return

    // Validate form
    const newErrors: { schoolName?: string } = {}
    if (!schoolName.trim()) {
      newErrors.schoolName = "School name is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    const updatedSchool: School = {
      ...school,
      school_name: schoolName,
      district_id: districtId,
    }

    const success = await onUpdateSchool(updatedSchool)

    if (success) {
      onClose()
    }

    setIsSubmitting(false)
  }

  const handleDelete = async () => {
    if (!school) return

    setIsDeleting(true)

    const success = await onDeleteSchool(school.school_id)

    if (success) {
      onClose()
    }

    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  const handleClose = () => {
    setErrors({})
    setShowDeleteConfirm(false)
    onClose()
  }

  if (!school) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit School</DialogTitle>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="py-6">
            <h3 className="text-lg font-medium">Are you sure you want to delete this school?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. This will permanently delete the school.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete School"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="school-name">School Name</Label>
                <Input
                  id="school-name"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Enter school name"
                  className={errors.schoolName ? "border-red-500" : ""}
                />
                {errors.schoolName && <p className="text-sm text-red-500">{errors.schoolName}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="district">District</Label>
                <Select value={districtId || ""} onValueChange={setDistrictId}>
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Select a district" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {districts.map((district) => (
                      <SelectItem key={district.district_id} value={district.district_id}>
                        {district.district_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </Button>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

