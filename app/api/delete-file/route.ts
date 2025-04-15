import { type NextRequest, NextResponse } from "next/server"
import { deleteFromSupabaseStorage } from "@/lib/supabase-storage"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 })
    }

    // Delete from Supabase Storage
    await deleteFromSupabaseStorage(url)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting:", error)
    return NextResponse.json({ error: error.message || "Failed to delete file" }, { status: 500 })
  }
}

