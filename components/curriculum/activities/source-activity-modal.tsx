"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/rich-text-editor"

interface SourceActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: {
    id: string
    activity_id: string
  }
  initialData?: {
    source_id?: string
    source_title?: string
    source_author?: string
    source_text?: string
    published?: string
  }
  onSave: (data: any) => void
}

export function SourceActivityModal({ open, onOpenChange, activity, initialData, onSave }: SourceActivityModalProps) {
  const [sourceTitle, setSourceTitle] = useState<string>(initialData?.source_title || "")
  const [sourceAuthor, setSourceAuthor] = useState<string>(initialData?.source_author || "")
  const [sourceText, setSourceText] = useState<string>(initialData?.source_text || "")
  const [published, setPublished] = useState<string>(initialData?.published || "No")

  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      setSourceTitle(initialData?.source_title || "")
      setSourceAuthor(initialData?.source_author || "")
      setSourceText(initialData?.source_text || "")
      setPublished(initialData?.published || "No")
    }
  }, [open, initialData])

  const handleSave = () => {
    onSave({
      activity_id: activity.activity_id,
      source_id: initialData?.source_id || undefined,
      source_title: sourceTitle,
      source_author: sourceAuthor,
      source_text: sourceText,
      published,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Source</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="source-title">Source Title</Label>
              <Input
                id="source-title"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                placeholder="Enter source title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-author">Source Author</Label>
              <Input
                id="source-author"
                value={sourceAuthor}
                onChange={(e) => setSourceAuthor(e.target.value)}
                placeholder="Enter source author"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-text">Source Text</Label>
              <RichTextEditor value={sourceText} onChange={setSourceText} placeholder="Enter source text" />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={published === "Yes"}
                onCheckedChange={(checked) => setPublished(checked ? "Yes" : "No")}
              />
              <Label htmlFor="published">Published ({published})</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
