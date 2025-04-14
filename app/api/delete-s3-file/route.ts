import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json({ error: "No file key provided" }, { status: 400 })
    }

    // Get AWS credentials from environment variables
    const region = process.env.AWS_REGION || ""
    const bucket = process.env.AWS_S3_BUCKET_NAME || ""
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ""
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ""

    // Create a date for headers and the credential string
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "")
    const dateStamp = amzDate.slice(0, 8)

    // Create canonical request
    const method = "DELETE"
    const canonicalUri = `/${key}`
    const canonicalQueryString = ""
    const canonicalHeaders = `host:${bucket}.s3.${region}.amazonaws.com\nx-amz-date:${amzDate}\n`
    const signedHeaders = "host;x-amz-date"
    const payloadHash = crypto.createHash("sha256").update("").digest("hex")
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

    // Create string to sign
    const algorithm = "AWS4-HMAC-SHA256"
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash("sha256").update(canonicalRequest).digest("hex")}`

    // Calculate signature
    const kDate = crypto.createHmac("sha256", `AWS4${secretAccessKey}`).update(dateStamp).digest()
    const kRegion = crypto.createHmac("sha256", kDate).update(region).digest()
    const kService = crypto.createHmac("sha256", kRegion).update("s3").digest()
    const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest()
    const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex")

    // Create authorization header
    const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    // Make the DELETE request to S3
    const response = await fetch(`https://${bucket}.s3.${region}.amazonaws.com/${key}`, {
      method: "DELETE",
      headers: {
        "X-Amz-Date": amzDate,
        Authorization: authorizationHeader,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete file from S3: ${response.statusText}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting from S3:", error)
    return NextResponse.json({ error: error.message || "Failed to delete file" }, { status: 500 })
  }
}
