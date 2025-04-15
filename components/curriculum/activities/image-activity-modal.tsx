"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { useToast } from "@/hooks/use-toast"

interface ImageActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: any
  initialData?: any
  onSave: (data: any) => void
}

export function ImageActivityModal({ open, onOpenChange, activity, initialData, onSave }: ImageActivityModalProps) {
  const { toast } = useToast()
  const [formState, setFormState] = useState({
    image_id: "",
    activity_id: "",
    img_url: "",
    img_title: "",
    description_title: "",
    description: "",
    alt: "",
    position: "center",
    published: "No",
  })
  const [isUploading, setIsUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormState({
          image_id: initialData.image_id || "",
          activity_id: initialData.activity_id || "",
          img_url: initialData.img_url || "",
          img_title: initialData.img_title || "",
          description_title: initialData.description_title || "",
          description: initialData.description || "",
          alt: initialData.alt || "",
          position: initialData.position || "center",
          published: initialData.published || "No",
        })
        setImagePreview(initialData.img_url || null)
      } else if (activity) {
        setFormState({
          image_id: uuidv4(),
          activity_id: activity.activity_id,
          img_url: "",
          img_title: "",
          description_title: "",
          description: "",
          alt: "",
          position: "center",
          published: "No",
        })
        setImagePreview(null)
      }
    }
  }, [open, initialData, activity])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormState((prev) => ({ ...prev, published: checked ? "Yes" : "No" }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]

    // Validate file type
    const fileExt = file.name.split(".").pop()?.toLowerCase()
    const allowedTypes = ["jpg", "jpeg", "png", "gif", "webp"]

    if (!fileExt || !allowedTypes.includes(fileExt)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (jpg, jpeg, png, gif, webp)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Create a unique filename to avoid collisions
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `reading_images/${fileName}`

      // Upload file to Supabase storage
      const { error: uploadError, data: uploadData } = await supabase.storage.from("media").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        throw uploadError
      }

      // Create a signed URL with 1-year expiration
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("media")
        .createSignedUrl(filePath, 31536000) // 1 year in seconds

      if (signedUrlError) {
        throw signedUrlError
      }

      const signedUrl = signedUrlData?.signedUrl

      if (!signedUrl) {
        throw new Error("Failed to generate signed URL")
      }

      // Update the form state with the signed URL
      setFormState({
        ...formState,
        img_url: signedUrl,
      })

      // Show preview
      setImagePreview(signedUrl)

      toast({
        title: "Image uploaded successfully",
        description: "Your image has been uploaded and will be saved when you submit the form.",
      })
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error uploading image",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formState.img_url) {
      toast({
        title: "Missing image",
        description: "Please upload an image before saving",
        variant: "destructive",
      })
      return
    }

    onSave(formState)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{initialData ? "Edit Image" : "Add Image"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-upload">Upload Image</Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="mt-1"
                  />
                  {isUploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
                </div>

                {imagePreview && (
                  <div className="border rounded-md p-2">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-h-48 mx-auto object-contain"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="img_title">Image Title</Label>
                  <Input
                    id="img_title"
                    name="img_title"
                    value={formState.img_title}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="alt">Alt Text (for accessibility)</Label>
                  <Input
                    id="alt"
                    name="alt"
                    value={formState.alt}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Describe the image for screen readers"
                  />
                </div>

                <div>
                  <Label htmlFor="position">Position</Label>
                  <Select value={formState.position} onValueChange={(value) => handleSelectChange("position", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description_title">Description Title</Label>
                  <Input
                    id="description_title"
                    name="description_title"
                    value={formState.description_title}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formState.description}
                    onChange={handleInputChange}
                    className="mt-1 min-h-[150px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="published" checked={formState.published === "Yes"} onCheckedChange={handleSwitchChange} />
                  <Label htmlFor="published">Published ({formState.published})</Label>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

