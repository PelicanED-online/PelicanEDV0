"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Editor } from "@/components/editor"
import { Loader2 } from "lucide-react"
import type { Reading, SubReading } from "@/types/curriculum"
import { v4 as uuidv4 } from "uuid"

interface ReadingActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (reading: Reading | SubReading) => void
  reading?: Reading | SubReading
  isSubReading?: boolean
}

export function ReadingActivityModal({
  isOpen,
  onClose,
  onSave,
  reading,
  isSubReading = false,
}: ReadingActivityModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [required, setRequired] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (reading) {
      setTitle(reading.title || "")
      setContent(reading.content || "")
      setRequired(reading.required || false)
    } else {
      setTitle("")
      setContent("")
      setRequired(false)
    }
  }, [reading, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const readingData: Reading | SubReading = {
        id: reading?.id || uuidv4(),
        title,
        content,
        required,
        type: isSubReading ? "sub_reading" : "reading",
        created_at: reading?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      onSave(readingData)
      onClose()
    } catch (error) {
      console.error("Error saving reading:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {reading ? "Edit" : "Add"} {isSubReading ? "Sub-Reading" : "Reading"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Editor value={content} onChange={setContent} placeholder="Enter content" />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={required}
                onCheckedChange={(checked) => setRequired(checked as boolean)}
              />
              <Label htmlFor="required">Required</Label>
            </div>
          </form>
        </div>

        <div className="p-6 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
