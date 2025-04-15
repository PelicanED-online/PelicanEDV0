"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/rich-text-editor"

interface ActivityType {
  id: string
  activity_id: string
  type: "reading" | "source" | "question" | "graphic_organizer"
  order: number
}

// Update the Reading interface to match the database schema and ensure it includes the published field
interface Reading {
  activity_id: string
  reading_id?: string
  reading_title?: string
  reaing_text?: string
  order?: number
  published?: string
}

interface ReadingActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityType
  initialData?: Reading
  onSave: (reading: Reading) => void
}

export function ReadingActivityModal({ open, onOpenChange, activity, initialData, onSave }: ReadingActivityModalProps) {
  // Update the initial state in the component
  const [formData, setFormData] = useState<Reading>({
    activity_id: "",
    reading_title: "",
    reaing_text: "",
    published: "No", // Default to "No"
  })

  // Update the useEffect to properly set the published status from initialData
  useEffect(() => {
    if (activity && open) {
      setFormData({
        activity_id: activity.activity_id,
        reading_id: initialData?.reading_id || undefined,
        reading_title: initialData?.reading_title || "",
        reaing_text: initialData?.reaing_text || "",
        order: activity.order,
        published: initialData?.published || "No",
      })
    }
  }, [activity, initialData, open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleContentChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      reaing_text: value,
    }))
  }

  // Make sure the handleSwitchChange function properly updates the published status
  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      published: checked ? "Yes" : "No", // Convert boolean to "Yes"/"No"
    }))
  }

  // Ensure the handleSubmit function passes the published status to onSave
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Make sure we're passing all required fields with the correct structure
    const readingData: Reading = {
      activity_id: formData.activity_id,
      reading_id: formData.reading_id || undefined, // Don't pass empty string for UUID
      reading_title: formData.reading_title || "",
      reaing_text: formData.reaing_text || "",
      order: formData.order,
      published: formData.published || "No",
    }

    onSave(readingData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Reading Activity</DialogTitle>
          <DialogDescription>
            Create or edit a reading activity. This can include text content and references.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reading_title" className="text-right">
                Title
              </Label>
              <Input
                id="reading_title"
                name="reading_title"
                value={formData.reading_title}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Enter a title for this reading"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="reaing_text" className="text-right pt-2">
                Content
              </Label>
              <div className="col-span-3">
                <RichTextEditor
                  value={formData.reaing_text || ""}
                  onChange={handleContentChange}
                  placeholder="Enter the reading content here"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="published" className="text-right">
                Published
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch id="published" checked={formData.published === "Yes"} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="published" className="text-sm text-muted-foreground">
                  {formData.published}
                </Label>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="flex-shrink-0 pt-2 border-t">
          <Button type="button" onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

