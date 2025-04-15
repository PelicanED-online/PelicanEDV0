import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Function to generate a presigned URL for S3 without using AWS SDK
export async function POST(request: NextRequest) {
  try {
    const { key, contentType } = await request.json()

    if (!key) {
      return NextResponse.json({ error: "No file key provided" }, { status: 400 })
    }

    // Get AWS credentials from environment variables
    const region = process.env.AWS_REGION || ""
    const bucket = process.env.AWS_S3_BUCKET_NAME || ""
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ""
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ""

    // Calculate expiration time (15 minutes from now)
    const expiresIn = 15 * 60 // 15 minutes in seconds
    const expirationDate = Math.floor(Date.now() / 1000) + expiresIn

    // Create the policy for the presigned URL
    const policy = {
      expiration: new Date(expirationDate * 1000).toISOString(),
      conditions: [
        { bucket },
        { key },
        { "Content-Type": contentType },
        ["content-length-range", 0, 10485760], // 10MB max file size
        { acl: "public-read" },
      ],
    }

    // Convert policy to base64
    const policyBase64 = Buffer.from(JSON.stringify(policy)).toString("base64")

    // Create signature
    const signature = crypto.createHmac("sha1", secretAccessKey).update(policyBase64).digest("base64")

    // Construct the presigned URL
    const presignedUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

    // Construct the public URL for the file
    const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

    return NextResponse.json({
      presignedUrl,
      fileUrl,
      fields: {
        key,
        bucket,
        "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
        "X-Amz-Credential": `${accessKeyId}/${new Date().toISOString().slice(0, 10)}/${region}/s3/aws4_request`,
        Policy: policyBase64,
        "X-Amz-Signature": signature,
        "Content-Type": contentType,
        acl: "public-read",
      },
    })
  } catch (error: any) {
    console.error("Error generating presigned URL:", error)
    return NextResponse.json({ error: error.message || "Failed to generate presigned URL" }, { status: 500 })
  }
}

