"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import type { Image } from "@/types/curriculum"
import { v4 as uuidv4 } from "uuid"
import { useDropzone } from "react-dropzone"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

interface ImageActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (image: Image) => void
  image?: Image
}

export function ImageActivityModal({ isOpen, onClose, onSave, image }: ImageActivityModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [descriptionTitle, setDescriptionTitle] = useState("")
  const [required, setRequired] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageUrl, setImageUrl] = useState("")

  const supabase = createClient()

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles)
    },
  })

  useEffect(() => {
    if (image) {
      setTitle(image.title || "")
      setDescription(image.description || "")
      setDescriptionTitle(image.description_title || "")
      setRequired(image.required || false)
      setImageUrl(image.url || "")
    } else {
      setTitle("")
      setDescription("")
      setDescriptionTitle("")
      setRequired(false)
      setImageUrl("")
      setFiles([])
    }
  }, [image, isOpen])

  const handleImageUpload = async () => {
    if (files.length === 0) return imageUrl

    const file = files[0]
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `reading_images/${fileName}`

    try {
      setUploadProgress(0)
      const { data, error } = await supabase.storage.from("media").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        throw error
      }

      setUploadProgress(100)

      const { data: urlData } = await supabase.storage.from("media").createSignedUrl(filePath, 31536000) // URL valid for 1 year

      if (urlData?.signedUrl) {
        setImageUrl(urlData.signedUrl)
        return urlData.signedUrl
      }
      return ""
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
      return ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const uploadedUrl = await handleImageUpload()

      const imageData: Image = {
        id: image?.id || uuidv4(),
        title,
        description,
        description_title: descriptionTitle,
        url: uploadedUrl || imageUrl,
        required,
        type: "image",
        created_at: image?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      onSave(imageData)
      onClose()
    } catch (error) {
      console.error("Error saving image:", error)
      toast.error("Failed to save image")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">{image ? "Edit" : "Add"} Image</h2>
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
              <Label htmlFor="descriptionTitle">Description Title</Label>
              <Input
                id="descriptionTitle"
                value={descriptionTitle}
                onChange={(e) => setDescriptionTitle(e.target.value)}
                placeholder="Enter description title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              {imageUrl && (
                <div className="mb-4">
                  <img src={imageUrl || "/placeholder.svg"} alt="Uploaded" className="max-h-40 rounded" />
                </div>
              )}
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer"
              >
                <input {...getInputProps()} />
                <p>Drag & drop an image here, or click to select one</p>
                {files.length > 0 && <p className="mt-2 text-sm text-gray-500">Selected: {files[0].name}</p>}
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
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

