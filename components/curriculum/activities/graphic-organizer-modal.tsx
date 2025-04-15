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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface ActivityType {
  id: string
  activity_id: string
  type: "reading" | "source" | "question" | "graphic_organizer"
  order: number
}

interface GraphicOrganizer {
  activity_id: string
  go_id?: string // Add go_id field
  content?: any
  order?: number
  template_type?: string
  published?: string
}

interface GraphicOrganizerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityType
  initialData?: GraphicOrganizer
  onSave: (organizer: GraphicOrganizer) => void
}

export function GraphicOrganizerModal({
  open,
  onOpenChange,
  activity,
  initialData,
  onSave,
}: GraphicOrganizerModalProps) {
  const [formData, setFormData] = useState<GraphicOrganizer>({
    activity_id: "",
    template_type: "",
    content: {},
    published: "No", // Default to "No"
  })

  useEffect(() => {
    if (activity && open) {
      setFormData({
        activity_id: activity.activity_id,
        go_id: initialData?.go_id, // Include go_id if it exists
        template_type: initialData?.template_type || "",
        content: initialData?.content || {},
        order: activity.order,
        published: initialData?.published || "No", // Default to "No" if not set
      })
    }
  }, [activity, initialData, open])

  const handleTemplateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      template_type: value,
      // Reset content when template changes
      content: {},
    }))
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const content = JSON.parse(e.target.value)
      setFormData((prev) => ({
        ...prev,
        content,
      }))
    } catch (error) {
      // Handle invalid JSON
      console.error("Invalid JSON:", error)
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      published: checked ? "Yes" : "No", // Convert boolean to "Yes"/"No"
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Graphic Organizer Activity</DialogTitle>
          <DialogDescription>
            Create or edit a graphic organizer activity. Select a template and configure its content.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template_type" className="text-right">
                Template Type
              </Label>
              <div className="col-span-3">
                <Select value={formData.template_type} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venn_diagram">Venn Diagram</SelectItem>
                    <SelectItem value="concept_map">Concept Map</SelectItem>
                    <SelectItem value="timeline">Timeline</SelectItem>
                    <SelectItem value="t_chart">T-Chart</SelectItem>
                    <SelectItem value="kwl_chart">KWL Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.template_type && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="content" className="text-right pt-2">
                  Content (JSON)
                </Label>
                <Textarea
                  id="content"
                  value={JSON.stringify(formData.content, null, 2)}
                  onChange={handleContentChange}
                  className="col-span-3 font-mono text-sm"
                  rows={10}
                  placeholder="Enter JSON configuration for this template"
                />
              </div>
            )}
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

