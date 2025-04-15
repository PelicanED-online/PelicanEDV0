"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface District {
  district_id: string
  district_name: string
}

interface AcademicYear {
  academic_year_id: string
  year_range: string
}

interface AddSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  districts: District[]
  academicYears: AcademicYear[]
}

export function AddSubscriptionModal({ isOpen, onClose, districts, academicYears }: AddSubscriptionModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    district_id: "",
    district: "",
    school: "",
    teachers: "",
    students: "",
    paid: "No",
    academic_year_id: "",
  })

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        district_id: "",
        district: "",
        school: "",
        teachers: "",
        students: "",
        paid: "No",
        academic_year_id: "",
      })
      setError(null)
    }
  }, [isOpen])

  // Log props on mount to help debug
  useEffect(() => {
    if (isOpen) {
      console.log("Add Subscription Modal opened with:", {
        districtsCount: districts.length,
        academicYearsCount: academicYears.length,
      })

      if (districts.length === 0) {
        console.warn("No districts available for dropdown")
      }

      if (academicYears.length === 0) {
        console.warn("No academic years available for dropdown")
      }
    }
  }, [isOpen, districts, academicYears])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("Submitting form data:", formData)

      // Convert numeric string values to numbers
      const numericFormData = {
        ...formData,
        district: formData.district ? Number.parseInt(formData.district) : null,
        school: formData.school ? Number.parseInt(formData.school) : null,
        teachers: formData.teachers ? Number.parseInt(formData.teachers) : null,
        students: formData.students ? Number.parseInt(formData.students) : null,
      }

      console.log("Processed form data:", numericFormData)

      const { data, error } = await supabase.from("subscriptions").insert([numericFormData]).select()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      console.log("Subscription added successfully:", data)

      toast({
        title: "Success",
        description: "Subscription plan added successfully",
      })

      router.refresh()
      onClose()
    } catch (error: any) {
      console.error("Error adding subscription:", error)
      setError(error.message || "Failed to add subscription plan. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to add subscription plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Subscription Plan</DialogTitle>
          <DialogDescription>Create a new subscription plan for a district.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {districts.length === 0 && (
          <Alert variant="warning" className="mt-4">
            <AlertDescription>No districts available. Please add districts first.</AlertDescription>
          </Alert>
        )}

        {academicYears.length === 0 && (
          <Alert variant="warning" className="mt-4">
            <AlertDescription>No academic years available. Please add academic years first.</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="district_id" className="text-right">
                District
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.district_id}
                  onValueChange={(value) => handleSelectChange("district_id", value)}
                  required
                  disabled={districts.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={districts.length === 0 ? "No districts available" : "Select a district"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.district_id} value={district.district_id}>
                        {district.district_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="district" className="text-right">
                District Count
              </Label>
              <Input
                id="district"
                name="district"
                type="number"
                value={formData.district}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="school" className="text-right">
                School Count
              </Label>
              <Input
                id="school"
                name="school"
                type="number"
                value={formData.school}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teachers" className="text-right">
                Teachers
              </Label>
              <Input
                id="teachers"
                name="teachers"
                type="number"
                value={formData.teachers}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="students" className="text-right">
                Students
              </Label>
              <Input
                id="students"
                name="students"
                type="number"
                value={formData.students}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paid" className="text-right">
                Paid
              </Label>
              <div className="col-span-3">
                <Select value={formData.paid} onValueChange={(value) => handleSelectChange("paid", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="academic_year_id" className="text-right">
                Academic Year
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.academic_year_id}
                  onValueChange={(value) => handleSelectChange("academic_year_id", value)}
                  required
                  disabled={academicYears.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={academicYears.length === 0 ? "No academic years available" : "Select academic year"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.academic_year_id} value={year.academic_year_id}>
                        {year.year_range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || districts.length === 0 || academicYears.length === 0}>
              {isLoading ? "Adding..." : "Add Subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

