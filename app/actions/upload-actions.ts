"use server"

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from "uuid"

// Initialize S3 client with explicit credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

// Generate a unique file name to avoid collisions
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now()
  const randomString = uuidv4().substring(0, 8)
  const extension = originalName.split(".").pop()
  return `${timestamp}-${randomString}.${extension}`
}

export async function uploadToS3Server(
  fileBuffer: ArrayBuffer,
  fileName: string,
  contentType: string,
  folder = "reading_images",
) {
  try {
    const uniqueFileName = generateUniqueFileName(fileName)
    const key = `${folder}/${uniqueFileName}`

    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(fileBuffer)

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || "",
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read", // Make the file publicly accessible
    })

    await s3Client.send(command)

    // Return the public URL
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    return { success: true, url: fileUrl }
  } catch (error: any) {
    console.error("Error uploading to S3:", error)
    throw new Error(error.message || "Failed to upload file to S3")
  }
}

