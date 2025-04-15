"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { District } from "@/app/dashboard/districts-admin/page"

interface AddDistrictModalProps {
  isOpen: boolean
  onClose: () => void
  onAddDistrict: (district: Omit<District, "district_id">) => Promise<boolean>
}

export function AddDistrictModal({ isOpen, onClose, onAddDistrict }: AddDistrictModalProps) {
  const [formData, setFormData] = useState({
    district_name: "",
    domain: "",
    student_domain: "",
    contact_email: "",
    contact: "",
    number: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (!validateForm()) return

    setIsSubmitting(true)
    const success = await onAddDistrict(formData)
    setIsSubmitting(false)

    if (success) {
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      district_name: "",
      domain: "",
      student_domain: "",
      contact_email: "",
      contact: "",
      number: "",
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New District</DialogTitle>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add District"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

