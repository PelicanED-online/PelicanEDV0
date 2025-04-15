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
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

interface ActivityType {
  id: string
  activity_id: string
  type: "reading" | "source" | "question" | "graphic_organizer"
  order: number
}

interface GraphicOrganizer {
  activity_id: string
  go_id?: string
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
  const router = useRouter()
  const [formData, setFormData] = useState<GraphicOrganizer>({
    activity_id: "",
    template_type: "",
    content: {},
    published: "No", // Default to "No"
  })
  const [jsonResult, setJsonResult] = useState<string>("")

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
      setJsonResult(JSON.stringify(initialData?.content, null, 2) || "")
    }
  }, [activity, initialData, open])

  const handleTemplateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      template_type: value,
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      published: checked ? "Yes" : "No",
    }))
  }

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonResult(e.target.value)
    try {
      const parsedContent = JSON.parse(e.target.value)
      setFormData((prev) => ({
        ...prev,
        content: parsedContent,
      }))
    } catch (error) {
      console.error("Invalid JSON:", error)
    }
  }

  const handleSaveTable = () => {
    try {
      const parsedContent = JSON.parse(jsonResult)
      onSave({
        ...formData,
        content: parsedContent,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format. Please check your JSON data.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
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
                    <SelectItem value="Table">Table</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="json-data" className="text-right pt-2">
                JSON Data
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="json-data"
                  value={jsonResult}
                  onChange={handleJsonChange}
                  className="min-h-[200px]"
                  placeholder="Enter JSON data for the graphic organizer"
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSaveTable}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
