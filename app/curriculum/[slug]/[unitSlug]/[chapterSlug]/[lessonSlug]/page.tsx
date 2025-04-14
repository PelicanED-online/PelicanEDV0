"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getCurrentUser, supabase } from "@/lib/supabase"
import {
  FileText,
  HelpCircle,
  LayoutGrid,
  BookOpen,
  ImageIcon,
  BookPlus,
  LibraryBig,
  NotepadText,
  BookDown,
} from "lucide-react"
import { generateSlug } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
import QuestionChoicesSaver from "@/components/curriculum/activities/question-choices-saver" // Import the new component

interface Subject {
  subject_id: string
  name: string
}

interface Unit {
  unit_id: string
  name: string
}

interface Chapter {
  chapter_id: string
  name: string
}

interface Lesson {
  lesson_id: string
  chapter_id: string
  lesson_name: string | null
}

interface Activity {
  activity_id: string
  lesson_id: string
  order: number | null
  name: string | null
  published?: string
}

interface ActivityType {
  id: string
  activity_id: string
  type:
    | "reading"
    | "source"
    | "question"
    | "graphic_organizer"
    | "vocabulary"
    | "in_text_source"
    | "image"
    | "reading_addon"
    | "sub_reading"
  order: number
}

interface ActivityTypeDetails {
  activity_id: string
  reading_id?: string
  reaing_text?: string
  order?: number
  published?: string
}

interface Reading {
  activity_id: string
  reading_id: string
  reading_title?: string
  reaing_text?: string
  order?: number
  published?: string
}

interface ReadingAddon {
  activity_id: string
  reading_id?: string
  reaing_text?: string
  order?: number
  published?: string
}

interface Source {
  activity_id: string
  source_id: string
  image_location?: string
  order?: number
  published?: string
  source_image_description?: string
  source_title_ce?: string
  source_title_ad?: string
  source_text?: string
  source_image?: string
}

interface InTextSource {
  activity_id: string
  in_text_source_id?: string
  source_title_ad?: string
  source_title_ce?: string
  source_intro?: string
  source_text?: string
  order?: number
  published?: string
}

// Update the Question interface to include answerOptions
interface Question {
  activity_id: string
  question_id?: string
  order?: number
  published?: string
  question?: string
  question_text?: string
  question_title?: string
  question_type?: string
  answerOptions?: {
    question_choices_id?: string
    choice_text: string
    is_correct: boolean
    order: number
  }[]
  partB?: string
}

interface GraphicOrganizer {
  activity_id: string
  go_id?: string
  content?: any
  order?: number
  template_type?: string
  published?: string
}

interface VocabularyItem {
  id?: string
  word: string
  definition: string
  order?: number
  vocab_order?: number // Add the new vocab_order field
}

interface Vocabulary {
  activity_id: string
  order?: number
  published?: string
  items: VocabularyItem[]
}

interface ImageActivity {
  activity_id: string
  image_id?: string
  img_url?: string
  img_title?: string
  description_title?: string
  description?: string
  alt?: string
  position?: string
  published?: string
  order?: number
}

interface SubReading {
  activity_id: string
  reading_id: string
  reading_title?: string
  reaing_text?: string
  order?: number
  published?: string
}

type ActivityDetails =
  | Reading
  | Source
  | Question
  | GraphicOrganizer
  | Vocabulary
  | InTextSource
  | ImageActivity
  | ReadingAddon
  | SubReading

export default function ActivitiesPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const subjectSlug = params.slug as string
  const unitSlug = params.unitSlug as string
  const chapterSlug = params.chapterSlug as string
  const lessonSlug = params.lessonSlug as string

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activityTypes, setActivityTypes] = useState<Record<string, ActivityType[]>>({})
  const [activityTypeDetails, setActivityTypeDetails] = useState<Record<string, ActivityDetails>>({})

  // Modals
  const [readingModalOpen, setReadingModalOpen] = useState(false)
  const [sourceModalOpen, setSourceModalOpen] = useState(false)
  const [questionModalOpen, setQuestionModalOpen] = useState(false)
  const [graphicOrganizerModalOpen, setGraphicOrganizerModalOpen] = useState(false)
  const [vocabularyModalOpen, setVocabularyModalOpen] = useState(false)
  const [inTextSourceModalOpen, setInTextSourceModalOpen] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [readingAddonModalOpen, setReadingAddonModalOpen] = useState(false)
  const [currentActivityType, setCurrentActivityType] = useState<ActivityType | null>(null)
  const [addActivityDialogOpen, setAddActivityDialogOpen] = useState(false)
  const [newActivityName, setNewActivityName] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null)
  const [activityTypeToDelete, setActivityTypeToDelete] = useState<{ activityId: string; typeId: string } | null>(null)
  const [deleteTypeConfirmOpen, setDeleteTypeConfirmOpen] = useState(false)
  const [editActivityDialogOpen, setEditActivityDialogOpen] = useState(false)
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null)
  const [editActivityName, setEditActivityName] = useState("")
  const [newActivityPublished, setNewActivityPublished] = useState<string>("No")
  const [editActivityPublished, setEditActivityPublished] = useState<string>("No")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [keepDirectionsDialogOpen, setKeepDirectionsDialogOpen] = useState(false)

  const fetchActivities = async (lessonId: string) => {
    try {
      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("activities")
        .select("activity_id, lesson_id, order, name, published")
        .eq("lesson_id", lessonId)
        .order("order", { ascending: true })

      if (activitiesError) throw activitiesError

      setActivities(activitiesData || [])

      // Initialize activity types map
      const typesMap: Record<string, ActivityType[]> = {}
      const detailsMap: Record<string, ActivityDetails> = {}

      // Fetch readings
      const { data: readingsData, error: readingsError } = await supabase
        .from("readings")
        .select("*")
        .in("activity_id", activitiesData.map((a) => a.activity_id) || [])

      if (readingsError) throw readingsError

      // Fetch sources
      const { data: sourcesData, error: sourcesError } = await supabase
        .from("sources")
        .select("*")
        .in("activity_id", activitiesData.map((a) => a.activity_id) || [])

      if (sourcesError) throw sourcesError

      // Fetch in-text sources
      const { data: inTextSourcesData, error: inTextSourcesError } = await supabase
        .from("in_text_source")
        .select("*")
        .in("actvity_id", activitiesData.map((a) => a.activity_id) || [])

      if (inTextSourcesError) throw inTextSourcesError

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .in("activity_id", activitiesData.map((a) => a.activity_id) || [])

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
        .in("activity_id", activitiesData.map((a) => a.activity_id) || [])

      if (organizersError) throw organizersError

      // Fetch vocabulary
      const { data: vocabularyData, error: vocabularyError } = await supabase
        .from("vocabulary")
        .select("*")
        .in("activity_id", activitiesData.map((a) => a.activity_id) || [])

      if (vocabularyError) throw vocabularyError

      // Fetch images
      const { data: imagesData, error: imagesError } = await supabase
        .from("images")
        .select("*")
        .in("activity_id", activitiesData.map((a) => a.activity_id) || [])

      if (imagesError) throw imagesError

      // Add after fetching images
      // Fetch reading addons
      const { data: readingAddonsData, error: readingAddonsError } = await supabase
        .from("readings_addon")
        .select("*")
        .in("activity_id", activitiesData.map((a) => a.activity_id) || [])

      if (readingAddonsError) throw readingAddonsError

      // Fetch sub-readings
      const { data: subReadingsData, error: subReadingsError } = await supabase
        .from("sub_readings")
        .select("*")
        .in("activity_id", activitiesData.map((a) => a.activity_id) || [])

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

      // Process graphic organizers - Updated to use go_id as the unique identifier
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
      const vocabularyByActivity: Record<string, VocabularyItem[]> = {}

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

      // Find the section where we process vocabulary items and create vocabulary activity types
      // Around line 300-350 in the fetchActivities function

      // Replace the code that creates vocabulary activity types with this updated version:

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
        const activity = activitiesData.find((a) => a.activity_id === activityId)

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

      setActivityTypes(typesMap)
      setActivityTypeDetails(detailsMap)

      // Force a router refresh to ensure navigation works
      router.refresh()
    } catch (error) {
      console.error("Error fetching activities:", error)
    }
  }

  useEffect(() => {
    async function loadUserAndData() {
      try {
        setLoading(true)
        // Get current user and check if admin
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push("/login")
          return
        }

        if (currentUser.userInfo?.role !== "admin") {
          // Redirect non-admin users to their dashboard
          router.push(`/dashboard/${currentUser.userInfo?.role || ""}`)
          return
        }

        setUser(currentUser)

        // Fetch subject data by slug
        const { data: subjectsData, error: subjectsError } = await supabase.from("subjects").select("subject_id, name")

        if (subjectsError) {
          console.error("Error fetching subjects:", subjectsError)
          router.push("/curriculum")
          return
        }

        // Find the subject with the matching slug
        const foundSubject = subjectsData.find((subject) => {
          const slug = generateSlug(subject.name)
          return slug === subjectSlug
        })

        if (!foundSubject) {
          console.error("Subject not found with slug:", subjectSlug)
          router.push("/curriculum")
          return
        }

        setSubject(foundSubject)

        // Fetch units for this subject
        const { data: unitsData, error: unitsError } = await supabase
          .from("units")
          .select("unit_id, name")
          .eq("subject_id", foundSubject.subject_id)

        if (unitsError) {
          console.error("Error fetching units:", unitsError)
          router.push(`/curriculum/${subjectSlug}`)
          return
        }

        // Find the unit with the matching slug
        const foundUnit = unitsData.find((unit) => {
          const slug = generateSlug(unit.name)
          return slug === unitSlug
        })

        if (!foundUnit) {
          console.error("Unit not found with slug:", unitSlug)
          router.push(`/curriculum/${subjectSlug}`)
          return
        }

        setUnit(foundUnit)

        // Fetch chapters for this unit
        const { data: chaptersData, error: chaptersError } = await supabase
          .from("chapters")
          .select("chapter_id, name")
          .eq("unit_id", foundUnit.unit_id)

        if (chaptersError) {
          console.error("Error fetching chapters:", chaptersError)
          router.push(`/curriculum/${subjectSlug}/${unitSlug}`)
          return
        }

        // Find the chapter with the matching slug
        const foundChapter = chaptersData.find((chapter) => {
          const slug = generateSlug(chapter.name)
          return slug === chapterSlug
        })

        if (!foundChapter) {
          console.error("Chapter not found with slug:", chapterSlug)
          router.push(`/curriculum/${subjectSlug}/${unitSlug}`)
          return
        }

        setChapter(foundChapter)

        // Fetch lessons for this chapter
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons")
          .select("lesson_id, chapter_id, lesson_name")
          .eq("chapter_id", foundChapter.chapter_id)

        if (lessonsError) {
          console.error("Error fetching lessons:", lessonsError)
          router.push(`/curriculum/${subjectSlug}/${unitSlug}/${chapterSlug}`)
          return
        }

        // Find the lesson with the matching slug
        const foundLesson = lessonsData.find((lesson) => {
          const slug = generateSlug(lesson.lesson_name || "untitled-lesson")
          return slug === lessonSlug
        })

        if (!foundLesson) {
          console.error("Lesson not found with slug:", lessonSlug)
          router.push(`/curriculum/${subjectSlug}/${unitSlug}/${chapterSlug}`)
          return
        }

        setLesson(foundLesson)

        // Fetch activities for this lesson
        await fetchActivities(foundLesson.lesson_id)
        setDataLoaded(true)
      } catch (error) {
        console.error("Error in loadUserAndData:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndData()
  }, [router, subjectSlug, unitSlug, chapterSlug, lessonSlug])

  const handleBack = () => {
    router.push(`/curriculum/${subjectSlug}/${unitSlug}/${chapterSlug}`)
  }

  const handleSaveLesson = async () => {
    if (!lesson) return

    setSaving(true)
    console.log("Starting to save lesson...")

    // If there's a lingering currentActivityType, clear it before saving
    if (currentActivityType) {
      setCurrentActivityType(null)
    }

    try {
     // Recalculate activity orders based on their current position in the array
     const updatedActivities = activities.map((activity, index) => ({
       ...activity,
       order: index + 1, // Ensure order starts at 1 and increments sequentially
     }))

     console.log("Updated activities:", updatedActivities)

     // Update the state with the corrected orders
     setActivities(updatedActivities)

     // Process each activity
     for (const activity of updatedActivities) {
       console.log("Processing activity:", activity.activity_id)

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
           lesson_id: lesson.lesson_id,
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

       // Update the state with the corrected orders
       setActivityTypes({
         ...activityTypes,
         [activity.activity_id]: updatedTypes,
       })

       // Now process each activity type
       for (const activityType of updatedTypes) {
         const details = activityTypeDetails[activityType.id]

         if (!details) continue

         switch (activityType.type) {
           case "reading":
             // Get the reading details
             const readingDetails = details as Reading
             console.log("Processing reading:", readingDetails)

             // Check if this is an update or a new reading
             const { data: existingReading } = await supabase
               .from("readings")
               .select("reading_id")
               .eq("reading_id", readingDetails.reading_id)
               .single()

             if (existingReading) {
               // Update existing reading
               console.log("Updating existing reading:", readingDetails.reading_id)
               const { data: updateResult, error: updateReadingError } = await supabase
                 .from("readings")
                 .update({
                   reading_title: readingDetails.reading_title || null,
                   reaing_text: readingDetails.reaing_text || null,
                   order: activityType.order,
                   published: readingDetails.published || "No",
                 })
                 .eq("reading_id", readingDetails.reading_id)
                 .select()

               if (updateReadingError) {
                 console.error("Error updating reading:", updateReadingError)
                 throw updateReadingError
               }
               console.log("Reading updated successfully:", updateResult)
             } else {
               // Insert as new reading
               console.log(
                 "Inserting new reading with ID:",
                 readingDetails.reading_id,
                 "and activity_id:",
                 activity.activity_id,
               )

               // Ensure we have a valid UUID before inserting
               if (!readingDetails.reading_id || readingDetails.reading_id === "") {
                 // Generate a new UUID if missing or empty
                 readingDetails.reading_id = uuidv4()
                 console.log("Generated new UUID for reading:", readingDetails.reading_id)
               }

               const { data: insertResult, error: insertReadingError } = await supabase
                 .from("readings")
                 .insert({
                   reading_id: readingDetails.reading_id,
                   activity_id: activity.activity_id,
                   reading_title: readingDetails.reading_title || null,
                   reaing_text: readingDetails.reaing_text || null,
                   order: activityType.order,
                   published: readingDetails.published || "No",
                 })
                 .select()

               if (insertReadingError) {
                 console.error("Error inserting reading:", insertReadingError)
                 throw insertReadingError
               }
               console.log("Reading inserted successfully:", insertResult)
             }
             break

           case "reading_addon":
             // Get the reading addon details
             const readingAddonDetails = details as ReadingAddon
             console.log("Processing reading addon:", readingAddonDetails)

             // Check if this is an update or a new reading addon
             const { data: existingReadingAddon } = await supabase
               .from("readings_addon")
               .select("reading_id")
               .eq("reading_id", readingAddonDetails.reading_id)
               .single()

             if (existingReadingAddon) {
               // Update existing reading addon
               console.log("Updating existing reading addon:", readingAddonDetails.reading_id)
               const { data: updateResult, error: updateReadingAddonError } = await supabase
                 .from("readings_addon")
                 .update({
                   reaing_text: readingAddonDetails.reaing_text || null,
                   order: activityType.order,
                   published: readingAddonDetails.published || "No",
                 })
                 .eq("reading_id", readingAddonDetails.reading_id)
                 .select()

               if (updateReadingAddonError) {
                 console.error("Error updating reading addon:", updateReadingAddonError)
                 throw updateReadingAddonError
               }
               console.log("Reading addon updated successfully:", updateResult)
             } else {
               // Insert as new reading addon
               console.log(
                 "Inserting new reading addon with ID:",
                 readingAddonDetails.reading_id,
                 "and activity_id:",
                 activity.activity_id,
               )

               // Ensure we have a valid UUID before inserting
               if (!readingAddonDetails.reading_id || readingAddonDetails.reading_id === "") {
                 // Generate a new UUID if missing or empty
                 readingAddonDetails.reading_id = uuidv4()
                 console.log("Generated new UUID for reading addon:", readingAddonDetails.reading_id)
               }

               const { data: insertResult, error: insertReadingAddonError } = await supabase
                 .from("readings_addon")
                 .insert({
                   reading_id: readingAddonDetails.reading_id,
                   activity_id: activity.activity_id,
                   reaing_text: readingAddonDetails.reaing_text || null,
                   order: activityType.order,
                   published: readingAddonDetails.published || "No",
                 })
                 .select()

               if (insertReadingAddonError) {
                 console.error("Error inserting reading addon:", insertReadingAddonError)
                 throw insertReadingAddonError
               }
               console.log("Reading addon inserted successfully:", insertResult)
             }
             break

           case "sub_reading":
             // Get the sub-reading details
             const subReadingDetails1 = details as SubReading
             console.log("Processing sub-reading:", subReadingDetails1)

             // Check if this is an update or a new sub-reading
             const { data: existingSubReading1 } = await supabase
               .from("sub_readings")
               .select("reading_id")
               .eq("reading_id", subReadingDetails1.reading_id)
               .single()

             if (existingSubReading1) {
               // Update existing sub-reading
               console.log(
                 'Updating existing sub-reading:", subReadingDetails1.reading_id)eading:',
                 subReadingDetails1.reading_id,
               )
               const { data: updateResult, error: updateSubReadingError } = await supabase
                 .from("sub_readings")
                 .update({
                   reading_title: subReadingDetails1.reading_title || null,
                   reaing_text: subReadingDetails1.reaing_text || null,
                   order: activityType.order,
                   published: subReadingDetails1.published || "No",
                 })
                 .eq("reading_id", subReadingDetails1.reading_id)
                 .select()

               if (updateSubReadingError) {
                 console.error("Error updating sub-reading:", updateSubReadingError)
                 throw updateSubReadingError
               }
               console.log("Sub-reading updated successfully:", updateResult)
             } else {
               // Insert as new sub-reading
               console.log(
                 "Inserting new sub-reading with ID:",
                 subReadingDetails1.reading_id,
                 "and activity_id:",
                 activity.activity_id,
               )

               // Ensure we have a valid UUID before inserting
               if (!subReadingDetails1.reading_id || subReadingDetails1.reading_id === "") {
                 // Generate a new UUID if missing or empty
                 subReadingDetails1.reading_id = uuidv4()
                 console.log("Generated new UUID for sub-reading:", subReadingDetails1.reading_id)
               }

               const { data: insertResult, error: insertSubReadingError } = await supabase
                 .from("sub_readings")
                 .insert({
                   reading_id: subReadingDetails1.reading_id,
                   activity_id: activity.activity_id,
                   reading_title: subReadingDetails1.reading_title || null,
                   reaing_text: subReadingDetails1.reaing_text || null,
                   order: activityType.order,
                   published: subReadingDetails1.published || "No",
                 })
                 .select()

               if (insertSubReadingError) {
                 console.error("Error inserting sub-reading:", insertSubReadingError)
                 throw insertSubReadingError
               }
               console.log("Sub-reading inserted successfully:", insertResult)
             }
             break

           case "source":
             // Get the source details
             const sourceDetails = details as Source

             // Check if this is an update or a new source
             const { data: existingSource } = await supabase
               .from("sources")
               .select("source_id")
               .eq("source_id", sourceDetails.source_id)
               .single()

             if (existingSource) {
               // Update existing source
               const { error: updateSourceError } = await supabase
                 .from("sources")
                 .update({
                   source_title_ce: sourceDetails.source_title_ce || null,
                   source_title_ad: sourceDetails.source_title_ad || null,
                   source_text: sourceDetails.source_text || null,
                   source_image: sourceDetails.source_image || null,
                   source_image_description: sourceDetails.source_image_description || null,
                   order: activityType.order,
                   published: sourceDetails.published || "No",
                 })
                 .eq("source_id", sourceDetails.source_id)

               if (updateSourceError) throw updateSourceError
             } else {
               // Insert as new source
               const { error: insertSourceError } = await supabase.from("sources").insert({
                 source_id: sourceDetails.source_id,
                 activity_id: activity.activity_id,
                 source_title_ce: sourceDetails.source_title_ce || null,
                 source_title_ad: sourceDetails.source_title_ad || null,
                 source_text: sourceDetails.source_text || null,
                 source_image: sourceDetails.source_image || null,
                 source_image_description: sourceDetails.source_image_description || null,
                 order: activityType.order,
                 published: sourceDetails.published || "No",
               })

               if (insertSourceError) throw insertSourceError
             }
             break

           case "in_text_source":
             // Get the in-text source details
             const inTextSourceDetails = details as InTextSource

             // Check if this is an update or a new in-text source
             const { data: existingInTextSource } = await supabase
               .from("in_text_source")
               .select("in_text_source_id")
               .eq("in_text_source_id", inTextSourceDetails.in_text_source_id)
               .single()

             if (existingInTextSource) {
               // Update existing in-text source
               const { error: updateInTextSourceError } = await supabase
                 .from("in_text_source")
                 .update({
                   source_title_ce: inTextSourceDetails.source_title_ce || null,
                   source_title_ad: inTextSourceDetails.source_title_ad || null,
                   source_intro: inTextSourceDetails.source_intro || null,
                   source_text: inTextSourceDetails.source_text || null,
                   order: activityType.order,
                   published: inTextSourceDetails.published || "No",
                 })
                 .eq("in_text_source_id", inTextSourceDetails.in_text_source_id)

               if (updateInTextSourceError) throw updateInTextSourceError
             } else {
               // Insert as new in-text source
               const { error: insertInTextSourceError } = await supabase.from("in_text_source").insert({
                 in_text_source_id: inTextSourceDetails.in_text_source_id,
                 actvity_id: activity.activity_id, // Note the typo in the column name
                 source_title_ce: inTextSourceDetails.source_title_ce || null,
                 source_title_ad: inTextSourceDetails.source_title_ad || null,
                 source_intro: inTextSourceDetails.source_intro || null,
                 source_text: inTextSourceDetails.source_text || null,
                 order: activityType.order,
                 published: inTextSourceDetails.published || "No",
               })

               if (insertInTextSourceError) throw insertInTextSourceError
             }
             break

           case "question":
             // Get the question details
             const questionDetails = details as Question
             console.log("Processing question:", questionDetails)

             // Check if this is an update or a new question
             const { data: existingQuestion } = await supabase
               .from("questions")
               .select("question_id")
               .eq("question_id", questionDetails.question_id)
               .single()

             if (existingQuestion) {
               // Update existing question
               console.log("Updating existing question:", questionDetails.question_id)
               const { data: updateResult, error: updateQuestionError } = await supabase
                 .from("questions")
                 .update({
                   question: questionDetails.question || null, // Keep for backward compatibility
                   question_text: questionDetails.question_text || questionDetails.question || null, // Use question_text if available, fall back to question
                   question_title: questionDetails.question_title || null, // Add the new question_title field
                   question_type: questionDetails.question_type || "Open Ended", // Add the new question_type field with default
                   order: activityType.order,
                   published: questionDetails.published || "No",
                 })
                 .eq("question_id", questionDetails.question_id)
                 .select()

               if (updateQuestionError) {
                 console.error("Error updating question:", updateQuestionError)
                 throw updateQuestionError
               }
               console.log("Question updated successfully:", updateResult)

               // If this is a Part A Part B Question, update or create the Part B record
               if (questionDetails.question_type === "Part A Part B Question") {
                 // Check if a Part B record already exists
                 const { data: existingPartB } = await supabase
                   .from("questions_partb")
                   .select("*")
                   .eq("part_a_id", questionDetails.question_id)
                   .single()

                 if (existingPartB) {
                   // Update existing Part B
                   const { error: updatePartBError } = await supabase
                     .from("questions_partb")
                     .update({
                       question_text: questionDetails.partB || null,
                     })
                     .eq("part_a_id", questionDetails.question_id)

                   if (updatePartBError) {
                     console.error("Error updating Part B:", updatePartBError)
                     throw updatePartBError
                   }
                 } else {
                   // Create new Part B record
                   const { error: insertPartBError } = await supabase.from("questions_partb").insert({
                     part_a_id: questionDetails.question_id,
                     question_text: questionDetails.partB || null,
                   })

                   if (insertPartBError) {
                     console.error("Error inserting Part B:", insertPartBError)
                     throw insertPartBError
                   }
                 }
               }

               // Call the new component to save the question choices
               if (questionDetails.answerOptions) {
                 try {
                   await QuestionChoicesSaver({
                     questionId: questionDetails.question_id,
                     answerOptions: questionDetails.answerOptions,
                   })
                 } catch (error) {
                   console.error("Error saving question choices:", error)
                   // Handle the error appropriately, e.g., by setting an error state
                 }
               }
             } else {
               // Insert as new question
               console.log(
                 "Inserting new question with ID:",
                 questionDetails.question_id,
                 "and activity_id:",
                 activity.activity_id,
               )

               // Ensure we have a valid UUID before inserting
               if (!questionDetails.question_id || questionDetails.question_id === "") {
                 // Generate a new UUID if missing or empty
                 questionDetails.question_id = uuidv4()
                 console.log("Generated new UUID for question:", questionDetails.question_id)
               }

               const { data: insertResult, error: insertQuestionError } = await supabase
                 .from("questions")
                 .insert({
                   question_id: questionDetails.question_id,
                   activity_id: activity.activity_id,
                   question: questionDetails.question || null, // Keep for backward compatibility
                   question_text: questionDetails.question_text || questionDetails.question || null, // Use question_text if available, fall back to question
                   question_title: questionDetails.question_title || null, // Add the new question_title field
                   question_type: questionDetails.question_type || "Open Ended", // Add the new question_type field with default
                   order: activityType.order,
                   published: questionDetails.published || "No",
                 })
                 .select()

               if (insertQuestionError) {
                 console.error("Error inserting question:", insertQuestionError)
                 throw insertQuestionError
               }
               console.log("Question inserted successfully:", insertResult)

               // If this is a Part A Part B Question, create the Part B record
               if (questionDetails.question_type === "Part A Part B Question") {
                 const { error: insertPartBError } = await supabase.from("questions_partb").insert({
                   part_a_id: questionDetails.question_id,
                   question_text: questionDetails.partB || null,
                 })

                 if (insertPartBError) {
                   console.error("Error inserting Part B:", insertPartBError)
                   throw insertPartBError
                 }
               }

               // Call the new component to save the question choices
               if (questionDetails.answerOptions) {
                 try {
                   await QuestionChoicesSaver({
                     questionId: questionDetails.question_id,
                     answerOptions: questionDetails.answerOptions,
                   })
                 } catch (error) {
                   console.error("Error saving question choices:", error)
                   // Handle the error appropriately, e.g., by setting an error state
                 }
               }
             }
             break

           case "graphic_organizer":
             // Get the graphic organizer details
             const organizerDetails = details as GraphicOrganizer

             // Check if this is an update or a new graphic organizer
             const { data: existingOrganizer } = await supabase
               .from("graphic_organizers")
               .select("go_id")
               .eq("go_id", organizerDetails.go_id)
               .single()

             if (existingOrganizer) {
               // Update existing graphic organizer
               const { error: updateOrganizerError } = await supabase
                 .from("graphic_organizers")
                 .update({
                   template_type: organizerDetails.template_type || null,
                   content: organizerDetails.content || null,
                   order: activityType.order,
                   published: organizerDetails.published || "No",
                 })
                 .eq("go_id", organizerDetails.go_id)

               if (updateOrganizerError) throw updateOrganizerError
             } else {
               // Insert as new graphic organizer
               const { error: insertOrganizerError } = await supabase.from("graphic_organizers").insert({
                 go_id: organizerDetails.go_id,
                 activity_id: activity.activity_id,
                 template_type: organizerDetails.template_type || null,
                 content: organizerDetails.content || null,
                 order: activityType.order,
                 published: organizerDetails.published || "No",
               })

               if (insertOrganizerError) throw insertOrganizerError
             }
             break

           case "vocabulary":
             // Handle vocabulary with order like other activity types
             // First delete any existing vocabulary items for this activity
             await supabase.from("vocabulary").delete().eq("activity_id", activity.activity_id)

             // Then insert the new vocabulary items
             const vocabularyItems = (details as Vocabulary).items || []

             if (vocabularyItems.length > 0) {
               const vocabularyInserts = vocabularyItems.map((item, index) => ({
                 vocabulary_id: item.id || uuidv4(),
                 activity_id: activity.activity_id,
                 word: item.word || null,
                 definition: item.definition || null,
                 order: activityType.order, // Use activityType.order for the activity order
                 vocab_order: item.vocab_order !== undefined ? item.vocab_order : index, // Use vocab_order or index as fallback
               }))

               const { error: vocabularyError } = await supabase.from("vocabulary").insert(vocabularyInserts)

               if (vocabularyError) throw vocabularyError
             }
             break

           case "image":
             // Get the image details
             const imageDetails = details as ImageActivity

             // Check if this is an update or a new image
             const { data: existingImage } = await supabase
               .from("images")
               .select("image_id")
               .eq("image_id", imageDetails.image_id)
               .single()

             if (existingImage) {
               // Update existing image
               const { error: updateImageError } = await supabase
                 .from("images")
                 .update({
                   img_url: imageDetails.img_url || null,
                   img_title: imageDetails.img_title || null,
                   description_title: imageDetails.description_title || null,
                   description: imageDetails.description || null,
                   alt: imageDetails.alt || null,
                   position: imageDetails.position || "center",
                   order: activityType.order,
                   published: imageDetails.published || "No",
                 })
                 .eq("image_id", imageDetails.image_id)

               if (updateImageError) throw updateImageError
             } else {
               // Insert as new image
               const { error: insertImageError } = await supabase.from("images").insert({
                 image_id: imageDetails.image_id,
                 activity_id: activity.activity_id,
                 img_url: imageDetails.img_url || null,
                 img_title: imageDetails.img_title || null,
                 description_title: imageDetails.description_title || null,
                 description: imageDetails.description || null,
                 alt: imageDetails.alt || null,
                 position: activityType.order,
                 published: imageDetails.published || "No",
               })

               if (insertImageError) throw insertImageError
             }
             break
         }
       }

       // Clean up any sections in the database that are no longer in our state
       const { data: allSections } = await supabase
         .from("lp_sections")
         .select("lp_sections_id")
         .eq("lessone_plan_id", lessonPlan.lesson_plan_id)

       if (allSections) {
         const currentSectionIds = updatedSections.map((s) => s.lp_sections_id)
         const sectionsToDelete = allSections.filter((s) => !currentSectionIds.includes(s.lp_sections_id))

         for (const sectionToDelete of sectionsToDelete) {
           // Delete all directions for this section first
           await supabase.from("lp_directions").delete().eq("lp_sections_id", sectionToDelete.lp_sections_id)

           // Then delete the section
           await supabase.from("lp_sections").delete().eq("lp_sections_id", sectionToDelete.lp_sections_id)
         }
       }

       toast({
         title: "Success",
         description: "Lesson plan sections and directions saved successfully.",
       })

       // Refresh sections and mark all directions as not new anymore
       await fetchSections(lessonPlan.lesson_plan_id)\
     } catch (error: any) 
       console.error("Error saving lesson plan sections:", error)
       toast(
         title: "Error",
         description: error.message || "Failed to save lesson plan sections",
         variant: "destructive",)finally 
       setSaving(false)
   }

    const getActivityTypeIcon = (type: ActivityType["type"]) => {
      switch (type) {
        case "reading":
          return <FileText className="h-4 w-4" />
        case "reading_addon":
          return <BookPlus className="h-4 w-4" />
        case "source":
          return <LibraryBig className="h-4 w-4" />
        case "in_text_source":
          return <NotepadText className="h-4 w-4" />
        case "question":
          return <HelpCircle className="h-4 w-4" />
        case "graphic_organizer":
          return <LayoutGrid className="h-4 w-4" />
        case "vocabulary":
          return <BookOpen className="h-4 w-4" />
        case "image":
          return <ImageIcon className="h-4 w-4" />
        case "sub_reading":
          return <BookDown className="h-4 w-4" />
      }
    }

    const getActivityTypePreview = (activityType: ActivityType) => {
      const details = activityTypeDetails[activityType.id]
      if (!details) return "No content yet"

      switch (activityType.type) {
        case "reading":
          return (details as Reading).reading_title || "Untitled Reading"
        case "reading_addon":
          const addonText = (details as ReadingAddon).reaing_text
          return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
        case "source":
          return (details as Source).source_title_ce || "Untitled Source"
        case "in_text_source":
          return (details as InTextSource).source_title_ce || "Untitled In-Text Source"
        case "question":
          // Use question_title if available, otherwise fall back to question text
          const questionDetails = details as Question
          if (questionDetails.question_title) {
            return questionDetails.question_title
          }
          // Fallback to question text for backward compatibility
          const question = questionDetails.question || questionDetails.question_text
          return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
        case "graphic_organizer":
          return (details as GraphicOrganizer).template_type || "Untitled Organizer"
        case "vocabulary":
          const vocabItems = (details as Vocabulary).items || []
          return vocabItems.length > 0
            ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
            : "Vocabulary (empty)"
        case "image":
          return (details as ImageActivity).img_title || "Untitled Image"
        case "sub_reading":
          return (details as SubReading).reading_title || "Untitled Sub-Reading"
      }
    }

    // Add a function to handle opening the edit activity dialog:
    const handleEditActivity = (activity: Activity) => {
      setActivityToEdit(activity)
      setEditActivityName(activity.name || "")
      setEditActivityPublished(activity.published || "No")
      setEditActivityDialogOpen(true)
    }

    // Add a function to handle saving the edited activity name:
    const handleSaveActivityName = () => {
      if (!activityToEdit) return

      // Update the activity name in the state
      setActivities(
        activities.map((activity) =>
          activity.activity_id === activityToEdit.activity_id
            ? { ...activity, name: editActivityName, published: editActivityPublished }
            : activity,
        ),
      )

      // Close the dialog
      setEditActivityDialogOpen(false)
      setActivityToEdit(null)
    }

    // Add a function to handle opening the edit activity type dialog:
    const handleEditActivityType = (activityType: ActivityType) => {
      switch (activityType.type) {
        case "reading":
          setReadingModalOpen(true)
          setCurrentActivityType(activityType)
          break
        case "reading_addon":
          setReadingAddonModalOpen(true)
          setCurrentActivityType(activityType)
          break
        case "source":
          setSourceModalOpen(true)
          setCurrentActivityType(activityType)
          break
        case "in_text_source":
          setInTextSourceModalOpen(true)
          setCurrentActivityType(activityType)
          break
        case "question":
          setQuestionModalOpen(true)
          setCurrentActivityType(activityType)
          break
        case "graphic_organizer":
          setGraphicOrganizerModalOpen(true)
          setCurrentActivityType(activityType)
          break
        case "vocabulary":
          setVocabularyModalOpen(true)
          setCurrentActivityType(activityType)
          break
        case "image":
          setImageModalOpen(true)
          setCurrentActivityType(activityType)
          break
        case "sub_reading":
          setReadingModalOpen(true)
          setCurrentActivityType(activityType)
          break
      }
    }

    const handleDeleteActivity = (activity: Activity) => {
      setActivityToDelete(activity)

      // Check if this activity has any associated directions
      const checkForDirections = async () => {
        const { data, error } = await supabase
          .from("lp_directions")
          .select("lp_directions_id")
          .eq("activity_id", activity.activity_id)
          .limit(1)

        if (error) {
          console.error("Error checking for directions:", error)
          setDeleteConfirmOpen(true) // Default to regular delete if check fails
          return
        }

        if (data && data.length > 0) {
          // Activity has directions, ask user what to do
          setKeepDirectionsDialogOpen(true)
        } else {
          // No directions, proceed with regular delete confirmation
          setDeleteConfirmOpen(true)
        }
      }

      checkForDirections()
    }

    // Handle keeping directions but removing activity reference
    const handleKeepDirections = async () => {
      if (!activityToDelete) return

      setSaving(true)

      try {
        // Update directions to remove activity_id reference
        const { error } = await supabase
          .from("lp_directions")
          .update({ activity_id: null })
          .eq("activity_id", activityToDelete.activity_id)

        if (error) throw error

        // Continue with regular activity deletion
        await deleteActivity(false)

        toast({
          title: "Success",
          description: "Activity deleted and directions preserved",
        })
      } catch (error: any) {
        console.error("Error updating directions:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to update directions",
          variant: "destructive",
        })
      } finally {
        setKeepDirectionsDialogOpen(false)
        setActivityToDelete(null)
        setSaving(false)
      }
    }

    // Handle deleting both activity and directions
    const handleDeleteDirections = async () => {
      if (!activityToDelete) return

      setSaving(true)

      try {
        // Delete directions first, then activity
        await deleteActivity(true)

        toast({
          title: "Success",
          description: "Activity and associated directions deleted",
        })
      } catch (error: any) {
        console.error("Error deleting activity and directions:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to delete activity and directions",
          variant: "destructive",
        })
      } finally {
        setKeepDirectionsDialogOpen(false)
        setActivityToDelete(null)
        setSaving(false)
      }
    }

    // Update the confirmDeleteActivity function to delete from the database
    const confirmDeleteActivity = async () => {
      if (!activityToDelete) return

      setSaving(true)

      try {
        // Use the common delete function
        await deleteActivity(true)

        toast({
          title: "Success",
          description: "Activity deleted successfully",
        })
      } catch (error: any) {
        console.error("Error deleting activity:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to delete activity",
          variant: "destructive",
        })
      } finally {
        setDeleteConfirmOpen(false)
        setActivityToDelete(null)
        setSaving(false)
      }
    }

    // Common function for deleting an activity
    const deleteActivity = async (deleteDirections: boolean) => {
      if (!activityToDelete) return

      // If deleteDirections is true, delete the related directions
      if (deleteDirections) {
        await supabase.from("lp_directions").delete().eq("activity_id", activityToDelete.activity_id)
      }

      // Delete all associated activity types
      const types = activityTypes[activityToDelete.activity_id] || []

      for (const activityType of types) {
        switch (activityType.type) {
          case "reading":
            await supabase.from("readings").delete().eq("activity_id", activityToDelete.activity_id)
            break
          case "reading_addon":
            await supabase.from("readings_addon").delete().eq("activity_id", activityToDelete.activity_id)
            break
          case "source":
            await supabase.from("sources").delete().eq("activity_id", activityToDelete.activity_id)
            break
          case "in_text_source":
            await supabase.from("in_text_source").delete().eq("actvity_id", activityToDelete.activity_id)
            break
          case "question":
            await supabase.from("questions").delete().eq("activity_id", activityToDelete.activity_id)
            break
          case "graphic_organizer":
            await supabase.from("graphic_organizers").delete().eq("activity_id", activityToDelete.activity_id)
            break
          case "vocabulary":
            await supabase.from("vocabulary").delete().eq("activity_id", activityToDelete.activity_id)
            break
          case "image":
            await supabase.from("images").delete().eq("activity_id", activityToDelete.activity_id)
            break
          case "sub_reading":
            await supabase.from("sub_readings").delete().eq("activity_id", activityToDelete.activity_id)
            break
        }
      }

      // Delete the activity itself
      const { error } = await supabase.from("activities").delete().eq("activity_id", activityToDelete.activity_id)

      if (error) throw error

      // Remove from state
      const updatedActivities = activities.filter((a) => a.activity_id !== activityToDelete.activity_id)

      // Recalculate order for remaining activities
      const reorderedActivities = updatedActivities.map((activity, index) => ({
        ...activity,
        order: index + 1,
      }))

      setActivities(reorderedActivities)

      // Remove associated activity types
      const updatedActivityTypes = { ...activityTypes }
      delete updatedActivityTypes[activityToDelete.activity_id]
      setActivityTypes(updatedActivityTypes)
    }

    const getActivityTypeIcon = (type: ActivityType["type"]) => {
      switch (type) {
        case "reading":
          return <FileText className="h-4 w-4" />
        case "reading_addon":
          return <BookPlus className="h-4 w-4" />
        case "source":
          return <LibraryBig className="h-4 w-4" />
        case "in_text_source":
          return <NotepadText className="h-4 w-4" />
        case "question":
          return <HelpCircle className="h-4 w-4" />
        case "graphic_organizer":
          return <LayoutGrid className="h-4 w-4" />
        case "vocabulary":
          return <BookOpen className="h-4 w-4" />
        case "image":
          return <ImageIcon className="h-4 w-4" />
        case "sub_reading":
          return <BookDown className="h-4 w-4" />
      }
    }

    const getActivityTypePreview = (type: ActivityType["type"]) => {
      const details = activityTypeDetails[activityType.id]
      if (!details) return "No content yet"

      switch (type) {
        case "reading":
          return (details as Reading).reading_title || "Untitled Reading"
        case "reading_addon":
          const addonText = (details as ReadingAddon).reaing_text
          return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
        case "source":
          return (details as Source).source_title_ce || "Untitled Source"
        case "in_text_source":
          return (details as InTextSource).source_title_ce || "Untitled In-Text Source"
        case "question":
          // Use question_title if available, otherwise fall back to question text
          const questionDetails = details as Question
          if (questionDetails.question_title) {
            return questionDetails.question_title
          }
          // Fallback to question text for backward compatibility
          const question = questionDetails.question || questionDetails.question_text
          return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
        case "graphic_organizer":
          return (details as GraphicOrganizer).template_type || "Untitled Organizer"
        case "vocabulary":
          const vocabItems = (details as Vocabulary).items || []
          return vocabItems.length > 0
            ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
            : "Vocabulary (empty)"
        case "image":
          return (details as ImageActivity).img_title || "Untitled Image"
        case "sub_reading":
          return (details as SubReading).reading_title || "Untitled Sub-Reading"
      }
    }

    // Add a function to handle opening the edit activity dialog:
    const handleEditActivity = (activity: Activity) => {
      setActivityToEdit(activity)
      setEditActivityName(activity.name || "")
      setEditActivityPublished(activity.published || "No")
      setEditActivityDialogOpen(true)
    }

    // Add a function to handle saving the edited activity name:
    setActivities(
      activities.map((activity) =>
        activity.activity_id === activityToEdit.activity_id
          ? { ...activity, name: editActivityName, published: editActivityPublished }
          : activity,
      ),
    )

    // Close the dialog
    setEditActivityDialogOpen(false)
    setActivityToEdit(null)
  }

  // Add a function to handle opening the edit activity type dialog:
  const handleEditActivityType = (activityType: ActivityType) => {
    switch (activityType.type) {
      case "reading":
        setReadingModalOpen(true)
        setCurrentActivityType(activityType)
        break
      case "reading_addon":
        setReadingAddonModalOpen(true)
        setCurrentActivityType(activityType)
        break
      case "source":
        setSourceModalOpen(true)
        setCurrentActivityType(activityType)
        break
      case "in_text_source":
        setInTextSourceModalOpen(true)
        setCurrentActivityType(activityType)
        break
      case "question":
        setQuestionModalOpen(true)
        setCurrentActivityType(activityType)
        break
      case "graphic_organizer":
        setGraphicOrganizerModalOpen(true)
        setCurrentActivityType(activityType)
        break
      case "vocabulary":
        setVocabularyModalOpen(true)
        setCurrentActivityType(activityType)
        break
      case "image":
        setImageModalOpen(true)
        setCurrentActivityType(activityType)
        break
      case "sub_reading":
        setReadingModalOpen(true)
        setCurrentActivityType(activityType)
        break
    }
  }

  const handleDeleteActivity = (activity: Activity) => {
    setActivityToDelete(activity)

    // Check if this activity has any associated directions
    const checkForDirections = async () => {
      const { data, error } = await supabase
        .from("lp_directions")
        .select("lp_directions_id")
        .eq("activity_id", activity.activity_id)
        .limit(1)

      if (error) {
        console.error("Error checking for directions:", error)
        setDeleteConfirmOpen(true) // Default to regular delete if check fails
        return
      }

      if (data && data.length > 0) {
        // Activity has directions, ask user what to do
        setKeepDirectionsDialogOpen(true)
      } else {
        // No directions, proceed with regular delete confirmation
        setDeleteConfirmOpen(true)
      }
    }

    checkForDirections()
  }

  // Handle keeping directions but removing activity reference
  const handleKeepDirections = async () => {
    if (!activityToDelete) return

    setSaving(true)

    try {
      // Update directions to remove activity_id reference
      const { error } = await supabase
        .from("lp_directions")
        .update({ activity_id: null })
        .eq("activity_id", activityToDelete.activity_id)

      if (error) throw error

      // Continue with regular activity deletion
      await deleteActivity(false)

      toast({
        title: "Success",
        description: "Activity deleted and directions preserved",
      })
    } catch (error: any) {
      console.error("Error updating directions:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update directions",
        variant: "destructive",
      })
    } finally {
      setKeepDirectionsDialogOpen(false)
      setActivityToDelete(null)
      setSaving(false)
    }
  }

  // Handle deleting both activity and directions
  const handleDeleteDirections = async () => {
    if (!activityToDelete) return

    setSaving(true)

    try {
      // Delete directions first, then activity
      await deleteActivity(true)

      toast({
        title: "Success",
        description: "Activity and associated directions deleted",
      })
    } catch (error: any) {
      console.error("Error deleting activity and directions:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete activity and directions",
        variant: "destructive",
      })
    } finally {
      setKeepDirectionsDialogOpen(false)
      setActivityToDelete(null)
      setSaving(false)
    }
  }

  // Update the confirmDeleteActivity function to delete from the database
  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return

    setSaving(true)

    try {
      // Use the common delete function
      await deleteActivity(true)

      toast({
        title: "Success",
        description: "Activity deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting activity:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete activity",
        variant: "destructive",
      })
    } finally {
      setDeleteConfirmOpen(false)
      setActivityToDelete(null)
      setSaving(false)
    }
  }

  // Common function for deleting an activity
  const deleteActivity = async (deleteDirections: boolean) => {
    if (!activityToDelete) return

    // If deleteDirections is true, delete the related directions
    if (deleteDirections) {
      await supabase.from("lp_directions").delete().eq("activity_id", activityToDelete.activity_id)
    }

    // Delete all associated activity types
    const types = activityTypes[activityToDelete.activity_id] || []

    for (const activityType of types) {
      switch (activityType.type) {
        case "reading":
          await supabase.from("readings").delete().eq("activity_id", activityToDelete.activity_id)
          break
        case "reading_addon":
          await supabase.from("readings_addon").delete().eq("activity_id", activityToDelete.activity_id)
          break
        case "source":
          await supabase.from("sources").delete().eq("activity_id", activityToDelete.activity_id)
          break
        case "in_text_source":
          await supabase.from("in_text_source").delete().eq("actvity_id", activityToDelete.activity_id)
          break
        case "question":
          await supabase.from("questions").delete().eq("activity_id", activityToDelete.activity_id)
          break
        case "graphic_organizer":
          await supabase.from("graphic_organizers").delete().eq("activity_id", activityToDelete.activity_id)
          break
        case "vocabulary":
          await supabase.from("vocabulary").delete().eq("activity_id", activityToDelete.activity_id)
          break
        case "image":
          await supabase.from("images").delete().eq("activity_id", activityToDelete.activity_id)
          break
        case "sub_reading":
          await supabase.from("sub_readings").delete().eq("activity_id", activityToDelete.activity_id)
          break
      }
    }

    // Delete the activity itself
    const { error } = await supabase.from("activities").delete().eq("activity_id", activityToDelete.activity_id)

    if (error) throw error

    // Remove from state
    const updatedActivities = activities.filter((a) => a.activity_id !== activityToDelete.activity_id)

    // Recalculate order for remaining activities
    const reorderedActivities = updatedActivities.map((activity, index) => ({
      ...activity,
      order: index + 1,
    }))

    setActivities(reorderedActivities)

    // Remove associated activity types
    const updatedActivityTypes = { ...activityTypes }
    delete updatedActivityTypes[activityToDelete.activity_id]
    setActivityTypes(updatedActivityTypes)
  }

  const getActivityTypeIcon = (type: ActivityType["type"]) => {
    switch (type) {
      case "reading":
        return <FileText className="h-4 w-4" />
      case "reading_addon":
        return <BookPlus className="h-4 w-4" />
      case "source":
        return <LibraryBig className="h-4 w-4" />
      case "in_text_source":
        return <NotepadText className="h-4 w-4" />
      case "question":
        return <HelpCircle className="h-4 w-4" />
      case "graphic_organizer":
        return <LayoutGrid className="h-4 w-4" />
      case "vocabulary":
        return <BookOpen className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "sub_reading":
        return <BookDown className="h-4 w-4" />
    }
  }

  const getActivityTypePreview = (type: ActivityType["type"]) => {
    const details = activityTypeDetails[activityType.id]
    if (!details) return "No content yet"

    switch (type) {
      case "reading":
        return (details as Reading).reading_title || "Untitled Reading"
      case "reading_addon":
        const addonText = (details as ReadingAddon).reaing_text
        return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
      case "source":
        return (details as Source).source_title_ce || "Untitled Source"
      case "in_text_source":
        return (details as InTextSource).source_title_ce || "Untitled In-Text Source"
      case "question":
        // Use question_title if available, otherwise fall back to question text
        const questionDetails = details as Question
        if (questionDetails.question_title) {
          return questionDetails.question_title
        }
        // Fallback to question text for backward compatibility
        const question = questionDetails.question || questionDetails.question_text
        return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
      case "graphic_organizer":
        return (details as GraphicOrganizer).template_type || "Untitled Organizer"
      case "vocabulary":
        const vocabItems = (details as Vocabulary).items || []
        return vocabItems.length > 0
          ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
          : "Vocabulary (empty)"
      case "image":
        return (details as ImageActivity).img_title || "Untitled Image"
      case "sub_reading":
        return (details as SubReading).reading_title || "Untitled Sub-Reading"
    }
  }

  // Add a function to handle opening the edit activity dialog:
  const handleEditActivity = (activity: Activity) => {
    setActivityToEdit(activity)
    setEditActivityName(activity.name || "")
    setEditActivityPublished(activity.published || "No")
    setEditActivityDialogOpen(true)
  }

  // Add a function to handle saving the edited activity name:
  setActivities(
    activities.map((activity) =>
      activity.activity_id === activityToEdit.activity_id
        ? { ...activity, name: editActivityName, published: editActivityPublished }
        : activity,
    ),
  )

  // Close the dialog
  setEditActivityDialogOpen(false)
  setActivityToEdit(null)
}

// Add a function to handle opening the edit activity type dialog:
const handleEditActivityType = (activityType: ActivityType) => {
  switch (activityType.type) {
    case "reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "reading_addon":
      setReadingAddonModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "source":
      setSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "in_text_source":
      setInTextSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "question":
      setQuestionModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "graphic_organizer":
      setGraphicOrganizerModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "vocabulary":
      setVocabularyModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "image":
      setImageModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "sub_reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
  }
}

const handleDeleteActivity = (activity: Activity) => {
  setActivityToDelete(activity)

  // Check if this activity has any associated directions
  const checkForDirections = async () => {
    const { data, error } = await supabase
      .from("lp_directions")
      .select("lp_directions_id")
      .eq("activity_id", activity.activity_id)
      .limit(1)

    if (error) {
      console.error("Error checking for directions:", error)
      setDeleteConfirmOpen(true) // Default to regular delete if check fails
      return
    }

    if (data && data.length > 0) {
      // Activity has directions, ask user what to do
      setKeepDirectionsDialogOpen(true)
    } else {
      // No directions, proceed with regular delete confirmation
      setDeleteConfirmOpen(true)
    }
  }

  checkForDirections()
}

// Handle keeping directions but removing activity reference
const handleKeepDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Update directions to remove activity_id reference
    const { error } = await supabase
      .from("lp_directions")
      .update({ activity_id: null })
      .eq("activity_id", activityToDelete.activity_id)

    if (error) throw error

    // Continue with regular activity deletion
    await deleteActivity(false)

    toast({
      title: "Success",
      description: "Activity deleted and directions preserved",
    })
  } catch (error: any) {
    console.error("Error updating directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Handle deleting both activity and directions
const handleDeleteDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Delete directions first, then activity
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity and associated directions deleted",
    })
  } catch (error: any) {
    console.error("Error deleting activity and directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity and directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Update the confirmDeleteActivity function to delete from the database
const confirmDeleteActivity = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Use the common delete function
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting activity:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity",
      variant: "destructive",
    })
  } finally {
    setDeleteConfirmOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Common function for deleting an activity
const deleteActivity = async (deleteDirections: boolean) => {
  if (!activityToDelete) return

  // If deleteDirections is true, delete the related directions
  if (deleteDirections) {
    await supabase.from("lp_directions").delete().eq("activity_id", activityToDelete.activity_id)
  }

  // Delete all associated activity types
  const types = activityTypes[activityToDelete.activity_id] || []

  for (const activityType of types) {
    switch (activityType.type) {
      case "reading":
        await supabase.from("readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "reading_addon":
        await supabase.from("readings_addon").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "source":
        await supabase.from("sources").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "in_text_source":
        await supabase.from("in_text_source").delete().eq("actvity_id", activityToDelete.activity_id)
        break
      case "question":
        await supabase.from("questions").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "graphic_organizer":
        await supabase.from("graphic_organizers").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "vocabulary":
        await supabase.from("vocabulary").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "image":
        await supabase.from("images").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "sub_reading":
        await supabase.from("sub_readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
    }
  }

  // Delete the activity itself
  const { error } = await supabase.from("activities").delete().eq("activity_id", activityToDelete.activity_id)

  if (error) throw error

  // Remove from state
  const updatedActivities = activities.filter((a) => a.activity_id !== activityToDelete.activity_id)

  // Recalculate order for remaining activities
  const reorderedActivities = updatedActivities.map((activity, index) => ({
    ...activity,
    order: index + 1,
  }))

  setActivities(reorderedActivities)

  // Remove associated activity types
  const updatedActivityTypes = { ...activityTypes }
  delete updatedActivityTypes[activityToDelete.activity_id]
  setActivityTypes(updatedActivityTypes)
}

const getActivityTypeIcon = (type: ActivityType["type"]) => {
  switch (type) {
    case "reading":
      return <FileText className="h-4 w-4" />
    case "reading_addon":
      return <BookPlus className="h-4 w-4" />
    case "source":
      return <LibraryBig className="h-4 w-4" />
    case "in_text_source":
      return <NotepadText className="h-4 w-4" />
    case "question":
      return <HelpCircle className="h-4 w-4" />
    case "graphic_organizer":
      return <LayoutGrid className="h-4 w-4" />
    case "vocabulary":
      return <BookOpen className="h-4 w-4" />
    case "image":
      return <ImageIcon className="h-4 w-4" />
    case "sub_reading":
      return <BookDown className="h-4 w-4" />
  }
}

const getActivityTypePreview = (type: ActivityType["type"]) => {
  const details = activityTypeDetails[activityType.id]
  if (!details) return "No content yet"

  switch (type) {
    case "reading":
      return (details as Reading).reading_title || "Untitled Reading"
    case "reading_addon":
      const addonText = (details as ReadingAddon).reaing_text
      return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
    case "source":
      return (details as Source).source_title_ce || "Untitled Source"
    case "in_text_source":
      return (details as InTextSource).source_title_ce || "Untitled In-Text Source"
    case "question":
      // Use question_title if available, otherwise fall back to question text
      const questionDetails = details as Question
      if (questionDetails.question_title) {
        return questionDetails.question_title
      }
      // Fallback to question text for backward compatibility
      const question = questionDetails.question || questionDetails.question_text
      return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
    case "graphic_organizer":
      return (details as GraphicOrganizer).template_type || "Untitled Organizer"
    case "vocabulary":
      const vocabItems = (details as Vocabulary).items || []
      return vocabItems.length > 0
        ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
        : "Vocabulary (empty)"
    case "image":
      return (details as ImageActivity).img_title || "Untitled Image"
    case "sub_reading":
      return (details as SubReading).reading_title || "Untitled Sub-Reading"
  }
}

// Add a function to handle opening the edit activity dialog:
const handleEditActivity = (activity: Activity) => {
  setActivityToEdit(activity)
  setEditActivityName(activity.name || "")
  setEditActivityPublished(activity.published || "No")
  setEditActivityDialogOpen(true)
}

// Add a function to handle saving the edited activity name:
setActivities(
  activities.map((activity) =>
    activity.activity_id === activityToEdit.activity_id
      ? { ...activity, name: editActivityName, published: editActivityPublished }
      : activity,
  ),
)

// Close the dialog
setEditActivityDialogOpen(false)
setActivityToEdit(null)
}

// Add a function to handle opening the edit activity type dialog:
const handleEditActivityType = (activityType: ActivityType) => {
  switch (activityType.type) {
    case "reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "reading_addon":
      setReadingAddonModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "source":
      setSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "in_text_source":
      setInTextSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "question":
      setQuestionModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "graphic_organizer":
      setGraphicOrganizerModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "vocabulary":
      setVocabularyModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "image":
      setImageModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "sub_reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
  }
}

const handleDeleteActivity = (activity: Activity) => {
  setActivityToDelete(activity)

  // Check if this activity has any associated directions
  const checkForDirections = async () => {
    const { data, error } = await supabase
      .from("lp_directions")
      .select("lp_directions_id")
      .eq("activity_id", activity.activity_id)
      .limit(1)

    if (error) {
      console.error("Error checking for directions:", error)
      setDeleteConfirmOpen(true) // Default to regular delete if check fails
      return
    }

    if (data && data.length > 0) {
      // Activity has directions, ask user what to do
      setKeepDirectionsDialogOpen(true)
    } else {
      // No directions, proceed with regular delete confirmation
      setDeleteConfirmOpen(true)
    }
  }

  checkForDirections()
}

// Handle keeping directions but removing activity reference
const handleKeepDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Update directions to remove activity_id reference
    const { error } = await supabase
      .from("lp_directions")
      .update({ activity_id: null })
      .eq("activity_id", activityToDelete.activity_id)

    if (error) throw error

    // Continue with regular activity deletion
    await deleteActivity(false)

    toast({
      title: "Success",
      description: "Activity deleted and directions preserved",
    })
  } catch (error: any) {
    console.error("Error updating directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Handle deleting both activity and directions
const handleDeleteDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Delete directions first, then activity
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity and associated directions deleted",
    })
  } catch (error: any) {
    console.error("Error deleting activity and directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity and directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Update the confirmDeleteActivity function to delete from the database
const confirmDeleteActivity = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Use the common delete function
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting activity:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity",
      variant: "destructive",
    })
  } finally {
    setDeleteConfirmOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Common function for deleting an activity
const deleteActivity = async (deleteDirections: boolean) => {
  if (!activityToDelete) return

  // If deleteDirections is true, delete the related directions
  if (deleteDirections) {
    await supabase.from("lp_directions").delete().eq("activity_id", activityToDelete.activity_id)
  }

  // Delete all associated activity types
  const types = activityTypes[activityToDelete.activity_id] || []

  for (const activityType of types) {
    switch (activityType.type) {
      case "reading":
        await supabase.from("readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "reading_addon":
        await supabase.from("readings_addon").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "source":
        await supabase.from("sources").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "in_text_source":
        await supabase.from("in_text_source").delete().eq("actvity_id", activityToDelete.activity_id)
        break
      case "question":
        await supabase.from("questions").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "graphic_organizer":
        await supabase.from("graphic_organizers").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "vocabulary":
        await supabase.from("vocabulary").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "image":
        await supabase.from("images").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "sub_reading":
        await supabase.from("sub_readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
    }
  }

  // Delete the activity itself
  const { error } = await supabase.from("activities").delete().eq("activity_id", activityToDelete.activity_id)

  if (error) throw error

  // Remove from state
  const updatedActivities = activities.filter((a) => a.activity_id !== activityToDelete.activity_id)

  // Recalculate order for remaining activities
  const reorderedActivities = updatedActivities.map((activity, index) => ({
    ...activity,
    order: index + 1,
  }))

  setActivities(reorderedActivities)

  // Remove associated activity types
  const updatedActivityTypes = { ...activityTypes }
  delete updatedActivityTypes[activityToDelete.activity_id]
  setActivityTypes(updatedActivityTypes)
}

const getActivityTypeIcon = (type: ActivityType["type"]) => {
  switch (type) {
    case "reading":
      return <FileText className="h-4 w-4" />
    case "reading_addon":
      return <BookPlus className="h-4 w-4" />
    case "source":
      return <LibraryBig className="h-4 w-4" />
    case "in_text_source":
      return <NotepadText className="h-4 w-4" />
    case "question":
      return <HelpCircle className="h-4 w-4" />
    case "graphic_organizer":
      return <LayoutGrid className="h-4 w-4" />
    case "vocabulary":
      return <BookOpen className="h-4 w-4" />
    case "image":
      return <ImageIcon className="h-4 w-4" />
    case "sub_reading":
      return <BookDown className="h-4 w-4" />
  }
}

const getActivityTypePreview = (type: ActivityType["type"]) => {
  const details = activityTypeDetails[activityType.id]
  if (!details) return "No content yet"

  switch (type) {
    case "reading":
      return (details as Reading).reading_title || "Untitled Reading"
    case "reading_addon":
      const addonText = (details as ReadingAddon).reaing_text
      return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
    case "source":
      return (details as Source).source_title_ce || "Untitled Source"
    case "in_text_source":
      return (details as InTextSource).source_title_ce || "Untitled In-Text Source"
    case "question":
      // Use question_title if available, otherwise fall back to question text
      const questionDetails = details as Question
      if (questionDetails.question_title) {
        return questionDetails.question_title
      }
      // Fallback to question text for backward compatibility
      const question = questionDetails.question || questionDetails.question_text
      return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
    case "graphic_organizer":
      return (details as GraphicOrganizer).template_type || "Untitled Organizer"
    case "vocabulary":
      const vocabItems = (details as Vocabulary).items || []
      return vocabItems.length > 0
        ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
        : "Vocabulary (empty)"
    case "image":
      return (details as ImageActivity).img_title || "Untitled Image"
    case "sub_reading":
      return (details as SubReading).reading_title || "Untitled Sub-Reading"
  }
}

// Add a function to handle opening the edit activity dialog:
const handleEditActivity = (activity: Activity) => {
  setActivityToEdit(activity)
  setEditActivityName(activity.name || "")
  setEditActivityPublished(activity.published || "No")
  setEditActivityDialogOpen(true)
}

// Add a function to handle saving the edited activity name:
setActivities(
  activities.map((activity) =>
    activity.activity_id === activityToEdit.activity_id
      ? { ...activity, name: editActivityName, published: editActivityPublished }
      : activity,
  ),
)

// Close the dialog
setEditActivityDialogOpen(false)
setActivityToEdit(null)
}

// Add a function to handle opening the edit activity type dialog:
const handleEditActivityType = (activityType: ActivityType) => {
  switch (activityType.type) {
    case "reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "reading_addon":
      setReadingAddonModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "source":
      setSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "in_text_source":
      setInTextSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "question":
      setQuestionModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "graphic_organizer":
      setGraphicOrganizerModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "vocabulary":
      setVocabularyModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "image":
      setImageModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "sub_reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
  }
}

const handleDeleteActivity = (activity: Activity) => {
  setActivityToDelete(activity)

  // Check if this activity has any associated directions
  const checkForDirections = async () => {
    const { data, error } = await supabase
      .from("lp_directions")
      .select("lp_directions_id")
      .eq("activity_id", activity.activity_id)
      .limit(1)

    if (error) {
      console.error("Error checking for directions:", error)
      setDeleteConfirmOpen(true) // Default to regular delete if check fails
      return
    }

    if (data && data.length > 0) {
      // Activity has directions, ask user what to do
      setKeepDirectionsDialogOpen(true)
    } else {
      // No directions, proceed with regular delete confirmation
      setDeleteConfirmOpen(true)
    }
  }

  checkForDirections()
}

// Handle keeping directions but removing activity reference
const handleKeepDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Update directions to remove activity_id reference
    const { error } = await supabase
      .from("lp_directions")
      .update({ activity_id: null })
      .eq("activity_id", activityToDelete.activity_id)

    if (error) throw error

    // Continue with regular activity deletion
    await deleteActivity(false)

    toast({
      title: "Success",
      description: "Activity deleted and directions preserved",
    })
  } catch (error: any) {
    console.error("Error updating directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Handle deleting both activity and directions
const handleDeleteDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Delete directions first, then activity
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity and associated directions deleted",
    })
  } catch (error: any) {
    console.error("Error deleting activity and directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity and directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Update the confirmDeleteActivity function to delete from the database
const confirmDeleteActivity = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Use the common delete function
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting activity:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity",
      variant: "destructive",
    })
  } finally {
    setDeleteConfirmOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Common function for deleting an activity
const deleteActivity = async (deleteDirections: boolean) => {
  if (!activityToDelete) return

  // If deleteDirections is true, delete the related directions
  if (deleteDirections) {
    await supabase.from("lp_directions").delete().eq("activity_id", activityToDelete.activity_id)
  }

  // Delete all associated activity types
  const types = activityTypes[activityToDelete.activity_id] || []

  for (const activityType of types) {
    switch (activityType.type) {
      case "reading":
        await supabase.from("readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "reading_addon":
        await supabase.from("readings_addon").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "source":
        await supabase.from("sources").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "in_text_source":
        await supabase.from("in_text_source").delete().eq("actvity_id", activityToDelete.activity_id)
        break
      case "question":
        await supabase.from("questions").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "graphic_organizer":
        await supabase.from("graphic_organizers").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "vocabulary":
        await supabase.from("vocabulary").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "image":
        await supabase.from("images").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "sub_reading":
        await supabase.from("sub_readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
    }
  }

  // Delete the activity itself
  const { error } = await supabase.from("activities").delete().eq("activity_id", activityToDelete.activity_id)

  if (error) throw error

  // Remove from state
  const updatedActivities = activities.filter((a) => a.activity_id !== activityToDelete.activity_id)

  // Recalculate order for remaining activities
  const reorderedActivities = updatedActivities.map((activity, index) => ({
    ...activity,
    order: index + 1,
  }))

  setActivities(reorderedActivities)

  // Remove associated activity types
  const updatedActivityTypes = { ...activityTypes }
  delete updatedActivityTypes[activityToDelete.activity_id]
  setActivityTypes(updatedActivityTypes)
}

const getActivityTypeIcon = (type: ActivityType["type"]) => {
  switch (type) {
    case "reading":
      return <FileText className="h-4 w-4" />
    case "reading_addon":
      return <BookPlus className="h-4 w-4" />
    case "source":
      return <LibraryBig className="h-4 w-4" />
    case "in_text_source":
      return <NotepadText className="h-4 w-4" />
    case "question":
      return <HelpCircle className="h-4 w-4" />
    case "graphic_organizer":
      return <LayoutGrid className="h-4 w-4" />
    case "vocabulary":
      return <BookOpen className="h-4 w-4" />
    case "image":
      return <ImageIcon className="h-4 w-4" />
    case "sub_reading":
      return <BookDown className="h-4 w-4" />
  }
}

const getActivityTypePreview = (type: ActivityType["type"]) => {
  const details = activityTypeDetails[activityType.id]
  if (!details) return "No content yet"

  switch (type) {
    case "reading":
      return (details as Reading).reading_title || "Untitled Reading"
    case "reading_addon":
      const addonText = (details as ReadingAddon).reaing_text
      return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
    case "source":
      return (details as Source).source_title_ce || "Untitled Source"
    case "in_text_source":
      return (details as InTextSource).source_title_ce || "Untitled In-Text Source"
    case "question":
      // Use question_title if available, otherwise fall back to question text
      const questionDetails = details as Question
      if (questionDetails.question_title) {
        return questionDetails.question_title
      }
      // Fallback to question text for backward compatibility
      const question = questionDetails.question || questionDetails.question_text
      return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
    case "graphic_organizer":
      return (details as GraphicOrganizer).template_type || "Untitled Organizer"
    case "vocabulary":
      const vocabItems = (details as Vocabulary).items || []
      return vocabItems.length > 0
        ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
        : "Vocabulary (empty)"
    case "image":
      return (details as ImageActivity).img_title || "Untitled Image"
    case "sub_reading":
      return (details as SubReading).reading_title || "Untitled Sub-Reading"
  }
}

// Add a function to handle opening the edit activity dialog:
const handleEditActivity = (activity: Activity) => {
  setActivityToEdit(activity)
  setEditActivityName(activity.name || "")
  setEditActivityPublished(activity.published || "No")
  setEditActivityDialogOpen(true)
}

// Add a function to handle saving the edited activity name:
const handleSaveActivityName = () => {
  if (!activityToEdit) return

  // Update the activity name in the state
  setActivities(
    activities.map((activity) =>
      activity.activity_id === activityToEdit.activity_id
        ? { ...activity, name: editActivityName, published: editActivityPublished }
        : activity,
    ),
  )

  // Close the dialog
  setEditActivityDialogOpen(false)
  setActivityToEdit(null)
}

// Add a function to handle opening the edit activity type dialog:
const handleEditActivityType = (activityType: ActivityType) => {
  switch (activityType.type) {
    case "reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "reading_addon":
      setReadingAddonModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "source":
      setSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "in_text_source":
      setInTextSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "question":
      setQuestionModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "graphic_organizer":
      setGraphicOrganizerModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "vocabulary":
      setVocabularyModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "image":
      setImageModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "sub_reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
  }
}

const handleDeleteActivity = (activity: Activity) => {
  setActivityToDelete(activity)

  // Check if this activity has any associated directions
  const checkForDirections = async () => {
    const { data, error } = await supabase
      .from("lp_directions")
      .select("lp_directions_id")
      .eq("activity_id", activity.activity_id)
      .limit(1)

    if (error) {
      console.error("Error checking for directions:", error)
      setDeleteConfirmOpen(true) // Default to regular delete if check fails
      return
    }

    if (data && data.length > 0) {
      // Activity has directions, ask user what to do
      setKeepDirectionsDialogOpen(true)
    } else {
      // No directions, proceed with regular delete confirmation
      setDeleteConfirmOpen(true)
    }
  }

  checkForDirections()
}

// Handle keeping directions but removing activity reference
const handleKeepDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Update directions to remove activity_id reference
    const { error } = await supabase
      .from("lp_directions")
      .update({ activity_id: null })
      .eq("activity_id", activityToDelete.activity_id)

    if (error) throw error

    // Continue with regular activity deletion
    await deleteActivity(false)

    toast({
      title: "Success",
      description: "Activity deleted and directions preserved",
    })
  } catch (error: any) {
    console.error("Error updating directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Handle deleting both activity and directions
const handleDeleteDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Delete directions first, then activity
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity and associated directions deleted",
    })
  } catch (error: any) {
    console.error("Error deleting activity and directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity and directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Update the confirmDeleteActivity function to delete from the database
const confirmDeleteActivity = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Use the common delete function
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting activity:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity",
      variant: "destructive",
    })
  } finally {
    setDeleteConfirmOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Common function for deleting an activity
const deleteActivity = async (deleteDirections: boolean) => {
  if (!activityToDelete) return

  // If deleteDirections is true, delete the related directions
  if (deleteDirections) {
    await supabase.from("lp_directions").delete().eq("activity_id", activityToDelete.activity_id)
  }

  // Delete all associated activity types
  const types = activityTypes[activityToDelete.activity_id] || []

  for (const activityType of types) {
    switch (activityType.type) {
      case "reading":
        await supabase.from("readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "reading_addon":
        await supabase.from("readings_addon").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "source":
        await supabase.from("sources").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "in_text_source":
        await supabase.from("in_text_source").delete().eq("actvity_id", activityToDelete.activity_id)
        break
      case "question":
        await supabase.from("questions").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "graphic_organizer":
        await supabase.from("graphic_organizers").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "vocabulary":
        await supabase.from("vocabulary").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "image":
        await supabase.from("images").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "sub_reading":
        await supabase.from("sub_readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
    }
  }

  // Delete the activity itself
  const { error } = await supabase.from("activities").delete().eq("activity_id", activityToDelete.activity_id)

  if (error) throw error

  // Remove from state
  const updatedActivities = activities.filter((a) => a.activity_id !== activityToDelete.activity_id)

  // Recalculate order for remaining activities
  const reorderedActivities = updatedActivities.map((activity, index) => ({
    ...activity,
    order: index + 1,
  }))

  setActivities(reorderedActivities)

  // Remove associated activity types
  const updatedActivityTypes = { ...activityTypes }
  delete updatedActivityTypes[activityToDelete.activity_id]
  setActivityTypes(updatedActivityTypes)
}

const getActivityTypeIcon = (type: ActivityType["type"]) => {
  switch (type) {
    case "reading":
      return <FileText className="h-4 w-4" />
    case "reading_addon":
      return <BookPlus className="h-4 w-4" />
    case "source":
      return <LibraryBig className="h-4 w-4" />
    case "in_text_source":
      return <NotepadText className="h-4 w-4" />
    case "question":
      return <HelpCircle className="h-4 w-4" />
    case "graphic_organizer":
      return <LayoutGrid className="h-4 w-4" />
    case "vocabulary":
      return <BookOpen className="h-4 w-4" />
    case "image":
      return <ImageIcon className="h-4 w-4" />
    case "sub_reading":
      return <BookDown className="h-4 w-4" />
  }
}

const getActivityTypePreview = (type: ActivityType["type"]) => {
  const details = activityTypeDetails[activityType.id]
  if (!details) return "No content yet"

  switch (type) {
    case "reading":
      return (details as Reading).reading_title || "Untitled Reading"
    case "reading_addon":
      const addonText = (details as ReadingAddon).reaing_text
      return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
    case "source":
      return (details as Source).source_title_ce || "Untitled Source"
    case "in_text_source":
      return (details as InTextSource).source_title_ce || "Untitled In-Text Source"
    case "question":
      // Use question_title if available, otherwise fall back to question text
      const questionDetails = details as Question
      if (questionDetails.question_title) {
        return questionDetails.question_title
      }
      // Fallback to question text for backward compatibility
      const question = questionDetails.question || questionDetails.question_text
      return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
    case "graphic_organizer":
      return (details as GraphicOrganizer).template_type || "Untitled Organizer"
    case "vocabulary":
      const vocabItems = (details as Vocabulary).items || []
      return vocabItems.length > 0
        ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
        : "Vocabulary (empty)"
    case "image":
      return (details as ImageActivity).img_title || "Untitled Image"
    case "sub_reading":
      return (details as SubReading).reading_title || "Untitled Sub-Reading"
  }
}

// Add a function to handle opening the edit activity dialog:
const handleEditActivity = (activity: Activity) => {
  setActivityToEdit(activity)
  setEditActivityName(activity.name || "")
  setEditActivityPublished(activity.published || "No")
  setEditActivityDialogOpen(true)
}

// Add a function to handle saving the edited activity name:
const handleSaveActivityName = () => {
  if (!activityToEdit) return

  // Update the activity name in the state
  setActivities(
    activities.map((activity) =>
      activity.activity_id === activityToEdit.activity_id
        ? { ...activity, name: editActivityName, published: editActivityPublished }
        : activity,
    ),
  )

  // Close the dialog
  setEditActivityDialogOpen(false)
  setActivityToEdit(null)
}

// Add a function to handle opening the edit activity type dialog:
const handleEditActivityType = (activityType: ActivityType) => {
  switch (activityType.type) {
    case "reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "reading_addon":
      setReadingAddonModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "source":
      setSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "in_text_source":
      setInTextSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "question":
      setQuestionModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "graphic_organizer":
      setGraphicOrganizerModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "vocabulary":
      setVocabularyModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "image":
      setImageModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "sub_reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
  }
}

const handleDeleteActivity = (activity: Activity) => {
  setActivityToDelete(activity)

  // Check if this activity has any associated directions
  const checkForDirections = async () => {
    const { data, error } = await supabase
      .from("lp_directions")
      .select("lp_directions_id")
      .eq("activity_id", activity.activity_id)
      .limit(1)

    if (error) {
      console.error("Error checking for directions:", error)
      setDeleteConfirmOpen(true) // Default to regular delete if check fails
      return
    }

    if (data && data.length > 0) {
      // Activity has directions, ask user what to do
      setKeepDirectionsDialogOpen(true)
    } else {
      // No directions, proceed with regular delete confirmation
      setDeleteConfirmOpen(true)
    }
  }

  checkForDirections()
}

// Handle keeping directions but removing activity reference
const handleKeepDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Update directions to remove activity_id reference
    const { error } = await supabase
      .from("lp_directions")
      .update({ activity_id: null })
      .eq("activity_id", activityToDelete.activity_id)

    if (error) throw error

    // Continue with regular activity deletion
    await deleteActivity(false)

    toast({
      title: "Success",
      description: "Activity deleted and directions preserved",
    })
  } catch (error: any) {
    console.error("Error updating directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Handle deleting both activity and directions
const handleDeleteDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Delete directions first, then activity
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity and associated directions deleted",
    })
  } catch (error: any) {
    console.error("Error deleting activity and directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity and directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Update the confirmDeleteActivity function to delete from the database
const confirmDeleteActivity = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Use the common delete function
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting activity:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity",
      variant: "destructive",
    })
  } finally {
    setDeleteConfirmOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Common function for deleting an activity
const deleteActivity = async (deleteDirections: boolean) => {
  if (!activityToDelete) return

  // If deleteDirections is true, delete the related directions
  if (deleteDirections) {
    await supabase.from("lp_directions").delete().eq("activity_id", activityToDelete.activity_id)
  }

  // Delete all associated activity types
  const types = activityTypes[activityToDelete.activity_id] || []

  for (const activityType of types) {
    switch (activityType.type) {
      case "reading":
        await supabase.from("readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "reading_addon":
        await supabase.from("readings_addon").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "source":
        await supabase.from("sources").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "in_text_source":
        await supabase.from("in_text_source").delete().eq("actvity_id", activityToDelete.activity_id)
        break
      case "question":
        await supabase.from("questions").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "graphic_organizer":
        await supabase.from("graphic_organizers").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "vocabulary":
        await supabase.from("vocabulary").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "image":
        await supabase.from("images").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "sub_reading":
        await supabase.from("sub_readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
    }
  }

  // Delete the activity itself
  const { error } = await supabase.from("activities").delete().eq("activity_id", activityToDelete.activity_id)

  if (error) throw error

  // Remove from state
  const updatedActivities = activities.filter((a) => a.activity_id !== activityToDelete.activity_id)

  // Recalculate order for remaining activities
  const reorderedActivities = updatedActivities.map((activity, index) => ({
    ...activity,
    order: index + 1,
  }))

  setActivities(reorderedActivities)

  // Remove associated activity types
  const updatedActivityTypes = { ...activityTypes }
  delete updatedActivityTypes[activityToDelete.activity_id]
  setActivityTypes(updatedActivityTypes)
}

const getActivityTypeIcon = (type: ActivityType["type"]) => {
  switch (type) {
    case "reading":
      return <FileText className="h-4 w-4" />
    case "reading_addon":
      return <BookPlus className="h-4 w-4" />
    case "source":
      return <LibraryBig className="h-4 w-4" />
    case "in_text_source":
      return <NotepadText className="h-4 w-4" />
    case "question":
      return <HelpCircle className="h-4 w-4" />
    case "graphic_organizer":
      return <LayoutGrid className="h-4 w-4" />
    case "vocabulary":
      return <BookOpen className="h-4 w-4" />
    case "image":
      return <ImageIcon className="h-4 w-4" />
    case "sub_reading":
      return <BookDown className="h-4 w-4" />
  }
}

const getActivityTypePreview = (type: ActivityType["type"]) => {
  const details = activityTypeDetails[activityType.id]
  if (!details) return "No content yet"

  switch (type) {
    case "reading":
      return (details as Reading).reading_title || "Untitled Reading"
    case "reading_addon":
      const addonText = (details as ReadingAddon).reaing_text
      return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
    case "source":
      return (details as Source).source_title_ce || "Untitled Source"
    case "in_text_source":
      return (details as InTextSource).source_title_ce || "Untitled In-Text Source"
    case "question":
      // Use question_title if available, otherwise fall back to question text
      const questionDetails = details as Question
      if (questionDetails.question_title) {
        return questionDetails.question_title
      }
      // Fallback to question text for backward compatibility
      const question = questionDetails.question || questionDetails.question_text
      return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
    case "graphic_organizer":
      return (details as GraphicOrganizer).template_type || "Untitled Organizer"
    case "vocabulary":
      const vocabItems = (details as Vocabulary).items || []
      return vocabItems.length > 0
        ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
        : "Vocabulary (empty)"
    case "image":
      return (details as ImageActivity).img_title || "Untitled Image"
    case "sub_reading":
      return (details as SubReading).reading_title || "Untitled Sub-Reading"
  }
}

// Add a function to handle opening the edit activity dialog:
const handleEditActivity = (activity: Activity) => {
  setActivityToEdit(activity)
  setEditActivityName(activity.name || "")
  setEditActivityPublished(activity.published || "No")
  setEditActivityDialogOpen(true)
}

// Add a function to handle saving the edited activity name:
const handleSaveActivityName = () => {
  if (!activityToEdit) return

  // Update the activity name in the state
  setActivities(
    activities.map((activity) =>
      activity.activity_id === activityToEdit.activity_id
        ? { ...activity, name: editActivityName, published: editActivityPublished }
        : activity,
    ),
  )

  // Close the dialog
  setEditActivityDialogOpen(false)
  setActivityToEdit(null)
}

// Add a function to handle opening the edit activity type dialog:
const handleEditActivityType = (activityType: ActivityType) => {
  switch (activityType.type) {
    case "reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "reading_addon":
      setReadingAddonModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "source":
      setSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "in_text_source":
      setInTextSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "question":
      setQuestionModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "graphic_organizer":
      setGraphicOrganizerModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "vocabulary":
      setVocabularyModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "image":
      setImageModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "sub_reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
  }
}

const handleDeleteActivity = (activity: Activity) => {
  setActivityToDelete(activity)

  // Check if this activity has any associated directions
  const checkForDirections = async () => {
    const { data, error } = await supabase
      .from("lp_directions")
      .select("lp_directions_id")
      .eq("activity_id", activity.activity_id)
      .limit(1)

    if (error) {
      console.error("Error checking for directions:", error)
      setDeleteConfirmOpen(true) // Default to regular delete if check fails
      return
    }

    if (data && data.length > 0) {
      // Activity has directions, ask user what to do
      setKeepDirectionsDialogOpen(true)
    } else {
      // No directions, proceed with regular delete confirmation
      setDeleteConfirmOpen(true)
    }
  }

  checkForDirections()
}

// Handle keeping directions but removing activity reference
const handleKeepDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Update directions to remove activity_id reference
    const { error } = await supabase
      .from("lp_directions")
      .update({ activity_id: null })
      .eq("activity_id", activityToDelete.activity_id)

    if (error) throw error

    // Continue with regular activity deletion
    await deleteActivity(false)

    toast({
      title: "Success",
      description: "Activity deleted and directions preserved",
    })
  } catch (error: any) {
    console.error("Error updating directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Handle deleting both activity and directions
const handleDeleteDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Delete directions first, then activity
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity and associated directions deleted",
    })
  } catch (error: any) {
    console.error("Error deleting activity and directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity and directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Update the confirmDeleteActivity function to delete from the database
const confirmDeleteActivity = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Use the common delete function
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting activity:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity",
      variant: "destructive",
    })
  } finally {
    setDeleteConfirmOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Common function for deleting an activity
const deleteActivity = async (deleteDirections: boolean) => {
  if (!activityToDelete) return

  // If deleteDirections is true, delete the related directions
  if (deleteDirections) {
    await supabase.from("lp_directions").delete().eq("activity_id", activityToDelete.activity_id)
  }

  // Delete all associated activity types
  const types = activityTypes[activityToDelete.activity_id] || []

  for (const activityType of types) {
    switch (activityType.type) {
      case "reading":
        await supabase.from("readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "reading_addon":
        await supabase.from("readings_addon").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "source":
        await supabase.from("sources").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "in_text_source":
        await supabase.from("in_text_source").delete().eq("actvity_id", activityToDelete.activity_id)
        break
      case "question":
        await supabase.from("questions").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "graphic_organizer":
        await supabase.from("graphic_organizers").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "vocabulary":
        await supabase.from("vocabulary").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "image":
        await supabase.from("images").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "sub_reading":
        await supabase.from("sub_readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
    }
  }

  // Delete the activity itself
  const { error } = await supabase.from("activities").delete().eq("activity_id", activityToDelete.activity_id)

  if (error) throw error

  // Remove from state
  const updatedActivities = activities.filter((a) => a.activity_id !== activityToDelete.activity_id)

  // Recalculate order for remaining activities
  const reorderedActivities = updatedActivities.map((activity, index) => ({
    ...activity,
    order: index + 1,
  }))

  setActivities(reorderedActivities)

  // Remove associated activity types
  const updatedActivityTypes = { ...activityTypes }
  delete updatedActivityTypes[activityToDelete.activity_id]
  setActivityTypes(updatedActivityTypes)
}

const getActivityTypeIcon = (type: ActivityType["type"]) => {
  switch (type) {
    case "reading":
      return <FileText className="h-4 w-4" />
    case "reading_addon":
      return <BookPlus className="h-4 w-4" />
    case "source":
      return <LibraryBig className="h-4 w-4" />
    case "in_text_source":
      return <NotepadText className="h-4 w-4" />
    case "question":
      return <HelpCircle className="h-4 w-4" />
    case "graphic_organizer":
      return <LayoutGrid className="h-4 w-4" />
    case "vocabulary":
      return <BookOpen className="h-4 w-4" />
    case "image":
      return <ImageIcon className="h-4 w-4" />
    case "sub_reading":
      return <BookDown className="h-4 w-4" />
  }
}

const getActivityTypePreview = (type: ActivityType["type"]) => {
  const details = activityTypeDetails[activityType.id]
  if (!details) return "No content yet"

  switch (type) {
    case "reading":
      return (details as Reading).reading_title || "Untitled Reading"
    case "reading_addon":
      const addonText = (details as ReadingAddon).reaing_text
      return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
    case "source":
      return (details as Source).source_title_ce || "Untitled Source"
    case "in_text_source":
      return (details as InTextSource).source_title_ce || "Untitled In-Text Source"
    case "question":
      // Use question_title if available, otherwise fall back to question text
      const questionDetails = details as Question
      if (questionDetails.question_title) {
        return questionDetails.question_title
      }
      // Fallback to question text for backward compatibility
      const question = questionDetails.question || questionDetails.question_text
      return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
    case "graphic_organizer":
      return (details as GraphicOrganizer).template_type || "Untitled Organizer"
    case "vocabulary":
      const vocabItems = (details as Vocabulary).items || []
      return vocabItems.length > 0
        ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
        : "Vocabulary (empty)"
    case "image":
      return (details as ImageActivity).img_title || "Untitled Image"
    case "sub_reading":
      return (details as SubReading).reading_title || "Untitled Sub-Reading"
  }
}

// Add a function to handle opening the edit activity dialog:
const handleEditActivity = (activity: Activity) => {
  setActivityToEdit(activity)
  setEditActivityName(activity.name || "")
  setEditActivityPublished(activity.published || "No")
  setEditActivityDialogOpen(true)
}

// Add a function to handle saving the edited activity name:
const handleSaveActivityName = () => {
  if (!activityToEdit) return

  // Update the activity name in the state
  setActivities(
    activities.map((activity) =>
      activity.activity_id === activityToEdit.activity_id
        ? { ...activity, name: editActivityName, published: editActivityPublished }
        : activity,
    ),
  )

  // Close the dialog
  setEditActivityDialogOpen(false)
  setActivityToEdit(null)
}

// Add a function to handle opening the edit activity type dialog:
const handleEditActivityType = (activityType: ActivityType) => {
  switch (activityType.type) {
    case "reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "reading_addon":
      setReadingAddonModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "source":
      setSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "in_text_source":
      setInTextSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "question":
      setQuestionModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "graphic_organizer":
      setGraphicOrganizerModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "vocabulary":
      setVocabularyModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "image":
      setImageModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "sub_reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
  }
}

const handleDeleteActivity = (activity: Activity) => {
  setActivityToDelete(activity)

  // Check if this activity has any associated directions
  const checkForDirections = async () => {
    const { data, error } = await supabase
      .from("lp_directions")
      .select("lp_directions_id")
      .eq("activity_id", activity.activity_id)
      .limit(1)

    if (error) {
      console.error("Error checking for directions:", error)
      setDeleteConfirmOpen(true) // Default to regular delete if check fails
      return
    }

    if (data && data.length > 0) {
      // Activity has directions, ask user what to do
      setKeepDirectionsDialogOpen(true)
    } else {
      // No directions, proceed with regular delete confirmation
      setDeleteConfirmOpen(true)
    }
  }

  checkForDirections()
}

// Handle keeping directions but removing activity reference
const handleKeepDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Update directions to remove activity_id reference
    const { error } = await supabase
      .from("lp_directions")
      .update({ activity_id: null })
      .eq("activity_id", activityToDelete.activity_id)

    if (error) throw error

    // Continue with regular activity deletion
    await deleteActivity(false)

    toast({
      title: "Success",
      description: "Activity deleted and directions preserved",
    })
  } catch (error: any) {
    console.error("Error updating directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Handle deleting both activity and directions
const handleDeleteDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Delete directions first, then activity
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity and associated directions deleted",
    })
  } catch (error: any) {
    console.error("Error deleting activity and directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity and directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Update the confirmDeleteActivity function to delete from the database
const confirmDeleteActivity = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Use the common delete function
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting activity:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity",
      variant: "destructive",
    })
  } finally {
    setDeleteConfirmOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Common function for deleting an activity
const deleteActivity = async (deleteDirections: boolean) => {
  if (!activityToDelete) return

  // If deleteDirections is true, delete the related directions
  if (deleteDirections) {
    await supabase.from("lp_directions").delete().eq("activity_id", activityToDelete.activity_id)
  }

  // Delete all associated activity types
  const types = activityTypes[activityToDelete.activity_id] || []

  for (const activityType of types) {
    switch (activityType.type) {
      case "reading":
        await supabase.from("readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "reading_addon":
        await supabase.from("readings_addon").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "source":
        await supabase.from("sources").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "in_text_source":
        await supabase.from("in_text_source").delete().eq("actvity_id", activityToDelete.activity_id)
        break
      case "question":
        await supabase.from("questions").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "graphic_organizer":
        await supabase.from("graphic_organizers").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "vocabulary":
        await supabase.from("vocabulary").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "image":
        await supabase.from("images").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "sub_reading":
        await supabase.from("sub_readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
    }
  }

  // Delete the activity itself
  const { error } = await supabase.from("activities").delete().eq("activity_id", activityToDelete.activity_id)

  if (error) throw error

  // Remove from state
  const updatedActivities = activities.filter((a) => a.activity_id !== activityToDelete.activity_id)

  // Recalculate order for remaining activities
  const reorderedActivities = updatedActivities.map((activity, index) => ({
    ...activity,
    order: index + 1,
  }))

  setActivities(reorderedActivities)

  // Remove associated activity types
  const updatedActivityTypes = { ...activityTypes }
  delete updatedActivityTypes[activityToDelete.activity_id]
  setActivityTypes(updatedActivityTypes)
}

const getActivityTypeIcon = (type: ActivityType["type"]) => {
  switch (type) {
    case "reading":
      return <FileText className="h-4 w-4" />
    case "reading_addon":
      return <BookPlus className="h-4 w-4" />
    case "source":
      return <LibraryBig className="h-4 w-4" />
    case "in_text_source":
      return <NotepadText className="h-4 w-4" />
    case "question":
      return <HelpCircle className="h-4 w-4" />
    case "graphic_organizer":
      return <LayoutGrid className="h-4 w-4" />
    case "vocabulary":
      return <BookOpen className="h-4 w-4" />
    case "image":
      return <ImageIcon className="h-4 w-4" />
    case "sub_reading":
      return <BookDown className="h-4 w-4" />
  }
}

const getActivityTypePreview = (type: ActivityType["type"]) => {
  const details = activityTypeDetails[activityType.id]
  if (!details) return "No content yet"

  switch (type) {
    case "reading":
      return (details as Reading).reading_title || "Untitled Reading"
    case "reading_addon":
      const addonText = (details as ReadingAddon).reaing_text
      return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
    case "source":
      return (details as Source).source_title_ce || "Untitled Source"
    case "in_text_source":
      return (details as InTextSource).source_title_ce || "Untitled In-Text Source"
    case "question":
      // Use question_title if available, otherwise fall back to question text
      const questionDetails = details as Question
      if (questionDetails.question_title) {
        return questionDetails.question_title
      }
      // Fallback to question text for backward compatibility
      const question = questionDetails.question || questionDetails.question_text
      return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
    case "graphic_organizer":
      return (details as GraphicOrganizer).template_type || "Untitled Organizer"
    case "vocabulary":
      const vocabItems = (details as Vocabulary).items || []
      return vocabItems.length > 0
        ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
        : "Vocabulary (empty)"
    case "image":
      return (details as ImageActivity).img_title || "Untitled Image"
    case "sub_reading":
      return (details as SubReading).reading_title || "Untitled Sub-Reading"
  }
}

// Add a function to handle opening the edit activity dialog:
const handleEditActivity = (activity: Activity) => {
  setActivityToEdit(activity)
  setEditActivityName(activity.name || "")
  setEditActivityPublished(activity.published || "No")
  setEditActivityDialogOpen(true)
}

// Add a function to handle saving the edited activity name:
const handleSaveActivityName = () => {
  if (!activityToEdit) return

  // Update the activity name in the state
  setActivities(
    activities.map((activity) =>
      activity.activity_id === activityToEdit.activity_id
        ? { ...activity, name: editActivityName, published: editActivityPublished }
        : activity,
    ),
  )

  // Close the dialog
  setEditActivityDialogOpen(false)
  setActivityToEdit(null)
}

// Add a function to handle opening the edit activity type dialog:
const handleEditActivityType = (activityType: ActivityType) => {
  switch (activityType.type) {
    case "reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "reading_addon":
      setReadingAddonModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "source":
      setSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "in_text_source":
      setInTextSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "question":
      setQuestionModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "graphic_organizer":
      setGraphicOrganizerModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "vocabulary":
      setVocabularyModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "image":
      setImageModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "sub_reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
  }
}

const handleDeleteActivity = (activity: Activity) => {
  setActivityToDelete(activity)

  // Check if this activity has any associated directions
  const checkForDirections = async () => {
    const { data, error } = await supabase
      .from("lp_directions")
      .select("lp_directions_id")
      .eq("activity_id", activity.activity_id)
      .limit(1)

    if (error) {
      console.error("Error checking for directions:", error)
      setDeleteConfirmOpen(true) // Default to regular delete if check fails
      return
    }

    if (data && data.length > 0) {
      // Activity has directions, ask user what to do
      setKeepDirectionsDialogOpen(true)
    } else {
      // No directions, proceed with regular delete confirmation
      setDeleteConfirmOpen(true)
    }
  }

  checkForDirections()
}

// Handle keeping directions but removing activity reference
const handleKeepDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Update directions to remove activity_id reference
    const { error } = await supabase
      .from("lp_directions")
      .update({ activity_id: null })
      .eq("activity_id", activityToDelete.activity_id)

    if (error) throw error

    // Continue with regular activity deletion
    await deleteActivity(false)

    toast({
      title: "Success",
      description: "Activity deleted and directions preserved",
    })
  } catch (error: any) {
    console.error("Error updating directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Handle deleting both activity and directions
const handleDeleteDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Delete directions first, then activity
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity and associated directions deleted",
    })
  } catch (error: any) {
    console.error("Error deleting activity and directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity and directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Update the confirmDeleteActivity function to delete from the database
const confirmDeleteActivity = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Use the common delete function
    await deleteActivity(true)

    toast({
      title: "Success",
      description: "Activity deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting activity:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete activity",
      variant: "destructive",
    })
  } finally {
    setDeleteConfirmOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Common function for deleting an activity
const deleteActivity = async (deleteDirections: boolean) => {
  if (!activityToDelete) return

  // If deleteDirections is true, delete the related directions
  if (deleteDirections) {
    await supabase.from("lp_directions").delete().eq("activity_id", activityToDelete.activity_id)
  }

  // Delete all associated activity types
  const types = activityTypes[activityToDelete.activity_id] || []

  for (const activityType of types) {
    switch (activityType.type) {
      case "reading":
        await supabase.from("readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "reading_addon":
        await supabase.from("readings_addon").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "source":
        await supabase.from("sources").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "in_text_source":
        await supabase.from("in_text_source").delete().eq("actvity_id", activityToDelete.activity_id)
        break
      case "question":
        await supabase.from("questions").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "graphic_organizer":
        await supabase.from("graphic_organizers").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "vocabulary":
        await supabase.from("vocabulary").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "image":
        await supabase.from("images").delete().eq("activity_id", activityToDelete.activity_id)
        break
      case "sub_reading":
        await supabase.from("sub_readings").delete().eq("activity_id", activityToDelete.activity_id)
        break
    }
  }

  // Delete the activity itself
  const { error } = await supabase.from("activities").delete().eq("activity_id", activityToDelete.activity_id)

  if (error) throw error

  // Remove from state
  const updatedActivities = activities.filter((a) => a.activity_id !== activityToDelete.activity_id)

  // Recalculate order for remaining activities
  const reorderedActivities = updatedActivities.map((activity, index) => ({
    ...activity,
    order: index + 1,
  }))

  setActivities(reorderedActivities)

  // Remove associated activity types
  const updatedActivityTypes = { ...activityTypes }
  delete updatedActivityTypes[activityToDelete.activity_id]
  setActivityTypes(updatedActivityTypes)
}

const getActivityTypeIcon = (type: ActivityType["type"]) => {
  switch (type) {
    case "reading":
      return <FileText className="h-4 w-4" />
    case "reading_addon":
      return <BookPlus className="h-4 w-4" />
    case "source":
      return <LibraryBig className="h-4 w-4" />
    case "in_text_source":
      return <NotepadText className="h-4 w-4" />
    case "question":
      return <HelpCircle className="h-4 w-4" />
    case "graphic_organizer":
      return <LayoutGrid className="h-4 w-4" />
    case "vocabulary":
      return <BookOpen className="h-4 w-4" />
    case "image":
      return <ImageIcon className="h-4 w-4" />
    case "sub_reading":
      return <BookDown className="h-4 w-4" />
  }
}

const getActivityTypePreview = (type: ActivityType["type"]) => {
  const details = activityTypeDetails[activityType.id]
  if (!details) return "No content yet"

  switch (type) {
    case "reading":
      return (details as Reading).reading_title || "Untitled Reading"
    case "reading_addon":
      const addonText = (details as ReadingAddon).reaing_text
      return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
    case "source":
      return (details as Source).source_title_ce || "Untitled Source"
    case "in_text_source":
      return (details as InTextSource).source_title_ce || "Untitled In-Text Source"
    case "question":
      // Use question_title if available, otherwise fall back to question text
      const questionDetails = details as Question
      if (questionDetails.question_title) {
        return questionDetails.question_title
      }
      // Fallback to question text for backward compatibility
      const question = questionDetails.question || questionDetails.question_text
      return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
    case "graphic_organizer":
      return (details as GraphicOrganizer).template_type || "Untitled Organizer"
    case "vocabulary":
      const vocabItems = (details as Vocabulary).items || []
      return vocabItems.length > 0
        ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
        : "Vocabulary (empty)"
    case "image":
      return (details as ImageActivity).img_title || "Untitled Image"
    case "sub_reading":
      return (details as SubReading).reading_title || "Untitled Sub-Reading"
  }
}

// Add a function to handle opening the edit activity dialog:
const handleEditActivity = (activity: Activity) => {
  setActivityToEdit(activity)
  setEditActivityName(activity.name || "")
  setEditActivityPublished(activity.published || "No")
  setEditActivityDialogOpen(true)
}

// Add a function to handle saving the edited activity name:
const handleSaveActivityName = () => {
  if (!activityToEdit) return

  // Update the activity name in the state
  setActivities(
    activities.map((activity) =>
      activity.activity_id === activityToEdit.activity_id
        ? { ...activity, name: editActivityName, published: editActivityPublished }
        : activity,
    ),
  )

  // Close the dialog
  setEditActivityDialogOpen(false)
  setActivityToEdit(null)
}

// Add a function to handle opening the edit activity type dialog:
const handleEditActivityType = (activityType: ActivityType) => {
  switch (activityType.type) {
    case "reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "reading_addon":
      setReadingAddonModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "source":
      setSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "in_text_source":
      setInTextSourceModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "question":
      setQuestionModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "graphic_organizer":
      setGraphicOrganizerModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "vocabulary":
      setVocabularyModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "image":
      setImageModalOpen(true)
      setCurrentActivityType(activityType)
      break
    case "sub_reading":
      setReadingModalOpen(true)
      setCurrentActivityType(activityType)
      break
  }
}

const handleDeleteActivity = (activity: Activity) => {
  setActivityToDelete(activity)

  // Check if this activity has any associated directions
  const checkForDirections = async () => {
    const { data, error } = await supabase
      .from("lp_directions")
      .select("lp_directions_id")
      .eq("activity_id", activity.activity_id)
      .limit(1)

    if (error) {
      console.error("Error checking for directions:", error)
      setDeleteConfirmOpen(true) // Default to regular delete if check fails
      return
    }

    if (data && data.length > 0) {
      // Activity has directions, ask user what to do
      setKeepDirectionsDialogOpen(true)
    } else {
      // No directions, proceed with regular delete confirmation
      setDeleteConfirmOpen(true)
    }
  }

  checkForDirections()
}

// Handle keeping directions but removing activity reference
const handleKeepDirections = async () => {
  if (!activityToDelete) return

  setSaving(true)

  try {
    // Update directions to remove activity_id reference
    const { error } = await supabase
      .from("lp_directions")
      .update({ activity_id: null })
      .eq("activity_id", activityToDelete.activity_id)

    if (error) throw error

    // Continue with regular activity deletion
    await deleteActivity(false)

    toast({
      title: "Success",
      description: "Activity deleted and directions preserved",
    })
  } catch (error: any) {
    console.error("Error updating directions:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to update directions",
      variant: "destructive",
    })
  } finally {
    setKeepDirectionsDialogOpen(false)
    setActivityToDelete(null)
    setSaving(false)
  }
}

// Handle deleting both activity and directions
const handleDeleteDirections = async () => {
     if (!activityToDelete) return

     setSaving(true)

     try {
       // Delete directions first, then activity
       await deleteActivity(true)

       toast({
