import { v4 as uuidv4 } from "uuid"

// Generate a unique file name to avoid collisions
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now()
  const randomString = uuidv4().substring(0, 8)
  const extension = originalName.split(".").pop()
  return `${timestamp}-${randomString}.${extension}`
}

// Upload file to Vercel Blob Storage
export async function uploadToBlob(file: File, folder = "reading_images"): Promise<string> {
  try {
    const uniqueFileName = generateUniqueFileName(file.name)
    const key = `${folder}/${uniqueFileName}`

    // Upload to Vercel Blob Storage via API route
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)

    const response = await fetch("/api/blob-upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to upload file")
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error("Error uploading to Blob Storage:", error)
    throw new Error("Failed to upload file")
  }
}

// Delete file from Vercel Blob Storage
export async function deleteFromBlob(url: string): Promise<void> {
  try {
    const response = await fetch("/api/blob-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to delete file")
    }
  } catch (error) {
    console.error("Error deleting from Blob Storage:", error)
    throw new Error("Failed to delete file")
  }
}
