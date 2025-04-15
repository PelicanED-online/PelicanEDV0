"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Lesson {
  lesson_id: string
  lesson_name: string
}

interface AddLessonPlanModalProps {
  isOpen: boolean
  onClose: () => void
  subjectId: string
  onSuccess: () => void
}

export function AddLessonPlanModal({ isOpen, onClose, subjectId, onSuccess }: AddLessonPlanModalProps) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    lesson_id: "",
  })

  useEffect(() => {
    if (isOpen) {
      fetchLessons()
    }
  }, [isOpen, subjectId])

  const fetchLessons = async () => {
    setLoading(true)
    try {
      // Directly fetch lessons by subject_id
      const { data, error } = await supabase
        .from("lessons")
        .select("lesson_id, lesson_name")
        .eq("subject_id", subjectId)

      if (error) {
        console.error("Error fetching lessons:", error)
        toast({
          title: "Error",
          description: "Failed to load lessons. Please try again.",
          variant: "destructive",
        })
        setLessons([])
        return
      }

      if (!data || data.length === 0) {
        setLessons([])
        return
      }

      // Sort lessons by name
      const sortedLessons = [...data].sort((a, b) => a.lesson_name.localeCompare(b.lesson_name))

      setLessons(sortedLessons)
    } catch (error) {
      console.error("Error in fetchLessons:", error)
      toast({
        title: "Error",
        description: "Failed to load lessons. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!formData.lesson_id) {
      toast({
        title: "Validation Error",
        description: "Please select a lesson.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from("lesson_plans")
        .insert([
          {
            lesson_id: formData.lesson_id,
            subject_id: subjectId,
          },
        ])
        .select()

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Lesson plan created successfully.",
      })

      // Reset form
      setFormData({
        lesson_id: "",
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error creating lesson plan:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create lesson plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Lesson Plan</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="lesson">Lesson</Label>
            <Select
              value={formData.lesson_id}
              onValueChange={(value) => handleChange("lesson_id", value)}
              disabled={loading || submitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a lesson" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>
                    Loading lessons...
                  </SelectItem>
                ) : lessons.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No lessons available
                  </SelectItem>
                ) : (
                  lessons.map((lesson) => (
                    <SelectItem key={lesson.lesson_id} value={lesson.lesson_id}>
                      {lesson.lesson_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? "Creating..." : "Create Lesson Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
