import { supabase } from "@/lib/supabase"

export async function fetchSources(activityId: string) {
  try {
    const { data, error } = await supabase.from("sources").select("*").eq("activity_id", activityId)

    if (error) {
      console.error("Error fetching sources:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching sources:", error)
    return null
  }
}

export async function createSource(
  activityId: string,
  sourceTitleCe: string,
  sourceTitleAd: string,
  sourceText: string,
  sourceImage: string,
  sourceImageDescription: string,
  published: string,
) {
  try {
    const { data, error } = await supabase
      .from("sources")
      .insert([
        {
          activity_id: activityId,
          source_title_ce: sourceTitleCe,
          source_title_ad: sourceTitleAd,
          source_text: sourceText,
          source_image: sourceImage,
          source_image_description: sourceImageDescription,
          published,
        },
      ])
      .select()

    if (error) {
      console.error("Error creating source:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error creating source:", error)
    return null
  }
}

export async function updateSource(
  sourceId: string,
  sourceTitleCe: string,
  sourceTitleAd: string,
  sourceText: string,
  sourceImage: string,
  sourceImageDescription: string,
  published: string,
) {
  try {
    const { data, error } = await supabase
      .from("sources")
      .update({
        source_title_ce: sourceTitleCe,
        source_title_ad: sourceTitleAd,
        source_text: sourceText,
        source_image: sourceImage,
        source_image_description: sourceImageDescription,
        published,
      })
      .eq("source_id", sourceId)
      .select()

    if (error) {
      console.error("Error updating source:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error updating source:", error)
    return null
  }
}

export async function deleteSource(sourceId: string) {
  try {
    const { data, error } = await supabase.from("sources").delete().eq("source_id", sourceId).select()

    if (error) {
      console.error("Error deleting source:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error deleting source:", error)
    return null
  }
}
