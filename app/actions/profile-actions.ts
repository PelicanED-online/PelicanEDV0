"use server"

import { supabase } from "@/lib/supabase"

export async function updateUserProfile(userId: string, data: { firstName: string; lastName: string }) {
  try {
    const { error } = await supabase
      .from("user_information")
      .update({
        firstName: data.firstName,
        lastName: data.lastName,
        // Removed the updated_at field as it doesn't exist in the schema
      })
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Exception in updateUserProfile:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

