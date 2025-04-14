import { supabase } from "@/lib/supabase"
import type { Activity, ActivityType } from "@/lib/types/activity"
import { v4 as uuidv4 } from "uuid"

export async function fetchActivities(lessonId: string) {
  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("order", { ascending: true })

    if (error) {
      console.error("Error fetching activities:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching activities:", error)
    return null
  }
}

export async function createActivity(lessonId: string, name: string, published: string) {
  try {
    const { data, error } = await supabase
      .from("activities")
      .insert([{ lesson_id: lessonId, name, published, activity_id: uuidv4() }])
      .select()

    if (error) {
      console.error("Error creating activity:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error creating activity:", error)
    return null
  }
}

export async function updateActivity(activityId: string, name: string, published: string) {
  try {
    const { data, error } = await supabase
      .from("activities")
      .update({ name, published })
      .eq("activity_id", activityId)
      .select()

    if (error) {
      console.error("Error updating activity:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error updating activity:", error)
    return null
  }
}

export async function deleteActivity(activityId: string) {
  try {
    const { data, error } = await supabase.from("activities").delete().eq("activity_id", activityId).select()

    if (error) {
      console.error("Error deleting activity:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error deleting activity:", error)
    return null
  }
}

export async function updateActivityOrder(activityId: string, order: number) {
  try {
    const { data, error } = await supabase.from("activities").update({ order }).eq("activity_id", activityId).select()

    if (error) {
      console.error("Error updating activity order:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error updating activity order:", error)
    return null
  }
}

export async function fetchActivitiesOld(lessonId: string) {
  try {
    // Fetch activities
    const { data: activitiesData, error: activitiesError } = await supabase
      .from("activities")
      .select("activity_id, lesson_id, order, name, published")
      .eq("lesson_id", lessonId)
      .order("order", { ascending: true })

    if (activitiesError) throw activitiesError

    const activities = activitiesData || []

    // Initialize activity types map
    const typesMap: Record<string, ActivityType[]> = {}
    const detailsMap: Record<string, any> = {}

    // Fetch readings
    const { data: readingsData, error: readingsError } = await supabase
      .from("readings")
      .select("*")
      .in("activity_id", activities.map((a) => a.activity_id) || [])

    if (readingsError) throw readingsError

    // Fetch sources
    const { data: sourcesData, error: sourcesError } = await supabase
      .from("sources")
      .select("*")
      .in("activity_id", activities.map((a) => a.activity_id) || [])

    if (sourcesError) throw sourcesError

    // Fetch in-text sources
    const { data: inTextSourcesData, error: inTextSourcesError } = await supabase
      .from("in_text_source")
      .select("*")
      .in("actvity_id", activities.map((a) => a.activity_id) || [])

    if (inTextSourcesError) throw inTextSourcesError

    // Fetch questions
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .in("activity_id", activities.map((a) => a.activity_id) || [])

    if (questionsError) throw questionsError

    // Fetch Part B content for Part A Part B questions
    const partAQuestionIds = questionsData
      .filter((q) => q.question_type === "Part A Part B Question")
      .map((q) => q.question_id)

    let partBData: any[] = []
    if (partAQuestionIds.length > 0) {
      const { data: fetchedPartBData, error: partBError } = await supabase
        .from("questions_partb")
        .select("*")
        .in("part_a_id", partAQuestionIds)

      if (partBError) throw partBError
      partBData = fetchedPartBData || []
    }

    // Fetch question choices for multiple choice and multiple select questions
    const { data: questionChoicesData, error: questionChoicesError } = await supabase
      .from("question_choices")
      .select("*")
      .in(
        "question_id",
        questionsData
          .filter((q) => q.question_type === "Multiple Choice" || q.question_type === "Multiple Select")
          .map((q) => q.question_id) || [],
      )
      .order("order", { ascending: true })

    if (questionChoicesError) throw questionChoicesError

    // Fetch graphic organizers
    const { data: organizersData, error: organizersError } = await supabase
      .from("graphic_organizers")
      .select("*")
      .in("activity_id", activities.map((a) => a.activity_id) || [])

    if (organizersError) throw organizersError

    // Fetch vocabulary
    const { data: vocabularyData, error: vocabularyError } = await supabase
      .from("vocabulary")
      .select("*")
      .in("activity_id", activities.map((a) => a.activity_id) || [])

    if (vocabularyError) throw vocabularyError

    // Fetch images
    const { data: imagesData, error: imagesError } = await supabase
      .from("images")
      .select("*")
      .in("activity_id", activities.map((a) => a.activity_id) || [])

    if (imagesError) throw imagesError

    // Fetch reading addons
    const { data: readingAddonsData, error: readingAddonsError } = await supabase
      .from("readings_addon")
      .select("*")
      .in("activity_id", activities.map((a) => a.activity_id) || [])

    if (readingAddonsError) throw readingAddonsError

    // Fetch sub-readings
    const { data: subReadingsData, error: subReadingsError } = await supabase
      .from("sub_readings")
      .select("*")
      .in("activity_id", activities.map((a) => a.activity_id) || [])

    if (subReadingsError) throw subReadingsError

    // Process readings
    for (const reading of readingsData) {
      const activityId = reading.activity_id
      const typeId = reading.reading_id // Use reading_id as the unique identifier

      if (!typesMap[activityId]) {
        typesMap[activityId] = []
      }

      typesMap[activityId].push({
        id: typeId,
        activity_id: activityId,
        type: "reading",
        order: reading.order !== undefined ? reading.order : typesMap[activityId].length,
      })

      // Include reading_id in the details
      detailsMap[typeId] = {
        ...reading,
      }
    }

    // Process reading addons
    for (const readingAddon of readingAddonsData) {
      const activityId = readingAddon.activity_id
      const typeId = readingAddon.reading_id // Use reading_id as the unique identifier

      if (!typesMap[activityId]) {
        typesMap[activityId] = []
      }

      typesMap[activityId].push({
        id: typeId,
        activity_id: activityId,
        type: "reading_addon",
        order: readingAddon.order !== undefined ? readingAddon.order : typesMap[activityId].length,
      })

      // Include reading_id in the details
      detailsMap[typeId] = {
        ...readingAddon,
      }
    }

    // Process sub readings
    for (const subReading of subReadingsData) {
      const activityId = subReading.activity_id
      const typeId = subReading.reading_id // Use reading_id as the unique identifier

      if (!typesMap[activityId]) {
        typesMap[activityId] = []
      }

      typesMap[activityId].push({
        id: typeId,
        activity_id: activityId,
        type: "sub_reading",
        order: subReading.order !== undefined ? subReading.order : typesMap[activityId].length,
      })

      // Include reading_id in the details
      detailsMap[typeId] = {
        ...subReading,
      }
    }

    // Process sources
    for (const source of sourcesData) {
      const activityId = source.activity_id
      const typeId = source.source_id // Use source_id as the unique identifier

      if (!typesMap[activityId]) {
        typesMap[activityId] = []
      }

      typesMap[activityId].push({
        id: typeId,
        activity_id: activityId,
        type: "source",
        order: source.order !== undefined ? source.order : typesMap[activityId].length,
      })

      // Include source_id in the details
      detailsMap[typeId] = {
        ...source,
      }
    }

    // Process in-text sources
    for (const inTextSource of inTextSourcesData) {
      const activityId = inTextSource.actvity_id // Note the typo in the database column name
      const typeId = inTextSource.in_text_source_id

      if (!typesMap[activityId]) {
        typesMap[activityId] = []
      }

      typesMap[activityId].push({
        id: typeId,
        activity_id: activityId,
        type: "in_text_source",
        order: inTextSource.order !== undefined ? inTextSource.order : typesMap[activityId].length,
      })

      // Include in_text_source_id in the details
      detailsMap[typeId] = {
        activity_id: activityId,
        in_text_source_id: inTextSource.in_text_source_id,
        source_title_ad: inTextSource.source_title_ad,
        source_title_ce: inTextSource.source_title_ce,
        source_intro: inTextSource.source_intro,
        source_text: inTextSource.source_text,
        order: inTextSource.order,
        published: inTextSource.published || "No", // Use the actual published value or default to "No"
      }
    }

    // Process questions
    for (const question of questionsData) {
      const activityId = question.activity_id
      const typeId = question.question_id // Use question_id as the unique identifier

      if (!typesMap[activityId]) {
        typesMap[activityId] = []
      }

      typesMap[activityId].push({
        id: typeId,
        activity_id: activityId,
        type: "question",
        order: question.order !== undefined ? question.order : typesMap[activityId].length,
      })

      // Find answer options for this question
      const answerOptions = questionChoicesData
        ? questionChoicesData
            .filter((choice) => choice.question_id === question.question_id)
            .map((choice) => ({
              question_choices_id: choice.question_choices_id,
              choice_text: choice.choice_text || "",
              is_correct: choice.is_correct || false,
              order: choice.order || 0,
            }))
            .sort((a, b) => a.order - b.order)
        : []

      // Find Part B content if this is a Part A Part B question
      let partB = null
      if (question.question_type === "Part A Part B Question") {
        const partBRecord = partBData.find((pb) => pb.part_a_id === question.question_id)
        if (partBRecord) {
          partB = partBRecord.question_text
        }
      }

      // Include question_id, answer options, and Part B content in the details
      detailsMap[typeId] = {
        ...question,
        answerOptions,
        partB, // Add Part B content
      }
    }

    // Process graphic organizers
    for (const organizer of organizersData) {
      const activityId = organizer.activity_id
      const typeId = organizer.go_id // Use go_id as the unique identifier

      if (!typesMap[activityId]) {
        typesMap[activityId] = []
      }

      typesMap[activityId].push({
        id: typeId,
        activity_id: activityId,
        type: "graphic_organizer",
        order: organizer.order !== undefined ? organizer.order : typesMap[activityId].length,
      })

      // Include go_id in the details
      detailsMap[typeId] = {
        ...organizer,
      }
    }

    // Process images
    for (const image of imagesData) {
      const activityId = image.activity_id
      const typeId = image.image_id // Use image_id as the unique identifier

      if (!typesMap[activityId]) {
        typesMap[activityId] = []
      }

      typesMap[activityId].push({
        id: typeId,
        activity_id: activityId,
        type: "image",
        order: image.order !== undefined ? image.order : typesMap[activityId].length,
      })

      // Include image_id in the details
      detailsMap[typeId] = {
        ...image,
      }
    }

    // Process vocabulary
    // Group vocabulary items by activity_id
    const vocabularyByActivity: Record<string, any[]> = {}

    for (const vocabItem of vocabularyData) {
      const activityId = vocabItem.activity_id

      if (!vocabularyByActivity[activityId]) {
        vocabularyByActivity[activityId] = []
      }

      vocabularyByActivity[activityId].push({
        id: vocabItem.vocabulary_id,
        word: vocabItem.word || "",
        definition: vocabItem.definition || "",
        order: vocabItem.order, // Keep the activity order
        vocab_order: vocabItem.vocab_order || vocabularyByActivity[activityId].length, // Use vocab_order for item ordering
      })
    }

    // Sort vocabulary items by vocab_order
    for (const activityId in vocabularyByActivity) {
      vocabularyByActivity[activityId].sort((a, b) => {
        // Handle the case where vocab_order might be 0
        const orderA = a.vocab_order !== undefined ? a.vocab_order : 0
        const orderB = b.vocab_order !== undefined ? b.vocab_order : 0
        return orderA - orderB
      })
    }

    // Create vocabulary activity types
    for (const activityId in vocabularyByActivity) {
      // Generate a unique ID for this vocabulary activity type
      const typeId = uuidv4()

      if (!typesMap[activityId]) {
        typesMap[activityId] = []
      }

      // Find the first vocabulary item to get the activity order
      const firstVocabItem = vocabularyByActivity[activityId][0]
      const activityOrder = firstVocabItem.order !== undefined ? firstVocabItem.order : typesMap[activityId].length

      // Add the vocabulary activity type with the correct order
      typesMap[activityId].push({
        id: typeId,
        activity_id: activityId,
        type: "vocabulary",
        order: activityOrder, // Use the order from the database
      })

      // Find the activity to get the published status
      const activity = activities.find((a) => a.activity_id === activityId)

      detailsMap[typeId] = {
        activity_id: activityId,
        order: activityOrder, // Also store the order in the details
        published: activity?.published || "No",
        items: vocabularyByActivity[activityId],
      }
    }

    // Sort activity types by order
    for (const activityId in typesMap) {
      typesMap[activityId].sort((a, b) => {
        // Handle the case where order might be 0
        const orderA = a.order !== undefined ? a.order : 0
        const orderB = b.order !== undefined ? b.order : 0
        return orderA - orderB
      })
    }

    return {
      activities,
      activityTypes: typesMap,
      activityTypeDetails: detailsMap,
    }
  } catch (error) {
    console.error("Error fetching activities:", error)
    throw error
  }
}

export async function saveActivities(
  lessonId: string,
  activities: Activity[],
  activityTypes: Record<string, ActivityType[]>,
  activityTypeDetails: Record<string, any>,
) {
  try {
    // Recalculate activity orders based on their current position in the array
    const updatedActivities = activities.map((activity, index) => ({
      ...activity,
      order: index + 1, // Ensure order starts at 1 and increments sequentially
    }))

    // First, update the activities table with the current order
    for (const activity of updatedActivities) {
      // Check if this is a new activity (not yet in the database)
      const { data: existingActivity } = await supabase
        .from("activities")
        .select("activity_id")
        .eq("activity_id", activity.activity_id)
        .single()

      if (!existingActivity) {
        // Insert new activity
        const { error: activityError } = await supabase.from("activities").insert({
          activity_id: activity.activity_id,
          lesson_id: lessonId,
          order: activity.order,
          name: activity.name,
          published: activity.published || "No",
        })

        if (activityError) throw activityError
      } else {
        // Update existing activity
        const { error: activityError } = await supabase
          .from("activities")
          .update({
            order: activity.order,
            name: activity.name,
            published: activity.published || "No",
          })
          .eq("activity_id", activity.activity_id)

        if (activityError) throw activityError
      }

      // Process activity types for this activity
      const types = activityTypes[activity.activity_id] || []

      // Also recalculate the order of activity types
      const updatedTypes = types.map((type, index) => ({
        ...type,
        order: index, // Ensure order starts at 0 and increments sequentially
      }))

      // Now process each activity type
      for (const activityType of updatedTypes) {
        const details = activityTypeDetails[activityType.id]

        if (!details) continue

        switch (activityType.type) {
          case "reading":
            await saveReading(activityType, details, activity.activity_id)
            break
          case "reading_addon":
            await saveReadingAddon(activityType, details, activity.activity_id)
            break
          case "sub_reading":
            await saveSubReading(activityType, details, activity.activity_id)
            break
          case "source":
            await saveSource(activityType, details, activity.activity_id)
            break
          case "in_text_source":
            await saveInTextSource(activityType, details, activity.activity_id)
            break
          case "question":
            await saveQuestion(activityType, details, activity.activity_id)
            break
          case "graphic_organizer":
            await saveGraphicOrganizer(activityType, details, activity.activity_id)
            break
          case "vocabulary":
            await saveVocabulary(activityType, details, activity.activity_id)
            break
          case "image":
            await saveImage(activityType, details, activity.activity_id)
            break
        }
      }

      // Clean up any readings in the database that are no longer in our state
      await cleanupDeletedItems(activity.activity_id, updatedTypes, activityTypeDetails)
    }

    // Clean up any activities in the database that are no longer in our state
    const { data: allActivities } = await supabase.from("activities").select("activity_id").eq("lesson_id", lessonId)

    if (allActivities) {
      const currentActivityIds = updatedActivities.map((a) => a.activity_id)
      const activitiesToDelete = allActivities.filter((a) => !currentActivityIds.includes(a.activity_id))

      for (const activityToDelete of activitiesToDelete) {
        // Delete all associated content
        await supabase.from("readings").delete().eq("activity_id", activityToDelete.activity_id)
        await supabase.from("sources").delete().eq("activity_id", activityToDelete.activity_id)
        await supabase.from("in_text_source").delete().eq("actvity_id", activityToDelete.activity_id)
        await supabase.from("questions").delete().eq("activity_id", activityToDelete.activity_id)
        await supabase.from("graphic_organizers").delete().eq("activity_id", activityToDelete.activity_id)
        await supabase.from("vocabulary").delete().eq("activity_id", activityToDelete.activity_id)
        await supabase.from("images").delete().eq("activity_id", activityToDelete.activity_id)
        await supabase.from("readings_addon").delete().eq("activity_id", activityToDelete.activity_id)
        await supabase.from("sub_readings").delete().eq("activity_id", activityToDelete.activity_id)

        // Delete the activity itself
        await supabase.from("activities").delete().eq("activity_id", activityToDelete.activity_id)
      }
    }
  } catch (error) {
    console.error("Error saving activities:", error)
    throw error
  }
}

async function saveReading(activityType: ActivityType, details: any, activityId: string) {
  // Check if this is an update or a new reading
  const { data: existingReading } = await supabase
    .from("readings")
    .select("reading_id")
    .eq("reading_id", details.reading_id)
    .single()

  if (existingReading) {
    // Update existing reading
    const { error: updateReadingError } = await supabase
      .from("readings")
      .update({
        reading_title: details.reading_title || null,
        reaing_text: details.reaing_text || null,
        order: activityType.order,
        published: details.published || "No",
      })
      .eq("reading_id", details.reading_id)

    if (updateReadingError) throw updateReadingError
  } else {
    // Insert as new reading
    // Ensure we have a valid UUID before inserting
    if (!details.reading_id || details.reading_id === "") {
      details.reading_id = uuidv4()
    }

    const { error: insertReadingError } = await supabase.from("readings").insert({
      reading_id: details.reading_id,
      activity_id: activityId,
      reading_title: details.reading_title || null,
      reaing_text: details.reaing_text || null,
      order: activityType.order,
      published: details.published || "No",
    })

    if (insertReadingError) throw insertReadingError
  }
}

async function saveReadingAddon(activityType: ActivityType, details: any, activityId: string) {
  // Check if this is an update or a new reading addon
  const { data: existingReadingAddon } = await supabase
    .from("readings_addon")
    .select("reading_id")
    .eq("reading_id", details.reading_id)
    .single()

  if (existingReadingAddon) {
    // Update existing reading addon
    const { error: updateReadingAddonError } = await supabase
      .from("readings_addon")
      .update({
        reaing_text: details.reaing_text || null,
        order: activityType.order,
        published: details.published || "No",
      })
      .eq("reading_id", details.reading_id)

    if (updateReadingAddonError) throw updateReadingAddonError
  } else {
    // Insert as new reading addon
    // Ensure we have a valid UUID before inserting
    if (!details.reading_id || details.reading_id === "") {
      details.reading_id = uuidv4()
    }

    const { error: insertReadingAddonError } = await supabase.from("readings_addon").insert({
      reading_id: details.reading_id,
      activity_id: activityId,
      reaing_text: details.reaing_text || null,
      order: activityType.order,
      published: details.published || "No",
    })

    if (insertReadingAddonError) throw insertReadingAddonError
  }
}

async function saveSubReading(activityType: ActivityType, details: any, activityId: string) {
  // Check if this is an update or a new sub-reading
  const { data: existingSubReading } = await supabase
    .from("sub_readings")
    .select("reading_id")
    .eq("reading_id", details.reading_id)
    .single()

  if (existingSubReading) {
    // Update existing sub-reading
    const { error: updateSubReadingError } = await supabase
      .from("sub_readings")
      .update({
        reading_title: details.reading_title || null,
        reaing_text: details.reaing_text || null,
        order: activityType.order,
        published: details.published || "No",
      })
      .eq("reading_id", details.reading_id)

    if (updateSubReadingError) throw updateSubReadingError
  } else {
    // Insert as new sub-reading
    // Ensure we have a valid UUID before inserting
    if (!details.reading_id || details.reading_id === "") {
      details.reading_id = uuidv4()
    }

    const { error: insertSubReadingError } = await supabase.from("sub_readings").insert({
      reading_id: details.reading_id,
      activity_id: activityId,
      reading_title: details.reading_title || null,
      reaing_text: details.reaing_text || null,
      order: activityType.order,
      published: details.published || "No",
    })

    if (insertSubReadingError) throw insertSubReadingError
  }
}

async function saveSource(activityType: ActivityType, details: any, activityId: string) {
  // Check if this is an update or a new source
  const { data: existingSource } = await supabase
    .from("sources")
    .select("source_id")
    .eq("source_id", details.source_id)
    .single()

  if (existingSource) {
    // Update existing source
    const { error: updateSourceError } = await supabase
      .from("sources")
      .update({
        source_title_ce: details.source_title_ce || null,
        source_title_ad: details.source_title_ad || null,
        source_text: details.source_text || null,
        source_image: details.source_image || null,
        source_image_description: details.source_image_description || null,
        order: activityType.order,
        published: details.published || "No",
      })
      .eq("source_id", details.source_id)

    if (updateSourceError) throw updateSourceError
  } else {
    // Insert as new source
    const { error: insertSourceError } = await supabase.from("sources").insert({
      source_id: details.source_id,
      activity_id: activityId,
      source_title_ce: details.source_title_ce || null,
      source_title_ad: details.source_title_ad || null,
      source_text: details.source_text || null,
      source_image: details.source_image || null,
      source_image_description: details.source_image_description || null,
      order: activityType.order,
      published: details.published || "No",
    })

    if (insertSourceError) throw insertSourceError
  }
}

async function saveInTextSource(activityType: ActivityType, details: any, activityId: string) {
  // Check if this is an update or a new in-text source
  const { data: existingInTextSource } = await supabase
    .from("in_text_source")
    .select("in_text_source_id")
    .eq("in_text_source_id", details.in_text_source_id)
    .single()

  if (existingInTextSource) {
    // Update existing in-text source
    const { error: updateInTextSourceError } = await supabase
      .from("in_text_source")
      .update({
        source_title_ce: details.source_title_ce || null,
        source_title_ad: details.source_title_ad || null,
        source_intro: details.source_intro || null,
        source_text: details.source_text || null,
        order: activityType.order,
        published: details.published || "No",
      })
      .eq("in_text_source_id", details.in_text_source_id)

    if (updateInTextSourceError) throw updateInTextSourceError
  } else {
    // Insert as new in-text source
    const { error: insertInTextSourceError } = await supabase.from("in_text_source").insert({
      in_text_source_id: details.in_text_source_id,
      actvity_id: activityId, // Note the typo in the column name
      source_title_ce: details.source_title_ce || null,
      source_title_ad: details.source_title_ad || null,
      source_intro: details.source_intro || null,
      source_text: details.source_text || null,
      order: activityType.order,
      published: details.published || "No",
    })

    if (insertInTextSourceError) throw insertInTextSourceError
  }
}

async function saveQuestion(activityType: ActivityType, details: any, activityId: string) {
  // Check if this is an update or a new question
  const { data: existingQuestion } = await supabase
    .from("questions")
    .select("question_id")
    .eq("question_id", details.question_id)
    .single()

  if (existingQuestion) {
    // Update existing question
    const { error: updateQuestionError } = await supabase
      .from("questions")
      .update({
        question: details.question || null, // Keep for backward compatibility
        question_text: details.question_text || details.question || null, // Use question_text if available, fall back to question
        question_title: details.question_title || null, // Add the new question_title field
        question_type: details.question_type || "Open Ended", // Add the new question_type field with default
        order: activityType.order,
        published: details.published || "No",
      })
      .eq("question_id", details.question_id)

    if (updateQuestionError) throw updateQuestionError

    // If this is a Part A Part B Question, update or create the Part B record
    if (details.question_type === "Part A Part B Question") {
      // Check if a Part B record already exists
      const { data: existingPartB } = await supabase
        .from("questions_partb")
        .select("*")
        .eq("part_a_id", details.question_id)
        .single()

      if (existingPartB) {
        // Update existing Part B
        const { error: updatePartBError } = await supabase
          .from("questions_partb")
          .update({
            question_text: details.partB || null,
          })
          .eq("part_a_id", details.question_id)

        if (updatePartBError) throw updatePartBError
      } else {
        // Create new Part B record
        const { error: insertPartBError } = await supabase.from("questions_partb").insert({
          part_a_id: details.question_id,
          question_text: details.partB || null,
        })

        if (insertPartBError) throw insertPartBError
      }
    }

    // Save question choices
    if (details.answerOptions && details.answerOptions.length > 0) {
      // First delete existing choices
      await supabase
        .from("question_choices")
        .delete()
        .eq('question_id", details.question_id)stion_choices')
        .delete()
        .eq("question_id", details.question_id)

      // Then insert new choices
      const choicesToInsert = details.answerOptions.map((option, index) => ({
        question_choices_id: option.question_choices_id || uuidv4(),
        question_id: details.question_id,
        choice_text: option.choice_text,
        is_correct: option.is_correct,
        order: index,
      }))

      const { error: insertChoicesError } = await supabase.from("question_choices").insert(choicesToInsert)
      if (insertChoicesError) throw insertChoicesError
    }
  } else {
    // Insert as new question
    // Ensure we have a valid UUID before inserting
    if (!details.question_id || details.question_id === "") {
      details.question_id = uuidv4()
    }

    const { error: insertQuestionError } = await supabase.from("questions").insert({
      question_id: details.question_id,
      activity_id: activityId,
      question: details.question || null, // Keep for backward compatibility
      question_text: details.question_text || details.question || null, // Use question_text if available, fall back to question
      question_title: details.question_title || null, // Add the new question_title field
      question_type: details.question_type || "Open Ended", // Add the new question_type field with default
      order: activityType.order,
      published: details.published || "No",
    })

    if (insertQuestionError) throw insertQuestionError

    // If this is a Part A Part B Question, create the Part B record
    if (details.question_type === "Part A Part B Question") {
      const { error: insertPartBError } = await supabase.from("questions_partb").insert({
        part_a_id: details.question_id,
        question_text: details.partB || null,
      })

      if (insertPartBError) throw insertPartBError
    }

    // Save question choices
    if (details.answerOptions && details.answerOptions.length > 0) {
      const choicesToInsert = details.answerOptions.map((option, index) => ({
        question_choices_id: option.question_choices_id || uuidv4(),
        question_id: details.question_id,
        choice_text: option.choice_text,
        is_correct: option.is_correct,
        order: index,
      }))

      const { error: insertChoicesError } = await supabase.from("question_choices").insert(choicesToInsert)
      if (insertChoicesError) throw insertChoicesError
    }
  }
}

async function saveGraphicOrganizer(activityType: ActivityType, details: any, activityId: string) {
  // Check if this is an update or a new graphic organizer
  const { data: existingOrganizer } = await supabase
    .from("graphic_organizers")
    .select("go_id")
    .eq("go_id", details.go_id)
    .single()

  if (existingOrganizer) {
    // Update existing graphic organizer
    const { error: updateOrganizerError } = await supabase
      .from("graphic_organizers")
      .update({
        template_type: details.template_type || null,
        content: details.content || null,
        order: activityType.order,
        published: details.published || "No",
      })
      .eq("go_id", details.go_id)

    if (updateOrganizerError) throw updateOrganizerError
  } else {
    // Insert as new graphic organizer
    const { error: insertOrganizerError } = await supabase.from("graphic_organizers").insert({
      go_id: details.go_id,
      activity_id: activityId,
      template_type: details.template_type || null,
      content: details.content || null,
      order: activityType.order,
      published: details.published || "No",
    })

    if (insertOrganizerError) throw insertOrganizerError
  }
}

async function saveVocabulary(activityType: ActivityType, details: any, activityId: string) {
  // First delete any existing vocabulary items for this activity
  await supabase.from("vocabulary").delete().eq("activity_id", activityId)

  // Then insert the new vocabulary items
  const vocabularyItems = details.items || []

  if (vocabularyItems.length > 0) {
    const vocabularyInserts = vocabularyItems.map((item, index) => ({
      vocabulary_id: item.id || uuidv4(),
      activity_id: activityId,
      word: item.word || null,
      definition: item.definition || null,
      order: activityType.order, // Use activityType.order for the activity order
      vocab_order: item.vocab_order !== undefined ? item.vocab_order : index, // Use vocab_order or index as fallback
    }))

    const { error: vocabularyError } = await supabase.from("vocabulary").insert(vocabularyInserts)

    if (vocabularyError) throw vocabularyError
  }
}

async function saveImage(activityType: ActivityType, details: any, activityId: string) {
  // Check if this is an update or a new image
  const { data: existingImage } = await supabase
    .from("images")
    .select("image_id")
    .eq("image_id", details.image_id)
    .single()

  if (existingImage) {
    // Update existing image
    const { error: updateImageError } = await supabase
      .from("images")
      .update({
        img_url: details.img_url || null,
        img_title: details.img_title || null,
        description_title: details.description_title || null,
        description: details.description || null,
        alt: details.alt || null,
        position: details.position || "center",
        order: activityType.order,
        published: details.published || "No",
      })
      .eq("image_id", details.image_id)

    if (updateImageError) throw updateImageError
  } else {
    // Insert as new image
    const { error: insertImageError } = await supabase.from("images").insert({
      image_id: details.image_id,
      activity_id: activityId,
      img_url: details.img_url || null,
      img_title: details.img_title || null,
      description_title: details.description_title || null,
      description: details.description || null,
      alt: details.alt || null,
      position: details.position || "center",
      order: activityType.order,
      published: details.published || "No",
    })

    if (insertImageError) throw insertImageError
  }
}

async function cleanupDeletedItems(
  activityId: string,
  updatedTypes: ActivityType[],
  activityTypeDetails: Record<string, any>,
) {
  // Clean up any readings in the database that are no longer in our state
  // Get all readings for this activity
  const { data: existingReadings } = await supabase
    .from("readings")
    .select("reading_id, activity_id")
    .eq("activity_id", activityId)

  if (existingReadings && existingReadings.length > 0) {
    // Find readings that are in the database but not in our state
    const readingTypesInState = updatedTypes
      .filter((type) => type.type === "reading")
      .map((type) => {
        const details = activityTypeDetails[type.id]
        return details?.reading_id
      })
      .filter(Boolean) // Filter out undefined reading_ids

    const readingsToDelete = existingReadings.filter((reading) => !readingTypesInState.includes(reading.reading_id))

    // Delete readings that are no longer in our state
    for (const reading of readingsToDelete) {
      await supabase.from("readings").delete().eq("reading_id", reading.reading_id)
    }
  }

  // Clean up any reading addons in the database that are no longer in our state
  const { data: existingReadingAddons } = await supabase
    .from("readings_addon")
    .select("reading_id, activity_id")
    .eq("activity_id", activityId)

  if (existingReadingAddons && existingReadingAddons.length > 0) {
    // Find reading addons that are in the database but not in our state
    const readingAddonTypesInState = updatedTypes
      .filter((type) => type.type === "reading_addon")
      .map((type) => {
        const details = activityTypeDetails[type.id]
        return details?.reading_id
      })
      .filter(Boolean) // Filter out undefined reading_ids

    const readingAddonsToDelete = existingReadingAddons.filter(
      (readingAddon) => !readingAddonTypesInState.includes(readingAddon.reading_id),
    )

    // Delete reading addons that are no longer in our state
    for (const readingAddon of readingAddonsToDelete) {
      await supabase.from("readings_addon").delete().eq("reading_id", readingAddon.reading_id)
    }
  }

  // Clean up any sources in the database that are no longer in our state
  const { data: existingSources } = await supabase
    .from("sources")
    .select("source_id, activity_id")
    .eq("activity_id", activityId)

  if (existingSources && existingSources.length > 0) {
    // Find sources that are in the database but not in our state
    const sourceTypesInState = updatedTypes
      .filter((type) => type.type === "source")
      .map((type) => {
        const details = activityTypeDetails[type.id]
        return details?.source_id
      })
      .filter(Boolean) // Filter out undefined source_ids

    const sourcesToDelete = existingSources.filter((source) => !sourceTypesInState.includes(source.source_id))

    // Delete sources that are no longer in our state
    for (const source of sourcesToDelete) {
      await supabase.from("sources").delete().eq("source_id", source.source_id)
    }
  }

  // Clean up any in-text sources in the database that are no longer in our state
  const { data: existingInTextSources } = await supabase
    .from("in_text_source")
    .select("in_text_source_id, actvity_id")
    .eq("actvity_id", activityId)

  if (existingInTextSources && existingInTextSources.length > 0) {
    // Find in-text sources that are in the database but not in our state
    const inTextSourceTypesInState = updatedTypes
      .filter((type) => type.type === "in_text_source")
      .map((type) => {
        const details = activityTypeDetails[type.id]
        return details?.in_text_source_id
      })
      .filter(Boolean) // Filter out undefined in_text_source_ids

    const inTextSourcesToDelete = existingInTextSources.filter(
      (source) => !inTextSourceTypesInState.includes(source.in_text_source_id),
    )

    // Delete in-text sources that are no longer in our state
    for (const source of inTextSourcesToDelete) {
      await supabase.from("in_text_source").delete().eq("in_text_source_id", source.in_text_source_id)
    }
  }

  // Clean up any questions in the database that are no longer in our state
  const { data: existingQuestions } = await supabase
    .from("questions")
    .select("question_id")
    .eq("activity_id", activityId)

  if (existingQuestions && existingQuestions.length > 0) {
    // Find questions that are in the database but not in our state
    const questionTypesInState = updatedTypes
      .filter((type) => type.type === "question")
      .map((type) => {
        const details = activityTypeDetails[type.id]
        return details?.question_id
      })
      .filter(Boolean) // Filter out undefined question_ids

    const questionsToDelete = existingQuestions.filter(
      (question) => !questionTypesInState.includes(question.question_id),
    )

    // Delete questions that are no longer in our state
    for (const question of questionsToDelete) {
      await supabase.from("questions").delete().eq("question_id", question.question_id)
    }
  }

  // Clean up any graphic organizers in the database that are no longer in our state
  const { data: existingOrganizers } = await supabase
    .from("graphic_organizers")
    .select("go_id")
    .eq("activity_id", activityId)

  if (existingOrganizers && existingOrganizers.length > 0) {
    // Find graphic organizers that are in the database but not in our state
    const organizerTypesInState = updatedTypes
      .filter((type) => type.type === "graphic_organizer")
      .map((type) => {
        const details = activityTypeDetails[type.id]
        return details?.go_id
      })
      .filter(Boolean) // Filter out undefined go_ids

    const organizersToDelete = existingOrganizers.filter(
      (organizer) => !organizerTypesInState.includes(organizer.go_id),
    )

    // Delete graphic organizers that are no longer in our state
    for (const organizer of organizersToDelete) {
      await supabase.from("graphic_organizers").delete().eq("go_id", organizer.go_id)
    }
  }

  // Clean up any images in the database that are no longer in our state
  const { data: existingImages } = await supabase.from("images").select("image_id").eq("activity_id", activityId)

  if (existingImages && existingImages.length > 0) {
    // Find images that are in the database but not in our state
    const imageTypesInState = updatedTypes
      .filter((type) => type.type === "image")
      .map((type) => {
        const details = activityTypeDetails[type.id]
        return details?.image_id
      })
      .filter(Boolean) // Filter out undefined image_ids

    const imagesToDelete = existingImages.filter((image) => !imageTypesInState.includes(image.image_id))

    // Delete images that are no longer in our state
    for (const image of imagesToDelete) {
      await supabase.from("images").delete().eq("image_id", image.image_id)
    }
  }

  // Clean up any sub-readings in the database that are no longer in our state
  const { data: existingSubReadings } = await supabase
    .from("sub_readings")
    .select("reading_id")
    .eq("activity_id", activityId)

  if (existingSubReadings && existingSubReadings.length > 0) {
    // Find sub-readings that are in the database but not in our state
    const subReadingTypesInState = updatedTypes
      .filter((type) => type.type === "sub_reading")
      .map((type) => {
        const details = activityTypeDetails[type.id]
        return details?.reading_id
      })
      .filter(Boolean) // Filter out undefined reading_ids

    const subReadingsToDelete = existingSubReadings.filter(
      (subReading) => !subReadingTypesInState.includes(subReading.reading_id),
    )

    // Delete sub-readings that are no longer in our state
    for (const subReading of subReadingsToDelete) {
      await supabase.from("sub_readings").delete().eq("reading_id", subReading.reading_id)
    }
  }
}
