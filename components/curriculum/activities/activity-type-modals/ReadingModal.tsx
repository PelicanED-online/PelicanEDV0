"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { Reading } from "@/lib/types/activity-types"
import type { ActivityType } from "@/lib/types/activity"

interface ReadingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityType | null
  initialData?: Reading
  onSave: (reading: Reading) => void
}

export function ReadingModal({ open, onOpenChange, activity, initialData, onSave }: ReadingModalProps) {
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")
  const [published, setPublished] = useState("No")

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.reading_title || "")
      setText(initialData.reaing_text || "")
      setPublished(initialData.published || "No")
    } else {
      setTitle("")
      setText("")
      setPublished("No")
    }
  }, [initialData, open])

  const handleSave = () => {
    if (!activity) return

    const reading: Reading = {
      activity_id: activity.activity_id,
      reading_id: initialData?.reading_id || activity.id,
      reading_title: title,
      reaing_text: text,
      order: activity.order,
      published,
    }

    onSave(reading)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Reading" : "Add Reading"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reading-title">Reading Title</Label>
            <Input
              id="reading-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter reading title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reading-text">Reading Text</Label>
            <textarea
              id="reading-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter reading text"
              className="w-full min-h-[200px] p-2 border rounded-md"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="reading-published"
              checked={published === "Yes"}
              onCheckedChange={(checked) => setPublished(checked ? "Yes" : "No")}
            />
            <Label htmlFor="reading-published">Published ({published})</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
