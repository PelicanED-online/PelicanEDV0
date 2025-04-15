"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { getInvitationData, getDistrictDomains } from "./invitation-code-actions"
import { extractEmailDomain, isDomainAllowed } from "@/lib/email-validation"

// Create a Supabase client with admin privileges for server-side operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface RegisterUserParams {
  email: string
  password: string
  firstName: string
  lastName: string
  schoolId?: string
  invitationCode?: string
}

export async function registerUser({
  email,
  password,
  firstName,
  lastName,
  schoolId,
  invitationCode,
}: RegisterUserParams) {
  try {
    // Get invitation data from JWT cookie
    const invitationResult = await getInvitationData()

    if (!invitationResult.valid || !invitationResult.data) {
      return { error: "Invalid invitation data. Please try again with a valid invitation code." }
    }

    const codeData = invitationResult.data

    // If there's a district_id, validate the email domain
    if (codeData.district_id) {
      const domainsResult = await getDistrictDomains(codeData.district_id)

      if (domainsResult.success) {
        const allowedDomains = [domainsResult.domain, domainsResult.studentDomain].filter(Boolean)

        if (allowedDomains.length > 0) {
          const emailDomain = extractEmailDomain(email)
          const isAllowed = isDomainAllowed(emailDomain, allowedDomains)

          if (!isAllowed) {
            return {
              error: `Please use an email from one of these domains: ${allowedDomains.join(", ")}`,
            }
          }
        }
      }
    }

    // For school or teacher roles, validate that a school was selected
    if ((codeData.role === "school" || codeData.role === "teacher") && !schoolId) {
      return { error: "Please select your school." }
    }

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (authError) {
      console.error("Error creating user:", authError)

      // Check for specific error about email already registered
      if (authError.message.includes("already been registered")) {
        return { error: "An account with this email already exists. Please use a different email or try logging in." }
      }

      return { error: authError.message }
    }

    const userId = authData.user.id

    // 2. Create user information record
    const { error: userInfoError } = await supabaseAdmin.from("user_information").insert({
      user_id: userId,
      firstName,
      lastName,
      role: codeData.role || "student", // Use role from invitation code or default to student
    })

    if (userInfoError) {
      console.error("Error creating user information:", userInfoError)

      // Attempt to clean up the auth user if user_information creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId)

      return { error: userInfoError.message }
    }

    // 3. Process invitation data
    // Update user_information with role from invitation code
    if (codeData.role) {
      const { error: updateError } = await supabaseAdmin
        .from("user_information")
        .update({
          role: codeData.role,
        })
        .eq("user_id", userId)

      if (updateError) {
        console.error("Error updating user information with role:", updateError)
        return { error: updateError.message }
      }
    }

    // Create school_registration record
    // For school/teacher roles, use the selected school_id
    // For other roles, use the school_id from the invitation code if available
    const schoolIdToUse = codeData.role === "school" || codeData.role === "teacher" ? schoolId : codeData.school_id

    if (schoolIdToUse) {
      const { error: schoolRegError } = await supabaseAdmin.from("school_registration").insert({
        user_id: userId,
        school_id: schoolIdToUse,
      })

      if (schoolRegError) {
        console.error("Error creating school registration:", schoolRegError)
        return { error: schoolRegError.message }
      }
    }

    // Create district_registration record
    if (codeData.district_id) {
      const { error: districtRegError } = await supabaseAdmin.from("district_registration").insert({
        user_id: userId,
        district_id: codeData.district_id,
      })

      if (districtRegError) {
        console.error("Error creating district registration:", districtRegError)
        return { error: districtRegError.message }
      }
    }

    // Record the invitation code use
    const { error: useError } = await supabaseAdmin.from("invitation_code_uses").insert({
      invitation_code_id: codeData.id,
      user_id: userId,
    })

    if (useError) {
      console.error("Error recording invitation code use:", useError)
      // This is not critical, so we don't return an error
    }

    revalidatePath("/dashboard/admin/invitation-codes")
    return { success: true, userId }
  } catch (error: any) {
    console.error("Unexpected error during registration:", error)
    return { error: error.message || "An unexpected error occurred" }
  }
}

