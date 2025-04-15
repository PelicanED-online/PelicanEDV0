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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"

interface ActivityType {
  id: string
  activity_id: string
  type: "reading" | "source" | "question" | "graphic_organizer" | "vocabulary"
  order: number
}

interface VocabularyItem {
  id?: string
  word: string
  definition: string
  order?: number
  vocab_order?: number // Add the new vocab_order field
}

interface Vocabulary {
  activity_id: string
  order?: number
  published?: string
  items: VocabularyItem[]
}

interface VocabularyActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityType
  initialData?: Vocabulary
  onSave: (vocabulary: Vocabulary) => void
}

export function VocabularyActivityModal({
  open,
  onOpenChange,
  activity,
  initialData,
  onSave,
}: VocabularyActivityModalProps) {
  const [formData, setFormData] = useState<Vocabulary>({
    activity_id: "",
    published: "No",
    items: [{ word: "", definition: "" }],
  })

  useEffect(() => {
    if (activity && open) {
      const items =
        initialData?.items && initialData.items.length > 0
          ? initialData.items
          : [{ word: "", definition: "", vocab_order: 0 }]

      // Ensure all items have vocab_order values
      const itemsWithOrder = items.map((item, index) => ({
        ...item,
        vocab_order: item.vocab_order !== undefined ? item.vocab_order : index,
      }))

      // Sort by vocab_order
      itemsWithOrder.sort((a, b) => (a.vocab_order || 0) - (b.vocab_order || 0))

      setFormData({
        activity_id: activity.activity_id,
        order: activity.order,
        published: initialData?.published || "No",
        items: itemsWithOrder,
      })
    }
  }, [activity, initialData, open])

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      published: checked ? "Yes" : "No",
    }))
  }

  const handleItemChange = (index: number, field: keyof VocabularyItem, value: string) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items]
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      }
      return {
        ...prev,
        items: updatedItems,
      }
    })
  }

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { word: "", definition: "", vocab_order: prev.items.length }],
    }))
  }

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return // Don't remove the last item

    setFormData((prev) => {
      const updatedItems = [...prev.items]
      updatedItems.splice(index, 1)
      return {
        ...prev,
        items: updatedItems,
      }
    })
  }

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === formData.items.length - 1)) {
      return // Can't move first item up or last item down
    }

    setFormData((prev) => {
      const newItems = [...prev.items]
      const newIndex = direction === "up" ? index - 1 : index + 1

      // Swap items
      ;[newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]]

      // Update vocab_order values
      newItems.forEach((item, i) => {
        item.vocab_order = i
      })

      return {
        ...prev,
        items: newItems,
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Vocabulary Activity</DialogTitle>
          <DialogDescription>Create or edit a vocabulary activity. Add words and their definitions.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4 mb-4">
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

            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Vocabulary Words</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Word
                </Button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start border-b pb-4">
                    <div className="col-span-5">
                      <Label htmlFor={`word-${index}`}>Word</Label>
                      <Input
                        id={`word-${index}`}
                        value={item.word}
                        onChange={(e) => handleItemChange(index, "word", e.target.value)}
                        className="mt-1"
                        placeholder="Enter vocabulary word"
                      />
                    </div>
                    <div className="col-span-6">
                      <Label htmlFor={`definition-${index}`}>Definition</Label>
                      <Textarea
                        id={`definition-${index}`}
                        value={item.definition}
                        onChange={(e) => handleItemChange(index, "definition", e.target.value)}
                        className="mt-1"
                        rows={2}
                        placeholder="Enter definition"
                      />
                    </div>
                    <div className="col-span-1 flex flex-col justify-center pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem(index, "up")}
                        disabled={index === 0}
                        className="mb-1 p-0 h-6"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItem(index, "down")}
                        disabled={index === formData.items.length - 1}
                        className="mb-1 p-0 h-6"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formData.items.length <= 1}
                        className="p-0 h-6"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
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

