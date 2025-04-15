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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/rich-text-editor"

interface ActivityType {
  id: string
  activity_id: string
  type:
    | "reading"
    | "source"
    | "question"
    | "graphic_organizer"
    | "vocabulary"
    | "in_text_source"
    | "image"
    | "reading_addon"
  order: number
}

interface ReadingAddon {
  activity_id: string
  reading_id?: string
  reaing_text?: string
  order?: number
  published?: string
}

interface ReadingAddonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityType
  initialData?: ReadingAddon
  onSave: (readingAddon: ReadingAddon) => void
}

export function ReadingAddonModal({ open, onOpenChange, activity, initialData, onSave }: ReadingAddonModalProps) {
  const [formData, setFormData] = useState<ReadingAddon>({
    activity_id: "",
    reaing_text: "",
    published: "No", // Default to "No"
  })

  useEffect(() => {
    if (activity && open) {
      setFormData({
        activity_id: activity.activity_id,
        reading_id: initialData?.reading_id || undefined,
        reaing_text: initialData?.reaing_text || "",
        order: activity.order,
        published: initialData?.published || "No",
      })
    }
  }, [activity, initialData, open])

  const handleContentChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      reaing_text: value,
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      published: checked ? "Yes" : "No",
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Make sure we're passing all required fields with the correct structure
    const readingAddonData: ReadingAddon = {
      activity_id: formData.activity_id,
      reading_id: formData.reading_id || "",
      reaing_text: formData.reaing_text || "",
      order: formData.order,
      published: formData.published || "No",
    }

    onSave(readingAddonData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Reading Addon</DialogTitle>
          <DialogDescription>
            Create or edit a reading addon. This can include additional text content for an existing reading.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="reaing_text" className="text-right pt-2">
                Content
              </Label>
              <div className="col-span-3">
                <RichTextEditor
                  value={formData.reaing_text || ""}
                  onChange={handleContentChange}
                  placeholder="Enter the additional reading content here"
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
          <Button type="submit" onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

