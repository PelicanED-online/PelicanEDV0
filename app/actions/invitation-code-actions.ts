"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createInvitationJwt } from "@/lib/jwt"

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function validateInvitationCode(code: string) {
  try {
    // Normalize the code: trim whitespace and convert to uppercase
    const normalizedCode = code.trim().toUpperCase()

    // Use the admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("invitation_codes")
      .select("*")
      .eq("invitation_code", normalizedCode)

    if (error) {
      console.error("Error querying invitation code:", error)
      return {
        valid: false,
        message: "Error validating invitation code",
      }
    }

    // Check if any matching codes were found
    if (!data || data.length === 0) {
      return {
        valid: false,
        message: "Invalid invitation code",
      }
    }

    // If multiple codes were found (shouldn't happen, but just in case),
    // use the first one
    const codeData = data[0]

    // Get the code usage count
    const { data: usesData, error: usesError } = await supabaseAdmin
      .from("invitation_code_uses")
      .select("id")
      .eq("invitation_code_id", codeData.invitation_code_id)

    if (usesError) {
      console.error("Error fetching code uses:", usesError)
      return {
        valid: false,
        message: "Error validating invitation code",
      }
    }

    const usedCount = usesData ? usesData.length : 0

    // Check if the code is expired based on academic_year expiry_date
    // First, get the academic year data
    const { data: academicYearData, error: academicYearError } = await supabaseAdmin
      .from("academic_years")
      .select("expiry_date")
      .eq("academic_year_id", codeData.academic_year_id)
      .single()

    if (academicYearError) {
      console.error("Error fetching academic year:", academicYearError)
      return {
        valid: false,
        message: "Error validating invitation code",
      }
    }

    // Check if the academic year has an expiry date and if it's expired
    if (academicYearData && academicYearData.expiry_date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Set to beginning of day for date comparison

      const expiryDate = new Date(academicYearData.expiry_date)

      if (today > expiryDate) {
        return {
          valid: false,
          message: "This invitation code has expired",
        }
      }
    }

    // Check if the code has reached its usage limit
    if (codeData.number_of_uses !== null && usedCount >= codeData.number_of_uses) {
      return {
        valid: false,
        message: "This invitation code has reached its usage limit",
      }
    }

    // Code is valid and available
    // Create a JWT with the invitation data
    const invitationData = {
      id: codeData.invitation_code_id,
      role: codeData.role,
      district_id: codeData.district_id,
      school_id: codeData.school_id,
      academic_year_id: codeData.academic_year_id,
      code: normalizedCode,
    }

    const token = await createInvitationJwt(invitationData)

    // Store the JWT in a secure HTTP-only cookie
    cookies().set("invitation_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60, // 30 minutes
      path: "/",
      sameSite: "strict",
    })

    return {
      valid: true,
      // We should NOT return detailed data here that might be used for URL parameters
      // Just return minimal information needed for the UI
      message: "Invitation code validated successfully",
    }
  } catch (error) {
    console.error("Unexpected error validating invitation code:", error)
    return {
      valid: false,
      message: "An error occurred while validating the invitation code",
    }
  }
}

export async function getInvitationData() {
  try {
    // Get the JWT from the cookie
    const token = cookies().get("invitation_token")?.value

    if (!token) {
      return {
        valid: false,
        message: "No invitation data found. Please verify your invitation code first.",
      }
    }

    // Import the verification function dynamically to avoid issues with TextEncoder in SSR
    const { verifyInvitationJwt } = await import("@/lib/jwt")

    // Verify and decode the JWT
    const data = await verifyInvitationJwt(token)

    if (!data) {
      return {
        valid: false,
        message: "Invalid or expired invitation data. Please try again.",
      }
    }

    return {
      valid: true,
      data,
    }
  } catch (error) {
    console.error("Error retrieving invitation data:", error)
    return {
      valid: false,
      message: "Failed to retrieve invitation data",
    }
  }
}

export async function clearInvitationData() {
  // Clear the invitation token cookie
  cookies().delete("invitation_token")
  return { success: true }
}

/**
 * Fetches the domain and student_domain for a district
 * @param districtId The ID of the district to fetch domains for
 * @returns Object containing the domain and student_domain
 */
export async function getDistrictDomains(districtId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("districts")
      .select("domain, student_domain")
      .eq("district_id", districtId)
      .single()

    if (error) {
      console.error("Error fetching district domains:", error)
      return {
        success: false,
        message: "Failed to fetch district domains",
        domain: "",
        studentDomain: "",
      }
    }

    return {
      success: true,
      domain: data.domain || "",
      studentDomain: data.student_domain || "",
    }
  } catch (error) {
    console.error("Unexpected error fetching district domains:", error)
    return {
      success: false,
      message: "An error occurred while fetching district domains",
      domain: "",
      studentDomain: "",
    }
  }
}

