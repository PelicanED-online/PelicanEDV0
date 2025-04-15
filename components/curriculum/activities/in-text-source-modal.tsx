"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/rich-text-editor"

interface InTextSourceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: {
    id: string
    activity_id: string
  }
  initialData?: {
    in_text_source_id?: string
    source_title_ad?: string
    source_title_ce?: string
    source_intro?: string
    source_text?: string
    published?: string
    source_image?: string
  }
  onSave: (data: any) => void
}

export function InTextSourceModal({ open, onOpenChange, activity, initialData, onSave }: InTextSourceModalProps) {
  const [sourceTitleAd, setSourceTitleAd] = useState<string>(initialData?.source_title_ad || "")
  const [sourceTitleCe, setSourceTitleCe] = useState<string>(initialData?.source_title_ce || "")
  const [sourceIntro, setSourceIntro] = useState<string>(initialData?.source_intro || "")
  const [sourceText, setSourceText] = useState<string>(initialData?.source_text || "")
  const [published, setPublished] = useState<string>(initialData?.published || "No")

  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      setSourceTitleAd(initialData?.source_title_ad || "")
      setSourceTitleCe(initialData?.source_title_ce || "")
      setSourceIntro(initialData?.source_intro || "")
      setSourceText(initialData?.source_text || "")
      setPublished(initialData?.published || "No")
    }
  }, [open, initialData])

  const handleSave = () => {
    onSave({
      activity_id: activity.activity_id,
      in_text_source_id: initialData?.in_text_source_id || activity.id,
      source_title_ad: sourceTitleAd,
      source_title_ce: sourceTitleCe,
      source_intro: sourceIntro,
      source_text: sourceText,
      published,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>In-Text Source</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="source-title-ce">Source Title (CE)</Label>
              <Input
                id="source-title-ce"
                value={sourceTitleCe}
                onChange={(e) => setSourceTitleCe(e.target.value)}
                placeholder="Enter source title (CE)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-title-ad">Source Title (AD)</Label>
              <Input
                id="source-title-ad"
                value={sourceTitleAd}
                onChange={(e) => setSourceTitleAd(e.target.value)}
                placeholder="Enter source title (AD)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-intro">Source Introduction</Label>
              <RichTextEditor value={sourceIntro} onChange={setSourceIntro} placeholder="Enter source introduction" />
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

