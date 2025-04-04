import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Add these lines for debugging
console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Anon Key:", supabaseAnonKey ? supabaseAnonKey.substring(0, 5) + "..." : "MISSING")

// Check if environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Check your .env file or deployment settings.")
}

export const supabase = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Test the connection
supabase
  .from("subscriptions")
  .select("count", { count: "exact", head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error("Supabase connection test failed:", error)
    } else {
      console.log("Supabase connection successful. Subscription count:", count)
    }
  })
  .catch((err) => {
    console.error("Supabase connection test exception:", err)
  })

export type UserRole = "admin" | "district" | "school" | "teacher" | "student"

export interface UserInformation {
  id: string
  user_id: string
  role: UserRole
  school_id?: string
  district_id?: string
  firstName?: string
  lastName?: string
  created_at: string
  updated_at?: string
  data?: {
    role?: UserRole
  }
}

export async function getUserInformation(userId: string): Promise<UserInformation | null> {
  console.log("Getting user information for user ID:", userId)

  try {
    const { data, error } = await supabase.from("user_information").select("*").eq("user_id", userId).single()

    if (error) {
      console.error("Error fetching user information:", error)
      return null
    }

    console.log("User information retrieved:", data ? JSON.stringify(data) : "No data")
    return data as UserInformation
  } catch (error) {
    console.error("Exception in getUserInformation:", error)
    return null
  }
}

export async function getCurrentUser() {
  console.log("getCurrentUser function called")

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log(
      "Session check result:",
      !!session,
      sessionError ? "Error: " + JSON.stringify(sessionError) : "No error",
    )

    if (!session) {
      console.log("No session found")
      return null
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("User check result:", !!user, userError ? "Error: " + JSON.stringify(userError) : "No error")

    if (!user) {
      console.log("No user found")
      return null
    }

    const userInfo = await getUserInformation(user.id)

    if (!userInfo) {
      console.log("No user info found")
      return null
    }

    return {
      ...user,
      userInfo,
    }
  } catch (error) {
    console.error("Exception in getCurrentUser:", error)
    return null
  }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export const createClient = supabaseCreateClient

