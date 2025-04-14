"use server"

import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export interface School {
  school_id: string
  school_name: string
  district_id: string
}

/**
 * Fetches all schools for a specific district
 * @param districtId The ID of the district to fetch schools for
 * @returns Array of schools in the district
 */
export async function getSchoolsByDistrict(districtId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("schools")
      .select("school_id, school_name, district_id")
      .eq("district_id", districtId)
      .order("school_name", { ascending: true })

    if (error) {
      console.error("Error fetching schools:", error)
      return {
        success: false,
        message: "Failed to fetch schools",
        schools: [],
      }
    }

    return {
      success: true,
      schools: data as School[],
    }
  } catch (error) {
    console.error("Unexpected error fetching schools:", error)
    return {
      success: false,
      message: "An error occurred while fetching schools",
      schools: [],
    }
  }
}
