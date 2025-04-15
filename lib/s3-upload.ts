import { uploadToSupabaseStorage, deleteFromSupabaseStorage } from "./supabase-storage"

// Upload file to S3 (now using Supabase Storage)
export const uploadToS3 = async (file: File, folder = "reading_images"): Promise<string> => {
  return uploadToSupabaseStorage(file, folder)
}

// Delete file from S3 (now using Supabase Storage)
export const deleteFromS3 = async (url: string): Promise<void> => {
  return deleteFromSupabaseStorage(url)
}

