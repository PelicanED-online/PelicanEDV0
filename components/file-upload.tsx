"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"

interface FileUploadProps {
  onChange: (urls: string[]) => void
  value?: string[]
  endpoint?: string
  onUploadComplete?: (res: any) => void
}

export function FileUpload({ onChange, value, endpoint, onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [urls, setUrls] = useState<string[]>(value || [])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setFiles(acceptedFiles)

      if (endpoint) {
        const uploadedUrls: string[] = []
        for (const file of acceptedFiles) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("folder", "slides") // You can adjust the folder as needed

          try {
            const response = await fetch(`/api/${endpoint}`, {
              method: "POST",
              body: formData,
            })

            if (response.ok) {
              const data = await response.json()
              uploadedUrls.push(data.url)
              onUploadComplete?.(data)
            } else {
              console.error("Upload failed")
            }
          } catch (error) {
            console.error("Upload error:", error)
          }
        }
        setUrls((prev) => [...prev, ...uploadedUrls])
        onChange([...urls, ...uploadedUrls])
      } else {
        const objectUrls = acceptedFiles.map((file) => URL.createObjectURL(file))
        setUrls((prev) => [...prev, ...objectUrls])
        onChange([...urls, ...objectUrls])
      }
    },
    [onChange, endpoint, urls, onUploadComplete],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
        isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2">
        <Upload className="h-8 w-8 text-gray-400" />
        <div className="text-sm text-gray-600">
          <span className="font-medium">Click to upload</span> or drag and drop
        </div>
        <p className="text-xs text-gray-500">Images up to 5 MB</p>
      </div>
    </div>
  )
}
