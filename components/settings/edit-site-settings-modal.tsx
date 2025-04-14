"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface EditSiteSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentAcademicYearId: string | null
  siteSettingsId: number | null
  onSaved: () => void
}

interface AcademicYear {
  academic_year_id: string
  year_range: string
  expiry_date: string | null
}

export function EditSiteSettingsModal({
  isOpen,
  onClose,
  currentAcademicYearId,
  siteSettingsId,
  onSaved,
}: EditSiteSettingsModalProps) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string | null>(currentAcademicYearId)
  const [loading, setLoading] = useState(false)
  const [fetchingYears, setFetchingYears] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchAcademicYears() {
      if (!isOpen) return

      setFetchingYears(true)
      try {
        const { data, error } = await supabase
          .from("academic_years")
          .select("*")
          .order("year_range", { ascending: false })

        if (error) {
          console.error("Error fetching academic years:", error)
          toast({
            title: "Error",
            description: "Failed to load academic years",
            variant: "destructive",
          })
        } else if (data) {
          setAcademicYears(data)
        }
      } catch (error) {
        console.error("Exception fetching academic years:", error)
      } finally {
        setFetchingYears(false)
      }
    }

    if (isOpen) {
      fetchAcademicYears()
      setSelectedAcademicYearId(currentAcademicYearId)
    }
  }, [isOpen, currentAcademicYearId, toast])

  const handleSubmit = async () => {
    if (!selectedAcademicYearId) {
      toast({
        title: "Error",
        description: "Please select an academic year",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let result

      if (siteSettingsId) {
        // Update existing site settings
        result = await supabase
          .from("site_settings")
          .update({ academic_year_id: selectedAcademicYearId })
          .eq("id", siteSettingsId)
      } else {
        // Create new site settings
        result = await supabase.from("site_settings").insert({ academic_year_id: selectedAcademicYearId })
      }

      if (result.error) {
        console.error("Error updating site settings:", result.error)
        toast({
          title: "Error",
          description: "Failed to update academic year",
          variant: "destructive",
        })
      } else {
        // Call the onSaved callback instead of reloading the page
        onSaved()
      }
    } catch (error) {
      console.error("Exception updating site settings:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Academic Year</DialogTitle>
          <DialogDescription>Select the current academic year for the site.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="academic-year" className="text-right">
              Academic Year
            </Label>
            <Select
              value={selectedAcademicYearId || ""}
              onValueChange={(value) => setSelectedAcademicYearId(value)}
              disabled={loading || fetchingYears}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.academic_year_id} value={year.academic_year_id}>
                    {year.year_range}
                    {year.expiry_date && ` (Expires: ${new Date(year.expiry_date).toLocaleDateString()})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
