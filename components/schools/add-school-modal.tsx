"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { School, District } from "@/app/dashboard/schools-admin/page"

interface AddSchoolModalProps {
  isOpen: boolean
  onClose: () => void
  onAddSchool: (school: Omit<School, "school_id">) => Promise<boolean>
  districts: District[]
}

export function AddSchoolModal({ isOpen, onClose, onAddSchool, districts }: AddSchoolModalProps) {
  const [schoolName, setSchoolName] = useState("")
  const [districtId, setDistrictId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ schoolName?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

    const newSchool: Omit<School, "school_id"> = {
      school_name: schoolName,
      district_id: districtId,
    }

    const success = await onAddSchool(newSchool)

    if (success) {
      resetForm()
    }

    setIsSubmitting(false)
  }

  const resetForm = () => {
    setSchoolName("")
    setDistrictId(null)
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New School</DialogTitle>
        </DialogHeader>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add School"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

