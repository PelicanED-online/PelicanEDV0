"use client"

import type React from "react"

import { useState } from "react"
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
import { Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface AddLessonModalProps {
  chapterId: string
  subjectId: string // Added subject ID prop
  onLessonAdded: () => void
}

export function AddLessonModal({ chapterId, subjectId, onLessonAdded }: AddLessonModalProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lessonName, setLessonName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("lessons").insert([
        {
          chapter_id: chapterId,
          subject_id: subjectId, // Added subject ID to the insert
          lesson_name: lessonName.trim() || null,
          created_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Lesson has been added successfully.",
      })

      // Reset form and close modal
      setLessonName("")
      setOpen(false)

      // Refresh the lessons list
      onLessonAdded()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add lesson",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Lesson</DialogTitle>
            <DialogDescription>Create a new lesson for this chapter. Click save when you're done.</DialogDescription>
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
            {/* Hidden field for subject_id - not visible to user but included in form data */}
            <input type="hidden" id="subject_id" name="subject_id" value={subjectId} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
