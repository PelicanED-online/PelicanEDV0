import { supabase } from "@/lib/supabase"

export async function fetchReadings(activityId: string) {
  try {
    const { data, error } = await supabase.from("readings").select("*").eq("activity_id", activityId)

    if (error) {
      console.error("Error fetching readings:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching readings:", error)
    return null
  }
}

export async function createReading(activityId: string, readingTitle: string, reaingText: string, published: string) {
  try {
    const { data, error } = await supabase
      .from("readings")
      .insert([{ activity_id: activityId, reading_title: readingTitle, reaing_text: reaingText, published }])
      .select()

    if (error) {
      console.error("Error creating reading:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error creating reading:", error)
    return null
  }
}

export async function updateReading(readingId: string, readingTitle: string, reaingText: string, published: string) {
  try {
    const { data, error } = await supabase
      .from("readings")
      .update({ reading_title: readingTitle, reaing_text: reaingText, published })
      .eq("reading_id", readingId)
      .select()

    if (error) {
      console.error("Error updating reading:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error updating reading:", error)
    return null
  }
}

export async function deleteReading(readingId: string) {
  try {
    const { data, error } = await supabase.from("readings").delete().eq("reading_id", readingId).select()

    if (error) {
      console.error("Error deleting reading:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error deleting reading:", error)
    return null
  }
}
