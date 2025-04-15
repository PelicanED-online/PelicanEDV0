"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Subject {
  subject_id: string
  name: string
  curriculum_title: string | null
  curriculum_description: string | null
}

interface EditCurriculumModalProps {
  subject: Subject
  onCurriculumUpdated: () => void
}

export function EditCurriculumModal({ subject, onCurriculumUpdated }: EditCurriculumModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: subject.name,
    curriculum_title: subject.curriculum_title || "",
    curriculum_description: subject.curriculum_description || "",
  })

  useEffect(() => {
    // Update form data when subject changes
    setFormData({
      name: subject.name,
      curriculum_title: subject.curriculum_title || "",
      curriculum_description: subject.curriculum_description || "",
    })
  }, [subject])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from("subjects")
        .update({
          name: formData.name,
          curriculum_title: formData.curriculum_title || null,
          curriculum_description: formData.curriculum_description || null,
        })
        .eq("subject_id", subject.subject_id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Curriculum has been updated successfully.",
      })

      setOpen(false)
      onCurriculumUpdated()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update curriculum",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this curriculum? This action cannot be undone.")) {
      return
    }

    setLoading(true)

    try {
      // Close the modal first
      setOpen(false)

      // Then perform the delete operation
      const { error } = await supabase.from("subjects").delete().eq("subject_id", subject.subject_id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Curriculum has been deleted successfully.",
      })

      // Refresh the data
      onCurriculumUpdated()

      // Force a router refresh
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete curriculum",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Curriculum</DialogTitle>
            <DialogDescription>Make changes to the curriculum. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Subject Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="curriculum_title" className="text-right">
                Title
              </Label>
              <Input
                id="curriculum_title"
                name="curriculum_title"
                value={formData.curriculum_title}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="curriculum_description" className="text-right">
                Description
              </Label>
              <Textarea
                id="curriculum_description"
                name="curriculum_description"
                value={formData.curriculum_description}
                onChange={handleInputChange}
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
