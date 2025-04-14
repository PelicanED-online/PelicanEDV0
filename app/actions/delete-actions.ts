"use server"

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

// Initialize S3 client with explicit credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

export async function deleteFromS3Server(key: string) {
  try {
    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || "",
      Key: key,
    })

    await s3Client.send(command)
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting from S3:", error)
    throw new Error(error.message || "Failed to delete file from S3")
  }
}
