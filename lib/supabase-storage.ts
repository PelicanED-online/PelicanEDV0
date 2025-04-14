import { v4 as uuidv4 } from "uuid"
import { supabase } from "./supabase"

// Generate a unique file name to avoid collisions
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now()
  const randomString = uuidv4().substring(0, 8)
  const extension = originalName.split(".").pop()
  return `${timestamp}-${randomString}.${extension}`
}

// Upload file to Supabase Storage
export async function uploadToSupabaseStorage(file: File, folder = "reading_images"): Promise<string> {
  try {
    const uniqueFileName = generateUniqueFileName(file.name)
    const filePath = `${folder}/${uniqueFileName}`

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("media") // Use your bucket name here
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (error) throw error

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("media") // Use your bucket name here
      .getPublicUrl(data.path)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error("Error uploading to Supabase Storage:", error)
    throw new Error("Failed to upload file")
  }
}

// Delete file from Supabase Storage
export async function deleteFromSupabaseStorage(url: string): Promise<void> {
  try {
    // Extract the path from the URL
    // The URL format is typically: https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    const bucketIndex = pathParts.findIndex((part) => part === "public") + 1

    if (bucketIndex <= 0) throw new Error("Invalid Supabase Storage URL")

    const bucket = pathParts[bucketIndex]
    const path = pathParts.slice(bucketIndex + 1).join("/")

    // Delete file from Supabase Storage
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) throw error
  } catch (error) {
    console.error("Error deleting from Supabase Storage:", error)
    throw new Error("Failed to delete file")
  }
}
