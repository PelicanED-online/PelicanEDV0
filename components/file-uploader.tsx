"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileUploaderProps {
  onUpload: (file: File) => void | Promise<void>
  accept?: string
  maxSize?: number // in bytes
}

export function FileUploader({ onUpload, accept = "*", maxSize = 10 * 1024 * 1024 }: FileUploaderProps) {
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Check file type if accept is specified
    if (accept !== "*" && !file.type.match(accept.replace("*", ""))) {
      toast({
        title: "Invalid file type",
        description: `Please upload a file of type: ${accept}`,
        variant: "destructive",
      })
      return
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024)
      toast({
        title: "File too large",
        description: `File size should not exceed ${maxSizeMB} MB`,
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      await onUpload(file)
    } catch (error) {
      console.error("Error handling file:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={accept} className="hidden" />
      <div className="flex flex-col items-center justify-center space-y-2">
        <Upload className="h-8 w-8 text-gray-400" />
        <div className="text-sm text-gray-600">
          <span className="font-medium">Click to upload</span> or drag and drop
        </div>
        <p className="text-xs text-gray-500">
          {accept === "*" ? "Any file type" : accept.replace("image/*", "Images")} up to{" "}
          {Math.round(maxSize / (1024 * 1024))} MB
        </p>
        <Button type="button" variant="outline" size="sm" onClick={handleButtonClick} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Select File"}
        </Button>
      </div>
    </div>
  )
}

