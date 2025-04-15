import { type NextRequest, NextResponse } from "next/server"
import { uploadToSupabaseStorage } from "@/lib/supabase-storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "reading_images" // Default to reading_images

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload to Supabase Storage
    const url = await uploadToSupabaseStorage(file, folder)

    return NextResponse.json({ success: true, url })
  } catch (error: any) {
    console.error("Error uploading:", error)
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 })
  }
}
