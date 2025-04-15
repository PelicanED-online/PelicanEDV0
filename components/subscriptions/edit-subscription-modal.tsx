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

interface Subscription {
  id: number
  district_id: string
  district: number | null
  school: number | null
  teachers: number | null
  students: number | null
  paid: string
  academic_year_id: string
  districts?: { district_name: string }
  academic_years?: { year_range: string }
}

interface EditSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  subscription: Subscription | null
  districts: District[]
  academicYears: AcademicYear[]
}

export function EditSubscriptionModal({
  isOpen,
  onClose,
  subscription,
  districts,
  academicYears,
}: EditSubscriptionModalProps) {
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

  // Initialize form data when subscription changes
  useEffect(() => {
    if (subscription) {
      console.log("Initializing edit form with subscription:", subscription)
      setFormData({
        district_id: subscription.district_id || "",
        district: subscription.district?.toString() || "",
        school: subscription.school?.toString() || "",
        teachers: subscription.teachers?.toString() || "",
        students: subscription.students?.toString() || "",
        paid: subscription.paid || "No",
        academic_year_id: subscription.academic_year_id || "",
      })
    }
  }, [subscription])

  // Log props on mount to help debug
  useEffect(() => {
    if (isOpen) {
      console.log("Edit Subscription Modal opened with:", {
        subscription,
        districtsCount: districts.length,
        academicYearsCount: academicYears.length,
      })
    }
  }, [isOpen, subscription, districts, academicYears])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subscription) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("Submitting updated form data:", formData)

      // Convert numeric string values to numbers
      const numericFormData = {
        ...formData,
        district: formData.district ? Number.parseInt(formData.district) : null,
        school: formData.school ? Number.parseInt(formData.school) : null,
        teachers: formData.teachers ? Number.parseInt(formData.teachers) : null,
        students: formData.students ? Number.parseInt(formData.students) : null,
      }

      console.log("Processed form data:", numericFormData)

      const { data, error } = await supabase
        .from("subscriptions")
        .update(numericFormData)
        .eq("id", subscription.id)
        .select()

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      console.log("Subscription updated successfully:", data)

      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      })

      router.refresh()
      onClose()
    } catch (error: any) {
      console.error("Error updating subscription:", error)
      setError(error.message || "Failed to update subscription plan. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!subscription) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Subscription Plan</DialogTitle>
          <DialogDescription>Update the subscription plan details.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
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
                >
                  <SelectTrigger>
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic year" />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

