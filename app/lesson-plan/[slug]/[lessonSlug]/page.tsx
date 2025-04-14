"use client"

import { DialogContent } from "@/components/ui/dialog"

import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { DialogFooter } from "@/components/ui/dialog"
import { SelectItem } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DialogDescription } from "@/components/ui/dialog"
import { DialogTitle } from "@/components/ui/dialog"
import { DialogHeader } from "@/components/ui/dialog"
import { Dialog } from "@/components/ui/dialog"
import { FileUpload } from "@/components/file-upload"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { ArrowLeft, Save, Plus, Trash2, Pencil, ChevronDown, ChevronUp, Clock, Copy } from "lucide-react"
import { generateSlug } from "@/lib/utils"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
import Image from "next/image"

interface Subject {
  subject_id: string
  name: string
}

interface LessonPlan {
  lesson_plan_id: string
  lesson_id: string | null
  subject_id: string
  lesson_name?: string
}

interface SectionName {
  lp_section_name_id: string
  section_name: string
}

interface Section {
  lp_sections_id: string
  lessone_plan_id: string // Note: There's a typo in the schema column name
  order: number
  lp_section_names_id: string | null
  published: string
  section_name?: string // For display purposes
}

interface Focus {
  lp_focus_id: string
  lp_focus: string
}

interface Activity {
  activity_id: string
  lesson_id: string
  order: number
  published: string
  name: string
}

// Update the Direction interface to include an optional activity_id field
interface Direction {
  lp_directions_id: string
  lesson_plan_id: string
  lp_sections_id: string
  lp_focus_id: string
  activity_id?: string | null
  time: number
  published: string
  directions: string
  slide_image: string
  alt?: string
  support?: string
  answers?: string
  order: string
  focus_name?: string // For display purposes
  activity_name?: string // For display purposes
  preview?: string // For image preview
  isNew?: boolean // Flag to track new directions that haven't been saved to the database
}

export default function LessonPlanSectionsPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const subjectSlug = params.slug as string
  const lessonSlug = params.lessonSlug as string

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [sectionNames, setSectionNames] = useState<SectionName[]>([])
  const [focuses, setFocuses] = useState<Focus[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [directions, setDirections] = useState<Record<string, Direction[]>>({}) // Keyed by section ID
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [directionsLoaded, setDirectionsLoaded] = useState(false) // Track if directions have been loaded

  // Modals
  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false)
  const [selectedSectionNameId, setSelectedSectionNameId] = useState<string>("")
  const [newSectionPublished, setNewSectionPublished] = useState<string>("No")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null)
  const [editSectionDialogOpen, setEditSectionDialogOpen] = useState(false)
  const [sectionToEdit, setSectionToEdit] = useState<Section | null>(null)
  const [editSectionNameId, setEditSectionNameId] = useState<string>("")
  const [editSectionPublished, setEditSectionPublished] = useState<string>("No")

  // Direction modals
  const [addDirectionDialogOpen, setAddDirectionDialogOpen] = useState(false)
  const [currentSectionId, setCurrentSectionId] = useState<string>("")
  const [newDirection, setNewDirection] = useState<Partial<Direction>>({
    published: "No",
    time: 1, // Changed from 5 to 1
    directions: "",
    slide_image: "",
    alt: "",
    support: "",
    answers: "",
    order: "1",
    activity_id: null,
  })
  const [deleteDirectionConfirmOpen, setDeleteDirectionConfirmOpen] = useState(false)
  const [directionToDelete, setDirectionToDelete] = useState<Direction | null>(null)
  const [editDirectionDialogOpen, setEditDirectionDialogOpen] = useState(false)
  const [directionToEdit, setDirectionToEdit] = useState<Direction | null>(null)

  const fetchSections = async (lessonPlanId: string) => {
    try {
      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("lp_sections")
        .select("*")
        .eq("lessone_plan_id", lessonPlanId) // Note the typo in column name
        .order("order", { ascending: true })

      if (sectionsError) throw sectionsError

      // Fetch section names for display
      const sectionNameIds = sectionsData
        .map((section) => section.lp_section_names_id)
        .filter((id) => id !== null) as string[]

      if (sectionNameIds.length > 0) {
        const { data: namesData, error: namesError } = await supabase
          .from("lp_section_names")
          .select("*")
          .in("lp_section_name_id", sectionNameIds)

        if (namesError) throw namesError

        // Create a map of section name IDs to section names
        const sectionNameMap = namesData.reduce(
          (map, item) => {
            map[item.lp_section_name_id] = item.section_name
            return map
          },
          {} as Record<string, string>,
        )

        // Add section names to sections
        const sectionsWithNames = sectionsData.map((section) => ({
          ...section,
          section_name: section.lp_section_names_id ? sectionNameMap[section.lp_section_names_id] : "Unknown Section",
        }))

        setSections(sectionsWithNames)

        // Initialize directions for each section
        const initialDirections: Record<string, Direction[]> = {}
        sectionsWithNames.forEach((section) => {
          initialDirections[section.lp_sections_id] = []
        })
        setDirections(initialDirections)

        // Fetch directions for each section
        const directionsPromises = sectionsWithNames.map((section) =>
          fetchDirections(lessonPlanId, section.lp_sections_id),
        )

        await Promise.all(directionsPromises)
        setDirectionsLoaded(true)
      } else {
        setSections(sectionsData)
        setDirectionsLoaded(true)
      }
    } catch (error) {
      console.error("Error fetching sections:", error)
      setDirectionsLoaded(true)
    }
  }

  const refreshSignedUrls = async (directionsData: Direction[]) => {
    const updatedDirections = [...directionsData]

    for (let i = 0; i < updatedDirections.length; i++) {
      const direction = updatedDirections[i]
      if (direction.slide_image) {
        // Extract the path from the URL
        const urlParts = direction.slide_image.split("/")
        const pathParts = urlParts[urlParts.length - 1].split("?")[0].split(".")
        const fileExt = pathParts[pathParts.length - 1]
        const fileName = urlParts[urlParts.length - 1].split("?")[0]

        // Check if this is already a signed URL or a public URL
        if (!direction.slide_image.includes("token=")) {
          try {
            // Create a new signed URL
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from("media")
              .createSignedUrl(`slides/${fileName}`, 60 * 60 * 24 * 365) // 1 year expiration

            if (!signedUrlError && signedUrlData) {
              updatedDirections[i] = {
                ...direction,
                slide_image: signedUrlData.signedUrl,
              }
            }
          } catch (error) {
            console.error("Error refreshing signed URL:", error)
          }
        }
      }
    }

    return updatedDirections
  }

  const fetchDirections = async (lessonPlanId: string, sectionId: string) => {
    try {
      const { data: directionsData, error: directionsError } = await supabase
        .from("lp_directions")
        .select("*")
        .eq("lesson_plan_id", lessonPlanId)
        .eq("lp_sections_id", sectionId)
        .order("order", { ascending: true })

      if (directionsError) throw directionsError

      // Refresh signed URLs for any existing images
      const directionsWithRefreshedUrls = await refreshSignedUrls(directionsData)

      // Fetch focus names for display
      const focusIds = directionsWithRefreshedUrls
        .map((direction) => direction.lp_focus_id)
        .filter((id) => id !== null) as string[]

      // Fetch activity names for display
      const activityIds = directionsWithRefreshedUrls
        .map((direction) => direction.activity_id)
        .filter((id): id is string => id !== null)

      let focusMap: Record<string, string> = {}
      let activityMap: Record<string, string> = {}

      if (focusIds.length > 0) {
        const { data: focusData, error: focusError } = await supabase
          .from("lp_focus")
          .select("*")
          .in("lp_focus_id", focusIds)

        if (focusError) throw focusError

        // Create a map of focus IDs to focus names
        focusMap = focusData.reduce(
          (map, item) => {
            map[item.lp_focus_id] = item.lp_focus
            return map
          },
          {} as Record<string, string>,
        )
      }

      if (activityIds.length > 0) {
        const { data: activityData, error: activityError } = await supabase
          .from("activities")
          .select("*")
          .in("activity_id", activityIds)

        if (activityError) throw activityError

        // Create a map of activity IDs to activity names
        activityMap = activityData.reduce(
          (map, item) => {
            map[item.activity_id] = item.name
            return map
          },
          {} as Record<string, string>,
        )
      }

      // Add focus and activity names to directions
      const directionsWithNames = directionsWithRefreshedUrls.map((direction) => ({
        ...direction,
        focus_name: direction.lp_focus_id ? focusMap[direction.lp_focus_id] : "Unknown Focus",
        activity_name: direction.activity_id ? activityMap[direction.activity_id] : undefined,
      }))

      setDirections((prev) => ({
        ...prev,
        [sectionId]: directionsWithNames,
      }))
    } catch (error) {
      console.error("Error fetching directions:", error)
    }
  }

  const fetchSectionNames = async () => {
    try {
      const { data, error } = await supabase
        .from("lp_section_names")
        .select("*")
        .order("section_name", { ascending: true })

      if (error) throw error

      setSectionNames(data || [])
    } catch (error) {
      console.error("Error fetching section names:", error)
    }
  }

  const fetchFocuses = async () => {
    try {
      const { data, error } = await supabase.from("lp_focus").select("*").order("lp_focus", { ascending: true })

      if (error) throw error

      setFocuses(data || [])
    } catch (error) {
      console.error("Error fetching focuses:", error)
    }
  }

  const fetchActivities = async (lessonId: string) => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("name", { ascending: true })

      if (error) throw error

      setActivities(data || [])
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

        // Fetch section names for dropdowns
        await fetchSectionNames()

        // Fetch focuses for dropdowns
        await fetchFocuses()

        // Fetch subject data by slug
        const { data: subjectsData, error: subjectsError } = await supabase.from("subjects").select("subject_id, name")

        if (subjectsError) {
          console.error("Error fetching subjects:", subjectsError)
          router.push("/lesson-plans")
          return
        }

        // Find the subject with the matching slug
        const foundSubject = subjectsData.find((subject) => {
          const slug = generateSlug(subject.name)
          return slug === subjectSlug
        })

        if (!foundSubject) {
          console.error("Subject not found with slug:", subjectSlug)
          router.push("/lesson-plans")
          return
        }

        setSubject(foundSubject)

        // Fetch lesson plans for this subject
        const { data: lessonPlansData, error: lessonPlansError } = await supabase
          .from("lesson_plans")
          .select("lesson_plan_id, lesson_id, subject_id")
          .eq("subject_id", foundSubject.subject_id)

        if (lessonPlansError) {
          console.error("Error fetching lesson plans:", lessonPlansError)
          router.push(`/lesson-plan/${subjectSlug}`)
          return
        }

        // Get all unique lesson_ids to fetch their names
        const lessonIds = lessonPlansData.map((plan) => plan.lesson_id).filter((id): id is string => id !== null)

        // Fetch lesson names
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons")
          .select("lesson_id, lesson_name")
          .in("lesson_id", lessonIds.length > 0 ? lessonIds : ["no-lessons"])

        if (lessonsError && lessonIds.length > 0) {
          console.error("Error fetching lessons:", lessonsError)
        }

        // Create a map of lesson_id to lesson_name for easy lookup
        const lessonMap =
          lessonsData?.reduce(
            (map, lesson) => {
              map[lesson.lesson_id] = lesson.lesson_name
              return map
            },
            {} as Record<string, string>,
          ) || {}

        // Find the lesson plan with the matching lesson slug
        const foundLessonPlan = lessonPlansData.find((plan) => {
          if (!plan.lesson_id) return false
          const lessonName = lessonMap[plan.lesson_id] || "unnamed-lesson"
          const slug = generateSlug(lessonName)
          return slug === lessonSlug
        })

        if (!foundLessonPlan) {
          console.error("Lesson plan not found with lesson slug:", lessonSlug)
          router.push(`/lesson-plan/${subjectSlug}`)
          return
        }

        // Add lesson_name to the lesson plan
        const lessonPlanWithName = {
          ...foundLessonPlan,
          lesson_name: foundLessonPlan.lesson_id
            ? lessonMap[foundLessonPlan.lesson_id] || "Unnamed Lesson"
            : "Unnamed Lesson",
        }

        setLessonPlan(lessonPlanWithName)

        // Fetch activities for this lesson
        if (foundLessonPlan.lesson_id) {
          await fetchActivities(foundLessonPlan.lesson_id)
        }

        // Fetch sections for this lesson plan
        await fetchSections(foundLessonPlan.lesson_plan_id)
        setDataLoaded(true)
      } catch (error) {
        console.error("Error in loadUserAndData:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndData()
  }, [router, subjectSlug, lessonSlug])

  // Debug logging to help identify issues
  useEffect(() => {
    console.log("Sections:", sections)
    console.log("Directions:", directions)
    console.log("Directions loaded:", directionsLoaded)
    console.log("Activities:", activities)
  }, [sections, directions, directionsLoaded, activities])

  const handleBack = () => {
    router.push(`/lesson-plan/${subjectSlug}`)
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination, type } = result

    // Handle section reordering
    if (type === "section") {
      const items = Array.from(sections)
      const [reorderedItem] = items.splice(source.index, 1)
      items.splice(destination.index, 0, reorderedItem)

      // Update order property
      const updatedItems = items.map((item, index) => ({
        ...item,
        order: index + 1,
      }))

      setSections(updatedItems)
    }
    // Handle direction reordering within a section
    else if (type === "direction") {
      const sectionId = source.droppableId
      const sourceDirections = [...directions[sectionId]]
      const [movedDirection] = sourceDirections.splice(source.index, 1)
      sourceDirections.splice(destination.index, 0, movedDirection)

      // Update order property for directions
      const updatedDirections = sourceDirections.map((direction, index) => ({
        ...direction,
        order: (index + 1).toString(),
      }))

      setDirections({
        ...directions,
        [sectionId]: updatedDirections,
      })
    }
  }

  const handleAddSection = () => {
    setSelectedSectionNameId("")
    setNewSectionPublished("No")
    setAddSectionDialogOpen(true)
  }

  const handleCreateSection = () => {
    if (!lessonPlan || !selectedSectionNameId) {
      toast({
        title: "Error",
        description: "Please select a section name",
        variant: "destructive",
      })
      return
    }

    const newSectionId = uuidv4()
    const selectedSectionName = sectionNames.find((sn) => sn.lp_section_name_id === selectedSectionNameId)

    const newSection: Section = {
      lp_sections_id: newSectionId,
      lessone_plan_id: lessonPlan.lesson_plan_id,
      order: sections.length + 1,
      lp_section_names_id: selectedSectionNameId,
      published: newSectionPublished,
      section_name: selectedSectionName?.section_name || "Unknown Section",
    }

    setSections([...sections, newSection])

    // Initialize empty directions array for the new section
    setDirections((prev) => ({
      ...prev,
      [newSectionId]: [],
    }))

    setAddSectionDialogOpen(false)
  }

  const handleDeleteSection = (section: Section) => {
    setSectionToDelete(section)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return

    setSaving(true)

    try {
      // Delete all directions for this section first
      if (directions[sectionToDelete.lp_sections_id]?.length > 0) {
        const { error: directionsError } = await supabase
          .from("lp_directions")
          .delete()
          .eq("lp_sections_id", sectionToDelete.lp_sections_id)

        if (directionsError) throw directionsError
      }

      // Delete the section
      const { error } = await supabase.from("lp_sections").delete().eq("lp_sections_id", sectionToDelete.lp_sections_id)

      if (error) throw error

      // Remove from state
      const updatedSections = sections.filter((s) => s.lp_sections_id !== sectionToDelete.lp_sections_id)

      // Recalculate order for remaining sections
      const reorderedSections = updatedSections.map((section, index) => ({
        ...section,
        order: index + 1,
      }))

      setSections(reorderedSections)

      // Remove directions for this section
      const newDirections = { ...directions }
      delete newDirections[sectionToDelete.lp_sections_id]
      setDirections(newDirections)

      toast({
        title: "Success",
        description: "Section deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting section:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete section",
        variant: "destructive",
      })
    } finally {
      // Close dialog
      setDeleteConfirmOpen(false)
      setSectionToDelete(null)
      setSaving(false)
    }
  }

  const handleEditSection = (section: Section) => {
    setSectionToEdit(section)
    setEditSectionNameId(section.lp_section_names_id || "")
    setEditSectionPublished(section.published || "No")
    setEditSectionDialogOpen(true)
  }

  const handleSaveSection = () => {
    if (!sectionToEdit || !editSectionNameId) {
      toast({
        title: "Error",
        description: "Please select a section name",
        variant: "destructive",
      })
      return
    }

    const selectedSectionName = sectionNames.find((sn) => sn.lp_section_name_id === editSectionNameId)

    // Update the section in the state
    setSections(
      sections.map((section) =>
        section.lp_sections_id === sectionToEdit.lp_sections_id
          ? {
              ...section,
              lp_section_names_id: editSectionNameId,
              published: editSectionPublished,
              section_name: selectedSectionName?.section_name || "Unknown Section",
            }
          : section,
      ),
    )

    // Close the dialog
    setEditSectionDialogOpen(false)
    setSectionToEdit(null)
  }

  const handleAddDirection = (sectionId: string) => {
    setCurrentSectionId(sectionId)
    setNewDirection({
      published: "No",
      time: 1, // Changed from 5 to 1
      directions: "",
      slide_image: "",
      alt: "",
      support: "",
      answers: "",
      order: "1", // This will be updated when saving all sections
      lp_focus_id: focuses.length > 0 ? focuses[0].lp_focus_id : "",
      activity_id: null, // Initialize with null
    })
    setAddDirectionDialogOpen(true)
  }

  // Update the handleCreateDirection function to add new directions to the end
  const handleCreateDirection = () => {
    if (!lessonPlan || !currentSectionId || !newDirection.lp_focus_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const newDirectionId = uuidv4()
    const selectedFocus = focuses.find((f) => f.lp_focus_id === newDirection.lp_focus_id)
    const selectedActivity = newDirection.activity_id
      ? activities.find((a) => a.activity_id === newDirection.activity_id)
      : null
    const currentDirections = directions[currentSectionId] || []

    // Calculate the next order number based on existing directions
    const nextOrder =
      currentDirections.length > 0 ? Math.max(...currentDirections.map((d) => Number.parseInt(d.order))) + 1 : 1

    const directionToCreate: Direction = {
      lp_directions_id: newDirectionId,
      lesson_plan_id: lessonPlan.lesson_plan_id,
      lp_sections_id: currentSectionId,
      lp_focus_id: newDirection.lp_focus_id,
      activity_id: newDirection.activity_id || null,
      time: newDirection.time || 5,
      published: newDirection.published || "No",
      directions: newDirection.directions || "",
      slide_image: newDirection.slide_image || "",
      alt: newDirection.alt || "",
      support: newDirection.support || "",
      answers: newDirection.answers || "",
      order: nextOrder.toString(), // Set order to be at the end
      focus_name: selectedFocus?.lp_focus || "Unknown Focus",
      activity_name: selectedActivity?.name,
      preview: newDirection.preview,
      isNew: true, // Mark as new so we know to insert it when saving
    }

    // Update state to add the new direction to the end
    setDirections((prev) => {
      const currentDirections = prev[currentSectionId] || []
      return {
        ...prev,
        [currentSectionId]: [...currentDirections, directionToCreate],
      }
    })

    // Automatically expand the section to show the new direction
    setExpandedSections((prev) => ({
      ...prev,
      [currentSectionId]: true,
    }))

    toast({
      title: "Success",
      description: "Direction added. Remember to click 'Save Sections' to save all changes.",
    })

    // Close dialog
    setAddDirectionDialogOpen(false)
  }

  // Add a function to handle image upload
  const handleImageUpload = async (file: File, type: "new" | "edit") => {
    if (!file) return

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `slides/${fileName}`

      // Upload file to Supabase Storage using the 'media' bucket
      const { error: uploadError, data } = await supabase.storage.from("media").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) throw uploadError

      // Get signed URL with authentication instead of public URL
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("media")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year expiration

      if (signedUrlError) throw signedUrlError

      const signedUrl = signedUrlData.signedUrl

      // Update state based on whether we're editing or creating
      if (type === "new") {
        setNewDirection({
          ...newDirection,
          slide_image: signedUrl,
          preview: URL.createObjectURL(file),
        })
      } else if (type === "edit" && directionToEdit) {
        setDirectionToEdit({
          ...directionToEdit,
          slide_image: signedUrl,
          preview: URL.createObjectURL(file),
        })
      }

      return signedUrl
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
      return null
    }
  }

  // Update the handleEditDirection function to include preview
  const handleEditDirection = (direction: Direction) => {
    // If the direction has a slide_image but no preview, create a preview
    const directionWithPreview = {
      ...direction,
      preview: direction.slide_image || undefined,
    }
    setDirectionToEdit(directionWithPreview)
    setEditDirectionDialogOpen(true)
  }

  // Update handleSaveDirection to only update state, not save to DB
  const handleSaveDirection = () => {
    if (!directionToEdit) return

    const selectedFocus = focuses.find((f) => f.lp_focus_id === directionToEdit.lp_focus_id)
    const selectedActivity = directionToEdit.activity_id
      ? activities.find((a) => a.activity_id === directionToEdit.activity_id)
      : null

    // Update state only, don't save to database yet
    setDirections((prev) => {
      const sectionDirections = prev[directionToEdit.lp_sections_id] || []
      return {
        ...prev,
        [directionToEdit.lp_sections_id]: sectionDirections.map((d) =>
          d.lp_directions_id === directionToEdit.lp_directions_id
            ? {
                ...directionToEdit,
                focus_name: selectedFocus?.lp_focus || "Unknown Focus",
                activity_name: selectedActivity?.name,
                // If it was already marked as new, keep that flag
                isNew: d.isNew || false,
              }
            : d,
        ),
      }
    })

    toast({
      title: "Success",
      description: "Direction updated. Remember to click 'Save Sections' to save all changes.",
    })

    // Close dialog
    setEditDirectionDialogOpen(false)
    setDirectionToEdit(null)
  }

  const handleDeleteDirection = (direction: Direction) => {
    setDirectionToDelete(direction)
    setDeleteDirectionConfirmOpen(true)
  }

  const confirmDeleteDirection = () => {
    if (!directionToDelete) return

    // If it's a new direction that hasn't been saved to the database yet,
    // we can just remove it from state
    setDirections((prev) => {
      const sectionDirections = prev[directionToDelete.lp_sections_id] || []
      return {
        ...prev,
        [directionToDelete.lp_sections_id]: sectionDirections.filter(
          (d) => d.lp_directions_id !== directionToDelete.lp_directions_id,
        ),
      }
    })

    toast({
      title: "Success",
      description: "Direction deleted. Remember to click 'Save Sections' to save all changes.",
    })

    // Close dialog
    setDeleteDirectionConfirmOpen(false)
    setDirectionToDelete(null)
  }

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const handleSaveLessonPlan = async () => {
    if (!lessonPlan) return

    setSaving(true)

    try {
      // Recalculate section orders based on their current position in the array
      const updatedSections = sections.map((section, index) => ({
        ...section,
        order: index + 1, // Ensure order starts at 1 and increments sequentially
      }))

      // Update the state with the corrected orders
      setSections(updatedSections)

      // Process each section
      for (const section of updatedSections) {
        // Check if this is a new section (not yet in the database)
        const { data: existingSection } = await supabase
          .from("lp_sections")
          .select("lp_sections_id")
          .eq("lp_sections_id", section.lp_sections_id)
          .single()

        if (!existingSection) {
          // Insert new section
          const { error: insertError } = await supabase.from("lp_sections").insert({
            lp_sections_id: section.lp_sections_id,
            lessone_plan_id: lessonPlan.lesson_plan_id,
            order: section.order,
            lp_section_names_id: section.lp_section_names_id,
            published: section.published || "No",
          })

          if (insertError) throw insertError
        } else {
          // Update existing section
          const { error: updateError } = await supabase
            .from("lp_sections")
            .update({
              order: section.order,
              lp_section_names_id: section.lp_section_names_id,
              published: section.published || "No",
            })
            .eq("lp_sections_id", section.lp_sections_id)

          if (updateError) throw updateError
        }

        // Process directions for this section
        const sectionDirections = directions[section.lp_sections_id] || []

        // Update order for all directions in this section
        const orderedDirections = sectionDirections.map((direction, index) => ({
          ...direction,
          order: (index + 1).toString(),
        }))

        // Save directions to state with updated orders
        setDirections((prev) => ({
          ...prev,
          [section.lp_sections_id]: orderedDirections,
        }))

        // Process each direction
        for (const direction of orderedDirections) {
          // Remove the isNew, preview, focus_name, and activity_name properties before saving to database
          const { isNew, preview, focus_name, activity_name, ...directionToSave } = direction

          if (isNew) {
            // Insert new direction
            const { error: insertError } = await supabase.from("lp_directions").insert(directionToSave)

            if (insertError) throw insertError
          } else {
            // Update existing direction
            const { error: updateError } = await supabase
              .from("lp_directions")
              .update(directionToSave)
              .eq("lp_directions_id", direction.lp_directions_id)

            if (updateError) throw updateError
          }
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
      await fetchSections(lessonPlan.lesson_plan_id)
    } catch (error: any) {
      console.error("Error saving lesson plan sections:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save lesson plan sections",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Add a function to handle duplicating a direction
  const handleDuplicateDirection = (direction: Direction) => {
    // Create a copy without the ID and mark as new
    const duplicatedDirection = {
      ...direction,
      lp_directions_id: "", // Empty ID so it will be treated as new
      directions: `${direction.directions} (Copy)`, // Add (Copy) to indicate it's a duplicate
      preview: direction.slide_image || undefined,
    }

    // Set as the direction to edit
    setDirectionToEdit(duplicatedDirection)
    setEditDirectionDialogOpen(true)
  }

  if (loading && !dataLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pelican"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!subject || !lessonPlan) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-4 w-full p-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={handleBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Lesson Plan Not Found</h1>
          </div>
          <p className="text-muted-foreground">The requested lesson plan could not be found.</p>
        </div>
      </DashboardLayout>
    )
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
              <h1 className="text-3xl font-bold tracking-tight">{lessonPlan.lesson_name || "Untitled Lesson"}</h1>
              <p className="text-muted-foreground">{subject.name} &gt; Sections</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddSection}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
            <Button onClick={handleSaveLessonPlan} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Sections"}
            </Button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections" type="section">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {sections.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed rounded-md">
                    <p className="text-muted-foreground">Click "Add Section" to create your first section</p>
                  </div>
                ) : (
                  sections.map((section, index) => (
                    <Draggable key={section.lp_sections_id} draggableId={section.lp_sections_id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="border rounded-md bg-card"
                        >
                          <div className="p-4 border-b flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="mr-4">
                                <p className="text-md font-medium">{section.section_name}</p>
                              </div>
                              <span
                                className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                  section.published === "Yes"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {section.published === "Yes" ? "Published" : "Draft"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddDirection(section.lp_sections_id)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Directions
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditSection(section)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteSection(section)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSectionExpanded(section.lp_sections_id)}
                              >
                                {expandedSections[section.lp_sections_id] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          {expandedSections[section.lp_sections_id] && (
                            <div className="p-4 space-y-4">
                              {directions[section.lp_sections_id]?.length > 0 ? (
                                <Droppable droppableId={section.lp_sections_id} type="direction">
                                  {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                      {directions[section.lp_sections_id].map((direction, index) => (
                                        <Draggable
                                          key={direction.lp_directions_id}
                                          draggableId={direction.lp_directions_id}
                                          index={index}
                                        >
                                          {(provided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className="border rounded-md p-4"
                                            >
                                              <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-medium">{direction.focus_name}</span>
                                                  {direction.activity_name && (
                                                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                      {direction.activity_name}
                                                    </span>
                                                  )}
                                                  <span className="text-sm text-muted-foreground flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {direction.time} min
                                                  </span>
                                                  <span
                                                    className={`text-xs px-2 py-1 rounded-full ${
                                                      direction.published === "Yes"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                    }`}
                                                  >
                                                    {direction.published === "Yes" ? "Published" : "Draft"}
                                                  </span>
                                                  {direction.isNew && (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                      Unsaved
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="flex gap-2">
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditDirection(direction)}
                                                  >
                                                    <Pencil className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDuplicateDirection(direction)}
                                                  >
                                                    <Copy className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteDirection(direction)}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                              <div className="flex flex-col md:flex-row gap-4 mt-4">
                                                {direction.slide_image ? (
                                                  <div className="md:w-1/3 flex-shrink-0">
                                                    <div
                                                      className="relative w-full h-auto rounded-md overflow-hidden"
                                                      style={{ aspectRatio: "16/9" }}
                                                    >
                                                      <Image
                                                        src={direction.slide_image || "/placeholder.svg"}
                                                        alt={direction.alt || "Slide image"}
                                                        fill
                                                        style={{ objectFit: "cover" }}
                                                      />
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div
                                                    className="hidden md:block md:w-1/3 flex-shrink-0 bg-gray-100 rounded-md"
                                                    style={{ aspectRatio: "16/9" }}
                                                  >
                                                    <div className="flex items-center justify-center h-full text-gray-400">
                                                      No image
                                                    </div>
                                                  </div>
                                                )}
                                                <div className="flex-1">
                                                  <div className="prose max-w-none">
                                                    <p className="whitespace-pre-wrap">{direction.directions}</p>
                                                  </div>
                                                  {(direction.support || direction.answers) && (
                                                    <div className="mt-4 space-y-2">
                                                      {direction.support && (
                                                        <div>
                                                          <h4 className="text-sm font-medium">Support:</h4>
                                                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                            {direction.support}
                                                          </p>
                                                        </div>
                                                      )}
                                                      {direction.answers && (
                                                        <div>
                                                          <h4 className="text-sm font-medium">Answers:</h4>
                                                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                            {direction.answers}
                                                          </p>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              ) : (
                                <div className="text-center py-10 border-2 border-dashed rounded-md">
                                  <p className="text-muted-foreground">
                                    Click "Directions" to create your first direction
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
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

        {/* Add Section Dialog */}
        {/* Delete Section Confirmation Dialog */}
        {/* Edit Section Dialog */}

        {/* Add Direction Dialog */}
        {/* Delete Direction Confirmation Dialog */}
        {/* Edit Direction Dialog */}
      </div>

      {/* Add Section Dialog */}
      <Dialog open={addSectionDialogOpen} onOpenChange={setAddSectionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
            <DialogDescription>Add a new section to this lesson plan.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Section Name
              </Label>
              <Select onValueChange={(value) => setSelectedSectionNameId(value)} defaultValue={selectedSectionNameId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a section name" />
                </SelectTrigger>
                <SelectContent>
                  {sectionNames.map((sectionName) => (
                    <SelectItem key={sectionName.lp_section_name_id} value={sectionName.lp_section_name_id}>
                      {sectionName.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="published" className="text-right">
                Published
              </Label>
              <Select onValueChange={(value) => setNewSectionPublished(value)} defaultValue={newSectionPublished}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAddSectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateSection}>
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this section? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" onClick={confirmDeleteSection} disabled={saving}>
              {saving ? "Deleting..." : "Delete Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={editSectionDialogOpen} onOpenChange={setEditSectionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>Edit this section.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Section Name
              </Label>
              <Select onValueChange={(value) => setEditSectionNameId(value)} defaultValue={editSectionNameId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a section name" />
                </SelectTrigger>
                <SelectContent>
                  {sectionNames.map((sectionName) => (
                    <SelectItem key={sectionName.lp_section_name_id} value={sectionName.lp_section_name_id}>
                      {sectionName.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="published" className="text-right">
                Published
              </Label>
              <Select onValueChange={(value) => setEditSectionPublished(value)} defaultValue={editSectionPublished}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditSectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveSection}>
              Save Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Direction Dialog */}
      <Dialog open={addDirectionDialogOpen} onOpenChange={setAddDirectionDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Add Direction</DialogTitle>
            <DialogDescription>Add a new direction to this section.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="focus" className="text-right col-span-1">
                Focus
              </Label>
              <Select
                onValueChange={(value) => setNewDirection({ ...newDirection, lp_focus_id: value })}
                defaultValue={newDirection.lp_focus_id}
              >
                <SelectTrigger className="col-span-5">
                  <SelectValue placeholder="Select a focus" />
                </SelectTrigger>
                <SelectContent>
                  {focuses.map((focus) => (
                    <SelectItem key={focus.lp_focus_id} value={focus.lp_focus_id}>
                      {focus.lp_focus}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="activity" className="text-right col-span-1">
                Activity
              </Label>
              <Select
                onValueChange={(value) => setNewDirection({ ...newDirection, activity_id: value })}
                defaultValue={newDirection.activity_id || ""}
              >
                <SelectTrigger className="col-span-5">
                  <SelectValue placeholder="Select an activity (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activities.map((activity) => (
                    <SelectItem key={activity.activity_id} value={activity.activity_id}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="time" className="text-right col-span-1">
                Time (minutes)
              </Label>
              <Input
                type="number"
                id="time"
                defaultValue={newDirection.time?.toString()}
                onChange={(e) => setNewDirection({ ...newDirection, time: Number.parseInt(e.target.value) })}
                className="col-span-5"
              />
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="published" className="text-right col-span-1">
                Published
              </Label>
              <Select
                onValueChange={(value) => setNewDirection({ ...newDirection, published: value })}
                defaultValue={newDirection.published}
              >
                <SelectTrigger className="col-span-5">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="directions" className="text-right col-span-1">
                Directions
              </Label>
              <Textarea
                id="directions"
                placeholder="Enter directions"
                className="col-span-5"
                onChange={(e) => setNewDirection({ ...newDirection, directions: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="slide_image" className="text-right col-span-1">
                Slide Image
              </Label>
              <div className="col-span-5">
                <FileUpload
                  endpoint="mediaUploader"
                  value={newDirection.slide_image ? [newDirection.slide_image] : []}
                  onChange={async (urls) => {
                    if (urls && urls.length > 0) {
                      setNewDirection({
                        ...newDirection,
                        slide_image: urls[0],
                        preview: urls[0],
                      })
                    }
                  }}
                  onUploadComplete={async (res) => {
                    if (res && res.url) {
                      setNewDirection({
                        ...newDirection,
                        slide_image: res.url,
                        preview: res.url,
                      })
                    }
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="alt" className="text-right col-span-1">
                Alt Text
              </Label>
              <Input
                type="text"
                id="alt"
                placeholder="Enter alt text"
                className="col-span-5"
                onChange={(e) => setNewDirection({ ...newDirection, alt: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="support" className="text-right col-span-1">
                Support
              </Label>
              <Textarea
                id="support"
                placeholder="Enter support text"
                className="col-span-5"
                onChange={(e) => setNewDirection({ ...newDirection, support: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="answers" className="text-right col-span-1">
                Answers
              </Label>
              <Textarea
                id="answers"
                placeholder="Enter answers"
                className="col-span-5"
                onChange={(e) => setNewDirection({ ...newDirection, answers: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAddDirectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateDirection}>
              Add Direction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Direction Confirmation Dialog */}
      <Dialog open={deleteDirectionConfirmOpen} onOpenChange={setDeleteDirectionConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Direction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this direction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDeleteDirectionConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" onClick={confirmDeleteDirection}>
              Delete Direction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Direction Dialog */}
      <Dialog open={editDirectionDialogOpen} onOpenChange={setEditDirectionDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Direction</DialogTitle>
            <DialogDescription>Edit this direction.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="focus" className="text-right col-span-1">
                Focus
              </Label>
              <Select
                onValueChange={(value) => setDirectionToEdit({ ...directionToEdit, lp_focus_id: value })}
                defaultValue={directionToEdit?.lp_focus_id}
              >
                <SelectTrigger className="col-span-5">
                  <SelectValue placeholder="Select a focus" />
                </SelectTrigger>
                <SelectContent>
                  {focuses.map((focus) => (
                    <SelectItem key={focus.lp_focus_id} value={focus.lp_focus_id}>
                      {focus.lp_focus}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="activity" className="text-right col-span-1">
                Activity
              </Label>
              <Select
                onValueChange={(value) => setDirectionToEdit({ ...directionToEdit, activity_id: value || null })}
                defaultValue={directionToEdit?.activity_id || ""}
              >
                <SelectTrigger className="col-span-5">
                  <SelectValue placeholder="Select an activity (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activities.map((activity) => (
                    <SelectItem key={activity.activity_id} value={activity.activity_id}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="time" className="text-right col-span-1">
                Time (minutes)
              </Label>
              <Input
                type="number"
                id="time"
                defaultValue={directionToEdit?.time?.toString()}
                onChange={(e) => setDirectionToEdit({ ...directionToEdit, time: Number.parseInt(e.target.value) })}
                className="col-span-5"
              />
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="published" className="text-right col-span-1">
                Published
              </Label>
              <Select
                onValueChange={(value) => setDirectionToEdit({ ...directionToEdit, published: value })}
                defaultValue={directionToEdit?.published}
              >
                <SelectTrigger className="col-span-5">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="directions" className="text-right col-span-1">
                Directions
              </Label>
              <Textarea
                id="directions"
                placeholder="Enter directions"
                className="col-span-5"
                defaultValue={directionToEdit?.directions}
                onChange={(e) => setDirectionToEdit({ ...directionToEdit, directions: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="slide_image" className="text-right col-span-1">
                Slide Image
              </Label>
              <div className="col-span-5">
                <FileUpload
                  endpoint="mediaUploader"
                  value={directionToEdit?.slide_image ? [directionToEdit.slide_image] : []}
                  onChange={async (urls) => {
                    if (urls && urls.length > 0 && directionToEdit) {
                      setDirectionToEdit({
                        ...directionToEdit,
                        slide_image: urls[0],
                        preview: urls[0],
                      })
                    }
                  }}
                  onUploadComplete={async (res) => {
                    if (res && res.url && directionToEdit) {
                      setDirectionToEdit({
                        ...directionToEdit,
                        slide_image: res.url,
                        preview: res.url,
                      })
                    }
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="alt" className="text-right col-span-1">
                Alt Text
              </Label>
              <Input
                type="text"
                id="alt"
                placeholder="Enter alt text"
                className="col-span-5"
                defaultValue={directionToEdit?.alt}
                onChange={(e) => setDirectionToEdit({ ...directionToEdit, alt: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="support" className="text-right col-span-1">
                Support
              </Label>
              <Textarea
                id="support"
                placeholder="Enter support text"
                className="col-span-5"
                defaultValue={directionToEdit?.support}
                onChange={(e) => setDirectionToEdit({ ...directionToEdit, support: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-6 items-center gap-4">
              <Label htmlFor="answers" className="text-right col-span-1">
                Answers
              </Label>
              <Textarea
                id="answers"
                placeholder="Enter answers"
                className="col-span-5"
                defaultValue={directionToEdit?.answers}
                onChange={(e) => setDirectionToEdit({ ...directionToEdit, answers: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditDirectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveDirection}>
              Save Direction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
