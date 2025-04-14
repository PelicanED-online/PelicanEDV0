import { SignJWT, jwtVerify } from "jose"

// Secret key for JWT signing and verification
// In production, this should be an environment variable
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-min-32-chars-long-here")

export interface InvitationJwtPayload {
  id: string
  role: string
  district_id?: string
  school_id?: string
  academic_year_id: string
  code: string
  exp?: number
}

/**
 * Create a signed JWT containing invitation data
 */
export async function createInvitationJwt(data: InvitationJwtPayload): Promise<string> {
  // Set expiration to 30 minutes from now
  const exp = Math.floor(Date.now() / 1000) + 30 * 60

  return new SignJWT({ ...data, exp })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(JWT_SECRET)
}

/**
 * Verify and decode a JWT
 */
export async function verifyInvitationJwt(token: string): Promise<InvitationJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as InvitationJwtPayload
  } catch (error) {
    console.error("JWT verification failed:", error)
    return null
  }
}
