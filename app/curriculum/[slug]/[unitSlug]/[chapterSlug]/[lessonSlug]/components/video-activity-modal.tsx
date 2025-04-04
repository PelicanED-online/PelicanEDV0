"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import type { Video } from "@/types/curriculum"
import { v4 as uuidv4 } from "uuid"

interface VideoActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (video: Video) => void
  video?: Video
}

export function VideoActivityModal({ isOpen, onClose, onSave, video }: VideoActivityModalProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [required, setRequired] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (video) {
      setTitle(video.title || "")
      setUrl(video.url || "")
      setRequired(video.required || false)
    } else {
      setTitle("")
      setUrl("")
      setRequired(false)
    }
  }, [video, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const videoData: Video = {
        id: video?.id || uuidv4(),
        title,
        url,
        required,
        type: "video",
        created_at: video?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      onSave(videoData)
      onClose()
    } catch (error) {
      console.error("Error saving video:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">{video ? "Edit" : "Add"} Video</h2>
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
              <Label htmlFor="url">Video URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter video URL"
                required
              />
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

