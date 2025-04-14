import { supabase } from "@/lib/supabase"

interface SaveGraphicOrganizerProps {
  activityId: string
  templateType: string
  content: any
  order: number
  published: string
}

export const saveGraphicOrganizer = async ({
  activityId,
  templateType,
  content,
  order,
  published,
}: SaveGraphicOrganizerProps) => {
  try {
    // Check if a graphic organizer already exists for this activity
    const { data: existingOrganizer } = await supabase
      .from("graphic_organizers")
      .select("go_id")
      .eq("activity_id", activityId)
      .single()

    if (existingOrganizer) {
      // Update existing graphic organizer
      const { error: updateError } = await supabase
        .from("graphic_organizers")
        .update({
          template_type: templateType || null,
          content: content || null,
          order: order,
          published: published || "No",
        })
        .eq("activity_id", activityId)

      if (updateError) {
        console.error("Error updating graphic organizer:", updateError)
        throw updateError
      }
    } else {
      // Insert as new graphic organizer
      const { error: insertError } = await supabase.from("graphic_organizers").insert({
        activity_id: activityId,
        template_type: templateType || null,
        content: content || null,
        order: order,
        published: published || "No",
      })

      if (insertError) {
        console.error("Error inserting graphic organizer:", insertError)
        throw insertError
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error saving graphic organizer:", error)
    return { success: false, error: error.message || "Failed to save graphic organizer" }
  }
}
