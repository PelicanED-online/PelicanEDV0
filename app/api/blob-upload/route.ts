import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"

// Generate a unique file name to avoid collisions
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now()
  const randomString = uuidv4().substring(0, 8)
  const extension = originalName.split(".").pop()
  return `${timestamp}-${randomString}.${extension}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "reading_images" // Default to reading_images

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const uniqueFileName = generateUniqueFileName(file.name)
    const key = `${folder}/${uniqueFileName}`

    // Upload to Vercel Blob Storage
    const { url } = await put(key, file, {
      access: "public",
    })

    return NextResponse.json({ success: true, url })
  } catch (error: any) {
    console.error("Error uploading to Blob Storage:", error)
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 })
  }
}
