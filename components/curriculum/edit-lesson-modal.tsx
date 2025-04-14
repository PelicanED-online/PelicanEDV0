"use client"

import type React from "react"

import { useState } from "react"
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
import { Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Lesson {
  lesson_id: string
  chapter_id: string
  created_at: string
  lesson_name: string | null
}

interface EditLessonModalProps {
  lesson: Lesson
  onLessonUpdated: () => void
}

export function EditLessonModal({ lesson, onLessonUpdated }: EditLessonModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lessonName, setLessonName] = useState(lesson.lesson_name || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from("lessons")
        .update({
          lesson_name: lessonName.trim() || null,
        })
        .eq("lesson_id", lesson.lesson_id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Lesson has been updated successfully.",
      })

      setOpen(false)
      onLessonUpdated()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update lesson",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
      return
    }

    setLoading(true)

    try {
      // Close the modal first
      setOpen(false)

      // Then perform the delete operation
      const { error } = await supabase.from("lessons").delete().eq("lesson_id", lesson.lesson_id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Lesson has been deleted successfully.",
      })

      // Refresh the data
      onLessonUpdated()

      // Force a router refresh
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lesson",
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
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>Make changes to the lesson. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lesson_name" className="text-right">
                Lesson Name
              </Label>
              <Input
                id="lesson_name"
                value={lessonName}
                onChange={(e) => setLessonName(e.target.value)}
                className="col-span-3"
                placeholder="Enter lesson name"
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
