"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface EditAcademicYearModalProps {
  isOpen: boolean
  onClose: () => void
  currentYear: string
  currentYearId: string
  expiryDate: string | null
}

export function EditAcademicYearModal({
  isOpen,
  onClose,
  currentYear,
  currentYearId,
  expiryDate,
}: EditAcademicYearModalProps) {
  const [yearRange, setYearRange] = useState(currentYear)
  const [newExpiryDate, setNewExpiryDate] = useState(expiryDate || "")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (currentYearId) {
        // Update existing academic year
        const { error } = await supabase
          .from("academic_years")
          .update({
            year_range: yearRange,
            expiry_date: newExpiryDate || null,
          })
          .eq("academic_year_id", currentYearId)

        if (error) {
          throw error
        }
      } else {
        // Create new academic year
        const { error } = await supabase.from("academic_years").insert({
          year_range: yearRange,
          expiry_date: newExpiryDate || null,
        })

        if (error) {
          throw error
        }
      }

      toast({
        title: "Success",
        description: "Academic year updated successfully",
      })

      onClose()
      // Refresh the page to show the updated value
      window.location.reload()
    } catch (error) {
      console.error("Error updating academic year:", error)
      toast({
        title: "Error",
        description: "Failed to update academic year",
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
          <DialogTitle>Edit Academic Year</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year-range" className="text-right">
                Academic Year
              </Label>
              <Input
                id="year-range"
                value={yearRange}
                onChange={(e) => setYearRange(e.target.value)}
                className="col-span-3"
                placeholder="e.g. 2023-2024"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiry-date" className="text-right">
                Expiry Date
              </Label>
              <Input
                id="expiry-date"
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
