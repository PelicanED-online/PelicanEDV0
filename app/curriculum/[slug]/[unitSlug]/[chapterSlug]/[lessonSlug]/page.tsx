"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { getCurrentUser, supabase } from "@/lib/supabase"
import {
  ArrowLeft,
  FileText,
  HelpCircle,
  LayoutGrid,
  Save,
  Plus,
  Trash2,
  Pencil,
  BookOpen,
  ImageIcon,
  BookPlus,
  LibraryBig,
  NotepadText,
  BookDown,
} from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { generateSlug } from "@/lib/utils"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { ReadingActivityModal } from "@/components/curriculum/activities/reading-activity-modal"
import { SourceActivityModal } from "@/components/curriculum/activities/source-activity-modal"
import { QuestionActivityModal } from "@/components/curriculum/activities/question-activity-modal"
import { GraphicOrganizerModal } from "@/components/curriculum/activities/graphic-organizer-modal"
import { VocabularyActivityModal } from "@/components/curriculum/activities/vocabulary-activity-modal"
import { InTextSourceModal } from "@/components/curriculum/activities/in-text-source-modal"
import { ImageActivityModal } from "@/components/curriculum/activities/image-activity-modal"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ReadingAddonModal } from "@/components/curriculum/activities/reading-addon-modal"
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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination, type } = result

    // Handle activity reordering
    if (type === "activities") {
      const items = Array.from(activities)
      const [reorderedItem] = items.splice(source.index, 1)
      items.splice(destination.index, 0, reorderedItem)

      // Update order property
      const updatedItems = items.map((item, index) => ({
        ...item,
        order: index + 1,
      }))

      setActivities(updatedItems)
    }
    // Handle activity type reordering within an activity
    else if (type.startsWith("activity-types-")) {
      const activityId = type.replace("activity-types-", "")
      const types = Array.from(activityTypes[activityId] || [])
      const [reorderedItem] = types.splice(source.index, 1)
      types.splice(destination.index, 0, reorderedItem)

      // Update order property
      const updatedTypes = types.map((item, index) => ({
        ...item,
        order: index,
      }))

      setActivityTypes({
        ...activityTypes,
        [activityId]: updatedTypes,
      })
    }
  }

  const handleAddActivity = () => {
    setNewActivityName("")
    setAddActivityDialogOpen(true)
  }

  const handleCreateActivity = () => {
    const newActivityId = uuidv4()
    const newActivity: Activity = {
      activity_id: newActivityId,
      lesson_id: lesson?.lesson_id || "",
      order: activities.length + 1,
      name: newActivityName || `Activity ${activities.length + 1}`,
      published: newActivityPublished,
    }

    setActivities([...activities, newActivity])
    setActivityTypes({
      ...activityTypes,
      [newActivityId]: [],
    })

    setAddActivityDialogOpen(false)
  }

  // Modify the handleAddActivityType function to not add to state immediately
  // Around line 500-550

  const handleAddActivityType = (activityId: string, type: ActivityType["type"]) => {
    // For readings, questions, sources, and graphic organizers, we need to generate a unique ID
    let typeId: string = uuidv4() // Always generate a valid UUID
    let initialDetails: any = {
      activity_id: activityId,
      published: "No",
    }

    if (type === "reading") {
      // Use the already generated typeId as the reading_id
      initialDetails = {
        ...initialDetails,
        reading_id: typeId, // Use the valid UUID
        reading_title: "",
        reaing_text: "",
      }
    } else if (type === "reading_addon") {
      // Use the already generated typeId as the reading_id
      initialDetails = {
        ...initialDetails,
        reading_id: typeId, // Use the valid UUID
        reaing_text: "",
      }
    } else if (type === "question") {
      // Use the already generated typeId as the question_id
      initialDetails = {
        ...initialDetails,
        question_id: typeId, // Use the valid UUID
        question: "",
      }
    } else if (type === "source") {
      const sourceId = uuidv4()
      typeId = sourceId

      // Add source-specific defaults
      initialDetails = {
        ...initialDetails,
        source_id: sourceId,
        source_title_ce: "",
        source_title_ad: "",
        source_text: "",
        source_image: "",
        source_image_description: "",
      }
    } else if (type === "in_text_source") {
      const inTextSourceId = uuidv4()
      typeId = inTextSourceId

      // Add in-text source-specific defaults
      initialDetails = {
        ...initialDetails,
        in_text_source_id: inTextSourceId,
        source_title_ce: "",
        source_title_ad: "",
        source_intro: "",
        source_text: "",
      }
    } else if (type === "graphic_organizer") {
      const goId = uuidv4()
      typeId = goId

      // Add graphic organizer-specific defaults
      initialDetails = {
        ...initialDetails,
        go_id: goId,
        template_type: "",
        content: {},
      }
    } else if (type === "image") {
      const imageId = uuidv4()
      typeId = imageId

      // Add image-specific defaults
      initialDetails = {
        ...initialDetails,
        image_id: imageId,
        img_url: "",
        description: "",
        alt: "",
        position: "center",
      }
    } else if (type === "sub_reading") {
      // Use the already generated typeId as the reading_id
      initialDetails = {
        ...initialDetails,
        reading_id: typeId, // Use the valid UUID
        reading_title: "",
        reaing_text: "",
      }
    } else {
      typeId = uuidv4()
    }

    const newType: ActivityType = {
      id: typeId,
      activity_id: activityId,
      type,
      order: activityTypes[activityId]?.length || 0,
    }

    // Store the new type temporarily without adding it to the state yet
    setCurrentActivityType(newType)

    // Store the initial details temporarily
    const tempDetails = { ...initialDetails }

    // Open the appropriate modal for editing
    switch (type) {
      case "reading":
        setReadingModalOpen(true)
        break
      case "reading_addon":
        setReadingAddonModalOpen(true)
        break
      case "source":
        setSourceModalOpen(true)
        break
      case "question":
        setQuestionModalOpen(true)
        break
      case "graphic_organizer":
        setGraphicOrganizerModalOpen(true)
        break
      case "vocabulary":
        setVocabularyModalOpen(true)
        break
      case "in_text_source":
        setInTextSourceModalOpen(true)
        break
      case "image":
        setImageModalOpen(true)
        break
      case "sub_reading":
        setReadingModalOpen(true)
        break
    }
  }

  // Now modify the handleSaveReading function to add the activity type to the state
  // Around line 600-610

  const handleSaveReading = async (reading: Reading) => {
    if (!currentActivityType) return

    console.log("Saving reading:", reading)
    console.log("Current activity type:", currentActivityType)

    // Check if we're editing an existing activity type or adding a new one
    const isEditing = activityTypes[currentActivityType.activity_id]?.some((type) => type.id === currentActivityType.id)

    if (isEditing) {
      // Update the existing activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: reading,
      })
    } else {
      // Add the activity type to the state now that the user has saved
      setActivityTypes({
        ...activityTypes,
        [currentActivityType.activity_id]: [
          ...(activityTypes[currentActivityType.activity_id] || []),
          currentActivityType,
        ],
      })

      // Update activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: reading,
      })
    }

    // Clear the current activity type
    setCurrentActivityType(null)
    setReadingModalOpen(false)
  }

  // Modify handleSaveReadingAddon
  // Around line 620-630

  const handleSaveReadingAddon = async (readingAddon: ReadingAddon) => {
    if (!currentActivityType) return

    // Check if we're editing an existing activity type or adding a new one
    const isEditing = activityTypes[currentActivityType.activity_id]?.some((type) => type.id === currentActivityType.id)

    if (isEditing) {
      // Update the existing activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: readingAddon,
      })
    } else {
      // Add the activity type to the state now that the user has saved
      setActivityTypes({
        ...activityTypes,
        [currentActivityType.activity_id]: [
          ...(activityTypes[currentActivityType.activity_id] || []),
          currentActivityType,
        ],
      })

      // Update activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: readingAddon,
      })
    }

    // Clear the current activity type
    setCurrentActivityType(null)
    setReadingAddonModalOpen(false)
  }

  // Modify handleSaveSource
  // Around line 640-650

  const handleSaveSource = async (source: Source) => {
    if (!currentActivityType) return

    // Check if we're editing an existing activity type or adding a new one
    const isEditing = activityTypes[currentActivityType.activity_id]?.some((type) => type.id === currentActivityType.id)

    if (isEditing) {
      // Update the existing activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: source,
      })
    } else {
      // Add the activity type to the state now that the user has saved
      setActivityTypes({
        ...activityTypes,
        [currentActivityType.activity_id]: [
          ...(activityTypes[currentActivityType.activity_id] || []),
          currentActivityType,
        ],
      })

      // Update activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: source,
      })
    }

    // Clear the current activity type
    setCurrentActivityType(null)
    setSourceModalOpen(false)
  }

  // Modify handleSaveInTextSource
  // Around line 660-670

  const handleSaveInTextSource = async (inTextSource: InTextSource) => {
    if (!currentActivityType) return

    // Check if we're editing an existing activity type or adding a new one
    const isEditing = activityTypes[currentActivityType.activity_id]?.some((type) => type.id === currentActivityType.id)

    if (isEditing) {
      // Update the existing activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: inTextSource,
      })
    } else {
      // Add the activity type to the state now that the user has saved
      setActivityTypes({
        ...activityTypes,
        [currentActivityType.activity_id]: [
          ...(activityTypes[currentActivityType.activity_id] || []),
          currentActivityType,
        ],
      })

      // Update activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: inTextSource,
      })
    }

    // Clear the current activity type
    setCurrentActivityType(null)
    setInTextSourceModalOpen(false)
  }

  // Find the section where we have the other handleSave functions (around line 600-750)
  // Add the missing handleSaveQuestion function after handleSaveInTextSource and before handleSaveGraphicOrganizer

  // Modify handleSaveQuestion
  const handleSaveQuestion = async (question: Question) => {
    if (!currentActivityType) return

    console.log("Saving question:", question)
    console.log("Current activity type:", currentActivityType)

    // Check if we're editing an existing activity type or adding a new one
    const isEditing = activityTypes[currentActivityType.activity_id]?.some((type) => type.id === currentActivityType.id)

    if (isEditing) {
      // Update the existing activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: question,
      })
    } else {
      // Add the activity type to the state now that the user has saved
      setActivityTypes({
        ...activityTypes,
        [currentActivityType.activity_id]: [
          ...(activityTypes[currentActivityType.activity_id] || []),
          currentActivityType,
        ],
      })

      // Update activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: question,
      })
    }

    // Clear the current activity type
    setCurrentActivityType(null)
    setQuestionModalOpen(false)
  }

  // Modify handleSaveGraphicOrganizer
  // Around line 700-710

  const handleSaveGraphicOrganizer = async (organizer: GraphicOrganizer) => {
    if (!currentActivityType) return

    // Check if we're editing an existing activity type or adding a new one
    const isEditing = activityTypes[currentActivityType.activity_id]?.some((type) => type.id === currentActivityType.id)

    if (isEditing) {
      // Update the existing activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: organizer,
      })
    } else {
      // Add the activity type to the state now that the user has saved
      setActivityTypes({
        ...activityTypes,
        [currentActivityType.activity_id]: [
          ...(activityTypes[currentActivityType.activity_id] || []),
          currentActivityType,
        ],
      })

      // Update activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: organizer,
      })
    }

    // Clear the current activity type
    setCurrentActivityType(null)
    setGraphicOrganizerModalOpen(false)
  }

  // Modify handleSaveVocabulary
  // Around line 720-730

  const handleSaveVocabulary = async (vocabulary: Vocabulary) => {
    if (!currentActivityType) return

    // Check if we're editing an existing activity type or adding a new one
    const isEditing = activityTypes[currentActivityType.activity_id]?.some((type) => type.id === currentActivityType.id)

    if (isEditing) {
      // Update the existing activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: vocabulary,
      })
    } else {
      // Add the activity type to the state now that the user has saved
      setActivityTypes({
        ...activityTypes,
        [currentActivityType.activity_id]: [
          ...(activityTypes[currentActivityType.activity_id] || []),
          currentActivityType,
        ],
      })

      // Update activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: vocabulary,
      })
    }

    // Clear the current activity type
    setCurrentActivityType(null)
    setVocabularyModalOpen(false)
  }

  // Modify handleSaveImage
  // Around line 740-750

  const handleSaveImage = async (image: ImageActivity) => {
    if (!currentActivityType) return

    // Check if we're editing an existing activity type or adding a new one
    const isEditing = activityTypes[currentActivityType.activity_id]?.some((type) => type.id === currentActivityType.id)

    if (isEditing) {
      // Update the existing activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: image,
      })
    } else {
      // Add the activity type to the state now that the user has saved
      setActivityTypes({
        ...activityTypes,
        [currentActivityType.activity_id]: [
          ...(activityTypes[currentActivityType.activity_id] || []),
          currentActivityType,
        ],
      })

      // Update activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: image,
      })
    }

    // Clear the current activity type
    setCurrentActivityType(null)
    setImageModalOpen(false)
  }

  const handleSaveSubReading = async (subReading: SubReading) => {
    if (!currentActivityType) return

    // Check if we're editing an existing activity type or adding a new one
    const isEditing = activityTypes[currentActivityType.activity_id]?.some((type) => type.id === currentActivityType.id)

    if (isEditing) {
      // Update the existing activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: subReading,
      })
    } else {
      // Add the activity type to the state now that the user has saved
      setActivityTypes({
        ...activityTypes,
        [currentActivityType.activity_id]: [
          ...(activityTypes[currentActivityType.activity_id] || []),
          currentActivityType,
        ],
      })

      // Update activity type details
      setActivityTypeDetails({
        ...activityTypeDetails,
        [currentActivityType.id]: subReading,
      })
    }

    // Clear the current activity type
    setCurrentActivityType(null)
    setReadingModalOpen(false)
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

  const handleDeleteActivityType = (activityId: string, typeId: string) => {
    setActivityTypeToDelete({ activityId, typeId })
    setDeleteTypeConfirmOpen(true)
  }

  const confirmDeleteActivityType = async () => {
    if (!activityTypeToDelete) return

    setSaving(true)

    try {
      const { activityId, typeId } = activityTypeToDelete
      const activityType = activityTypes[activityId].find((t) => t.id === typeId)

      if (!activityType) throw new Error("Activity type not found")

      // Delete from the appropriate table based on type
      switch (activityType.type) {
        case "reading":
          // Delete the specific reading by its reading_id
          const readingDetails = activityTypeDetails[typeId] as Reading
          if (readingDetails.reading_id) {
            await supabase.from("readings").delete().eq("reading_id", readingDetails.reading_id)
          }
          break
        case "reading_addon":
          // Delete the specific reading addon by its reading_id
          const readingAddonDetails = activityTypeDetails[typeId] as ReadingAddon
          if (readingAddonDetails.reading_id) {
            await supabase.from("readings_addon").delete().eq("reading_id", readingAddonDetails.reading_id)
          }
          break
        case "source":
          // Delete the specific source by its source_id
          const sourceDetails = activityTypeDetails[typeId] as Source
          if (sourceDetails.source_id) {
            await supabase.from("sources").delete().eq("source_id", sourceDetails.source_id)
          }
          break
        case "in_text_source":
          // Delete the specific in-text source by its in_text_source_id
          const inTextSourceDetails = activityTypeDetails[typeId] as InTextSource
          if (inTextSourceDetails.in_text_source_id) {
            await supabase
              .from("in_text_source")
              .delete()
              .eq("in_text_source_id", inTextSourceDetails.in_text_source_id)
          }
          break
        case "question":
          // Delete the specific question by its question_id
          const questionDetails = activityTypeDetails[typeId] as Question
          if (questionDetails.question_id) {
            await supabase.from("questions").delete().eq("question_id", questionDetails.question_id)
          }
          break
        case "graphic_organizer":
          // Delete the specific graphic organizer by its go_id
          const organizerDetails = activityTypeDetails[typeId] as GraphicOrganizer
          if (organizerDetails.go_id) {
            await supabase.from("graphic_organizers").delete().eq("go_id", organizerDetails.go_id)
          }
          break
        case "vocabulary":
          await supabase.from("vocabulary").delete().eq("activity_id", activityId)
          break
        case "image":
          // Delete the specific image by its image_id
          const imageDetails = activityTypeDetails[typeId] as ImageActivity
          if (imageDetails.image_id) {
            await supabase.from("images").delete().eq("image_id", imageDetails.image_id)
          }
          break
        case "sub_reading":
          // Delete the specific sub-reading by its reading_id
          const subReadingDetails = activityTypeDetails[typeId] as SubReading
          if (subReadingDetails.reading_id) {
            await supabase.from("sub_readings").delete().eq("reading_id", subReadingDetails.reading_id)
          }
          break
      }

      // Remove from state
      setActivityTypes({
        ...activityTypes,
        [activityId]: activityTypes[activityId].filter((t) => t.id !== typeId),
      })

      // Remove details
      const updatedDetails = { ...activityTypeDetails }
      delete updatedDetails[typeId]
      setActivityTypeDetails(updatedDetails)

      toast({
        title: "Success",
        description: "Content deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting activity type:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete content",
        variant: "destructive",
      })
    } finally {
      // Close dialog
      setDeleteTypeConfirmOpen(false)
      setActivityTypeToDelete(null)
      setSaving(false)
    }
  }

  // Modify the handleDeleteQuestion function
  // Remove the handleEditQuestion function
  // Remove handleEditQuestion

  // Remove the handleDeleteQuestion function
  // Remove handleDeleteQuestion

  // Remove the confirmDeleteQuestion function
  // Remove confirmDeleteQuestion

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

      // First, update the activities table with the current order
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

              console.log("Existing reading check result:", existingReading)

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

        // Clean up any readings in the database that are no longer in our state
        // Get all readings for this activity
        const { data: existingReadings } = await supabase
          .from("readings")
          .select("reading_id, activity_id")
          .eq("activity_id", activity.activity_id)

        if (existingReadings && existingReadings.length > 0) {
          // Find readings that are in the database but not in our state
          const readingTypesInState = updatedTypes
            .filter((type) => type.type === "reading")
            .map((type) => {
              const details = activityTypeDetails[type.id] as Reading
              return details.reading_id
            })
            .filter(Boolean) // Filter out undefined reading_ids

          const readingsToDelete = existingReadings.filter(
            (reading) => !readingTypesInState.includes(reading.reading_id),
          )

          // Delete readings that are no longer in our state
          for (const reading of readingsToDelete) {
            await supabase.from("readings").delete().eq("reading_id", reading.reading_id)
          }
        }

        // Clean up any reading addons in the database that are no longer in our state
        const { data: existingReadingAddons } = await supabase
          .from("readings_addon")
          .select("reading_id, activity_id")
          .eq("activity_id", activity.activity_id)

        if (existingReadingAddons && existingReadingAddons.length > 0) {
          // Find reading addons that are in the database but not in our state
          const readingAddonTypesInState = updatedTypes
            .filter((type) => type.type === "reading_addon")
            .map((type) => {
              const details = activityTypeDetails[type.id] as ReadingAddon
              return details.reading_id
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
          .eq("activity_id", activity.activity_id)

        if (existingSources && existingSources.length > 0) {
          // Find sources that are in the database but not in our state
          const sourceTypesInState = updatedTypes
            .filter((type) => type.type === "source")
            .map((type) => {
              const details = activityTypeDetails[type.id] as Source
              return details.source_id
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
          .eq("actvity_id", activity.activity_id)

        if (existingInTextSources && existingInTextSources.length > 0) {
          // Find in-text sources that are in the database but not in our state
          const inTextSourceTypesInState = updatedTypes
            .filter((type) => type.type === "in_text_source")
            .map((type) => {
              const details = activityTypeDetails[type.id] as InTextSource
              return details.in_text_source_id
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
          .eq("activity_id", activity.activity_id)

        if (existingQuestions && existingQuestions.length > 0) {
          // Find questions that are in the database but not in our state
          const questionTypesInState = updatedTypes
            .filter((type) => type.type === "question")
            .map((type) => {
              const details = activityTypeDetails[type.id] as Question
              return details.question_id
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
          .eq("activity_id", activity.activity_id)

        if (existingOrganizers && existingOrganizers.length > 0) {
          // Find graphic organizers that are in the database but not in our state
          const organizerTypesInState = updatedTypes
            .filter((type) => type.type === "graphic_organizer")
            .map((type) => {
              const details = activityTypeDetails[type.id] as GraphicOrganizer
              return details.go_id
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
        const { data: existingImages } = await supabase
          .from("images")
          .select("image_id")
          .eq("activity_id", activity.activity_id)

        if (existingImages && existingImages.length > 0) {
          // Find images that are in the database but not in our state
          const imageTypesInState = updatedTypes
            .filter((type) => type.type === "image")
            .map((type) => {
              const details = activityTypeDetails[type.id] as ImageActivity
              return details.image_id
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
          .eq("activity_id", activity.activity_id)

        if (existingSubReadings && existingSubReadings.length > 0) {
          // Find sub-readings that are in the database but not in our state
          const subReadingTypesInState = updatedTypes
            .filter((type) => type.type === "sub_reading")
            .map((type) => {
              const details = activityTypeDetails[type.id] as SubReading
              return details.reading_id
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

      // Clean up any activities in the database that are no longer in our state
      const { data: allActivities } = await supabase
        .from("activities")
        .select("activity_id")
        .eq("lesson_id", lesson.lesson_id)

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

      toast({
        title: "Success",
        description: "Lesson activities saved successfully.",
      })

      // Refresh activities
      await fetchActivities(lesson.lesson_id)
    } catch (error: any) {
      console.error("Error saving lesson:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save lesson activities",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pelican"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!subject || !unit || !chapter || !lesson) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-4 w-full p-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={handleBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Lesson Not Found</h1>
          </div>
          <p className="text-muted-foreground">The requested lesson could not be found.</p>
        </div>
      </DashboardLayout>
    )
  }

  const refreshSignedUrls = async (slides: any[]) => {
    const updatedSlides = await Promise.all(
      slides.map(async (slide) => {
        if (slide.slide_image) {
          // Check if the URL is already a signed URL and not expired
          if (slide.slide_image.includes("token=") && new URL(slide.slide_image).searchParams.get("token")) {
            // Extract the path from the URL
            const urlPath = slide.slide_image.split("?")[0]
            const pathParts = urlPath.split("/")
            const filePath = pathParts.slice(pathParts.indexOf("media") + 1).join("/")

            // Create a new signed URL
            const { data, error } = await supabase.storage.from("media").createSignedUrl(filePath, 31536000) // 1 year in seconds

            if (!error && data) {
              return { ...slide, slide_image: data.signedUrl }
            }
          }
        }
        return slide
      }),
    )

    return updatedSlides
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `reading_images/${fileName}`

    setIsUploading(true)

    try {
      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage.from("media").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Create a signed URL with 1-year expiration
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("media")
        .createSignedUrl(filePath, 31536000) // 1 year in seconds

      if (signedUrlError) {
        throw signedUrlError
      }

      const signedUrl = signedUrlData?.signedUrl

      // Update the form state with the signed URL
      // setFormState({
      //   ...formState,
      //   slide_image: signedUrl
      // });

      // Show preview
      setImagePreview(signedUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error uploading image",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleEditSlide = (slide: any) => {
    // setFormState(slide);
    setImagePreview(slide.slide_image)
    // setIsEditing(true);
    // setIsModalOpen(true);
  }

  const handleCloseModal = () => {
    // setIsModalOpen(false);
    // setFormState(initialFormState);
    // setIsEditing(false);
    setImagePreview(null)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 w-full p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={handleBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{lesson.lesson_name || "Untitled Lesson"}</h1>
              <p className="text-muted-foreground">
                {subject.name} &gt; {unit.name} &gt; {chapter.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddActivity}>
              <Plus className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
            <Button onClick={handleSaveLesson} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Lesson"}
            </Button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="activities" type="activities">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed rounded-md">
                    <p className="text-muted-foreground">Click "Add Activity" to create your first activity</p>
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <Draggable key={activity.activity_id} draggableId={activity.activity_id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="border rounded-md bg-card"
                        >
                          <div className="p-4 border-b flex justify-between items-center">
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium">{activity.name}</h3>
                              <span
                                className={`ml-2 text-xs px-2 py-1 rounded-full ${activity.published === "Yes" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                              >
                                {activity.published === "Yes" ? "Published" : "Draft"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditActivity(activity)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Content
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => handleAddActivityType(activity.activity_id, "reading")}
                                  >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Reading
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAddActivityType(activity.activity_id, "reading_addon")}
                                  >
                                    <BookPlus className="mr-2 h-4 w-4" />
                                    Reading Addon
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAddActivityType(activity.activity_id, "source")}
                                  >
                                    <LibraryBig className="mr-2 h-4 w-4" />
                                    Source
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAddActivityType(activity.activity_id, "in_text_source")}
                                  >
                                    <NotepadText className="mr-2 h-4 w-4" />
                                    In-Text Source
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAddActivityType(activity.activity_id, "question")}
                                  >
                                    <HelpCircle className="mr-2 h-4 w-4" />
                                    Question
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAddActivityType(activity.activity_id, "graphic_organizer")}
                                  >
                                    <LayoutGrid className="mr-2 h-4 w-4" />
                                    Graphic Organizer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAddActivityType(activity.activity_id, "vocabulary")}
                                  >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Vocabulary
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAddActivityType(activity.activity_id, "image")}
                                  >
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Image
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleAddActivityType(activity.activity_id, "sub_reading")}
                                  >
                                    <BookDown className="mr-2 h-4 w-4" />
                                    Sub Reading
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteActivity(activity)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <Droppable
                            droppableId={`activity-types-${activity.activity_id}`}
                            type={`activity-types-${activity.activity_id}`}
                          >
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef} className="p-4 space-y-2">
                                {!activityTypes[activity.activity_id] ||
                                activityTypes[activity.activity_id].length === 0 ? (
                                  <div className="text-center py-6 border-2 border-dashed rounded-md">
                                    <p className="text-muted-foreground">
                                      Click "Add Content" to add content to this activity
                                    </p>
                                  </div>
                                ) : (
                                  activityTypes[activity.activity_id].map((activityType, typeIndex) => (
                                    <Draggable key={activityType.id} draggableId={activityType.id} index={typeIndex}>
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className="border rounded-md p-3 bg-background flex justify-between items-center"
                                        >
                                          <div className="flex items-center">
                                            {getActivityTypeIcon(activityType.type)}
                                            <span className="ml-2 font-medium">
                                              {getActivityTypePreview(activityType)}
                                            </span>
                                            {activityTypeDetails[activityType.id] &&
                                              activityTypeDetails[activityType.id].published && (
                                                <span
                                                  className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                                    activityTypeDetails[activityType.id].published === "Yes"
                                                      ? "bg-green-100 text-green-800"
                                                      : "bg-gray-100 text-gray-800"
                                                  }`}
                                                >
                                                  {activityTypeDetails[activityType.id].published === "Yes"
                                                    ? "Published"
                                                    : "Draft"}
                                                </span>
                                              )}
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEditActivityType(activityType)}
                                            >
                                              Edit
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              onClick={() =>
                                                handleDeleteActivityType(activity.activity_id, activityType.id)
                                              }
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Activity Edit Modals */}
        <ReadingActivityModal
          open={readingModalOpen}
          onOpenChange={(open) => {
            setReadingModalOpen(open)
            if (!open) {
              setCurrentActivityType(null)
            }
          }}
          activity={currentActivityType as any}
          initialData={currentActivityType ? (activityTypeDetails[currentActivityType.id] as Reading) : undefined}
          onSave={handleSaveReading}
        />

        <ReadingAddonModal
          open={readingAddonModalOpen}
          onOpenChange={(open) => {
            setReadingAddonModalOpen(open)
            if (!open) {
              setCurrentActivityType(null)
            }
          }}
          activity={currentActivityType as any}
          initialData={currentActivityType ? (activityTypeDetails[currentActivityType.id] as ReadingAddon) : undefined}
          onSave={handleSaveReadingAddon}
        />

        <SourceActivityModal
          open={sourceModalOpen}
          onOpenChange={(open) => {
            setSourceModalOpen(open)
            if (!open) {
              setCurrentActivityType(null)
            }
          }}
          activity={currentActivityType as any}
          initialData={currentActivityType ? (activityTypeDetails[currentActivityType.id] as Source) : undefined}
          onSave={handleSaveSource}
        />

        <InTextSourceModal
          open={inTextSourceModalOpen}
          onOpenChange={(open) => {
            setInTextSourceModalOpen(open)
            if (!open) {
              setCurrentActivityType(null)
            }
          }}
          activity={currentActivityType as any}
          initialData={currentActivityType ? (activityTypeDetails[currentActivityType.id] as InTextSource) : undefined}
          onSave={handleSaveInTextSource}
        />

        <QuestionActivityModal
          open={questionModalOpen}
          onOpenChange={(open) => {
            setQuestionModalOpen(open)
            if (!open) {
              setCurrentActivityType(null)
            }
          }}
          activity={currentActivityType as any}
          initialData={currentActivityType ? (activityTypeDetails[currentActivityType.id] as Question) : undefined}
          onSave={handleSaveQuestion}
        />

        <GraphicOrganizerModal
          open={graphicOrganizerModalOpen}
          onOpenChange={(open) => {
            setGraphicOrganizerModalOpen(open)
            if (!open) {
              setCurrentActivityType(null)
            }
          }}
          activity={currentActivityType as any}
          initialData={
            currentActivityType ? (activityTypeDetails[currentActivityType.id] as GraphicOrganizer) : undefined
          }
          onSave={handleSaveGraphicOrganizer}
        />

        <VocabularyActivityModal
          open={vocabularyModalOpen}
          onOpenChange={(open) => {
            setVocabularyModalOpen(open)
            if (!open) {
              setCurrentActivityType(null)
            }
          }}
          activity={currentActivityType as any}
          initialData={currentActivityType ? (activityTypeDetails[currentActivityType.id] as Vocabulary) : undefined}
          onSave={handleSaveVocabulary}
        />

        <ImageActivityModal
          open={imageModalOpen}
          onOpenChange={(open) => {
            setImageModalOpen(open)
            if (!open) {
              setCurrentActivityType(null)
            }
          }}
          activity={currentActivityType as any}
          initialData={currentActivityType ? (activityTypeDetails[currentActivityType.id] as ImageActivity) : undefined}
          onSave={handleSaveImage}
        />

        {/* Add Activity Dialog */}
        <AlertDialog open={addActivityDialogOpen} onOpenChange={setAddActivityDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add New Activity</AlertDialogTitle>
              <AlertDialogDescription>Enter a name for your new activity.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="activity-name">Activity Name</Label>
                <Input
                  id="activity-name"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  placeholder="Enter activity name"
                  className="mt-2"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="new-activity-published"
                  checked={newActivityPublished === "Yes"}
                  onCheckedChange={(checked) => setNewActivityPublished(checked ? "Yes" : "No")}
                />
                <Label htmlFor="new-activity-published">Published ({newActivityPublished})</Label>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateActivity}>Create</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Activity Confirmation */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Activity</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this activity? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteActivity} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Keep or Delete Directions Dialog */}
        <AlertDialog open={keepDirectionsDialogOpen} onOpenChange={setKeepDirectionsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Activity Has Directions</AlertDialogTitle>
              <AlertDialogDescription>
                This activity is referenced by directions in lesson plans. What would you like to do with these
                directions?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-2">
                • Keep directions: Remove the activity reference but keep the directions in lesson plans
              </p>
              <p className="text-sm text-muted-foreground">
                • Delete directions: Remove both the activity and its associated directions
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button variant="outline" onClick={handleKeepDirections}>
                Keep Directions
              </Button>
              <AlertDialogAction
                onClick={handleDeleteDirections}
                className="bg-destructive text-destructive-foreground"
              >
                Delete Directions
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Activity Type Confirmation */}
        <AlertDialog open={deleteTypeConfirmOpen} onOpenChange={setDeleteTypeConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Content</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this content? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteActivityType}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Activity Dialog */}
        <AlertDialog open={editActivityDialogOpen} onOpenChange={setEditActivityDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Activity</AlertDialogTitle>
              <AlertDialogDescription>Update the name of this activity.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="edit-activity-name">Activity Name</Label>
                <Input
                  id="edit-activity-name"
                  value={editActivityName}
                  onChange={(e) => setEditActivityName(e.target.value)}
                  placeholder="Enter activity name"
                  className="mt-2"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-activity-published"
                  checked={editActivityPublished === "Yes"}
                  onCheckedChange={(checked) => setEditActivityPublished(checked ? "Yes" : "No")}
                />
                <Label htmlFor="edit-activity-published">Published ({editActivityPublished})</Label>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveActivityName}>Save</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster />
      </div>
    </DashboardLayout>
  )
}
