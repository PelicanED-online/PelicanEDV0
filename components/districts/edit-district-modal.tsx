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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle } from "lucide-react"
import type { District } from "@/app/dashboard/districts-admin/page"

interface EditDistrictModalProps {
  isOpen: boolean
  onClose: () => void
  district: District | null
  onUpdateDistrict: (district: District) => Promise<boolean>
  onDeleteDistrict: (districtId: string) => Promise<boolean>
}

export function EditDistrictModal({
  isOpen,
  onClose,
  district,
  onUpdateDistrict,
  onDeleteDistrict,
}: EditDistrictModalProps) {
  const [formData, setFormData] = useState<Omit<District, "district_id">>({
    district_name: "",
    domain: "",
    student_domain: "",
    contact_email: "",
    contact: "",
    number: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (district) {
      setFormData({
        district_name: district.district_name,
        domain: district.domain,
        student_domain: district.student_domain || "",
        contact_email: district.contact_email || "",
        contact: district.contact || "",
        number: district.number || "",
      })
    }
  }, [district])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.district_name.trim()) {
      newErrors.district_name = "District name is required"
    }
    if (!formData.domain.trim()) {
      newErrors.domain = "Domain is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !district) return

    setIsSubmitting(true)
    const updatedDistrict: District = {
      ...formData,
      district_id: district.district_id,
    }

    const success = await onUpdateDistrict(updatedDistrict)
    setIsSubmitting(false)

    if (success) {
      handleClose()
    }
  }

  const handleDelete = async () => {
    if (!district) return

    setIsDeleting(true)
    const success = await onDeleteDistrict(district.district_id)
    setIsDeleting(false)

    if (success) {
      setShowDeleteConfirm(false)
      handleClose()
    }
  }

  const handleClose = () => {
    setShowDeleteConfirm(false)
    onClose()
  }

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
              Are you sure you want to delete the district "{district?.district_name}"? This action cannot be undone.
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
                "Delete District"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit District</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="district_name">
                District Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="district_name"
                name="district_name"
                value={formData.district_name}
                onChange={handleChange}
                className={errors.district_name ? "border-red-500" : ""}
              />
              {errors.district_name && <p className="text-red-500 text-sm">{errors.district_name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="domain">
                Primary Domain <span className="text-red-500">*</span>
              </Label>
              <Input
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className={errors.domain ? "border-red-500" : ""}
                placeholder="example.edu"
              />
              {errors.domain && <p className="text-red-500 text-sm">{errors.domain}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="student_domain">Secondary Domain (Student)</Label>
              <Input
                id="student_domain"
                name="student_domain"
                value={formData.student_domain}
                onChange={handleChange}
                placeholder="student.example.edu"
              />
              <p className="text-xs text-muted-foreground">Optional domain for student email addresses</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Person</Label>
              <Input id="contact" name="contact" value={formData.contact} onChange={handleChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="number">Phone Number</Label>
              <Input id="number" name="number" value={formData.number} onChange={handleChange} />
            </div>
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
