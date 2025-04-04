// Generate a unique file name to avoid collisions
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 10)
  const extension = originalName.split(".").pop()
  return `${timestamp}-${randomString}.${extension}`
}

// Function to upload directly to S3 using presigned URL
export async function uploadToS3Direct(file: File, folder = "reading_images"): Promise<string> {
  try {
    // Step 1: Get a presigned URL from our backend
    const uniqueFileName = generateUniqueFileName(file.name)
    const key = `${folder}/${uniqueFileName}`

    // Request a presigned URL from our backend
    const presignedUrlResponse = await fetch("/api/get-presigned-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key, contentType: file.type }),
    })

    if (!presignedUrlResponse.ok) {
      throw new Error("Failed to get presigned URL")
    }

    const { presignedUrl, fileUrl } = await presignedUrlResponse.json()

    // Step 2: Upload the file directly to S3 using the presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to S3")
    }

    // Return the public URL of the uploaded file
    return fileUrl
  } catch (error) {
    console.error("Error uploading to S3:", error)
    throw new Error("Failed to upload file to S3")
  }
}

// Function to delete a file from S3
export async function deleteFromS3Direct(url: string): Promise<void> {
  try {
    // Extract the key from the URL
    const urlObj = new URL(url)
    const key = urlObj.pathname.substring(1) // Remove the leading slash

    // Request deletion from our backend
    const response = await fetch("/api/delete-s3-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key }),
    })

    if (!response.ok) {
      throw new Error("Failed to delete file from S3")
    }
  } catch (error) {
    console.error("Error deleting from S3:", error)
    throw new Error("Failed to delete file from S3")
  }
}

