"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import {
  ArrowLeft,
  FileText,
  HelpCircle,
  LayoutGrid,
  BookOpen,
  ImageIcon,
  BookPlus,
  LibraryBig,
  NotepadText,
  BookDown,
  Trash2,
  Pencil,
  Clock,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { ReadingActivityModal } from "@/components/curriculum/activities/reading-activity-modal"
import { SourceActivityModal } from "@/components/curriculum/activities/source-activity-modal"
import { QuestionActivityModal } from "@/components/curriculum/activities/question-activity-modal"
import { GraphicOrganizerModal } from "@/components/curriculum/activities/graphic-organizer-modal"
import { VocabularyActivityModal } from "@/components/curriculum/activities/vocabulary-activity-modal"
import { InTextSourceModal } from "@/components/curriculum/activities/in-text-source-modal"
import { ImageActivityModal } from "@/components/curriculum/activities/image-activity-modal"
import { useToast } from "@/hooks/use-toast"
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
import { ReadingAddonModal } from "@/components/curriculum/activities/reading-addon-modal"

// interfaces
interface Activity {
  id: string
  lesson_id: string
  type: string
  order: number
  created_at?: string
  updated_at?: string
}

interface Reading {
  id: string
  activity_id: string
  reading_title: string
  reading_text: string
  created_at?: string
  updated_at?: string
}

interface ReadingAddon {
  id: string
  activity_id: string
  reaing_text: string
  created_at?: string
  updated_at?: string
}

interface Source {
  id: string
  activity_id: string
  source_title_ce: string
  source_text_ce: string
  source_title_en?: string
  source_text_en?: string
  created_at?: string
  updated_at?: string
}

interface InTextSource {
  id: string
  activity_id: string
  source_title_ce: string
  source_text_ce: string
  source_title_en?: string
  source_text_en?: string
  created_at?: string
  updated_at?: string
}

interface Question {
  id: string
  activity_id: string
  question_title?: string
  question: string
  question_text: string
  question_type: string
  correct_answer: string
  incorrect_answers: string[]
  created_at?: string
  updated_at?: string
}

interface GraphicOrganizer {
  id: string
  activity_id: string
  template_type: string
  created_at?: string
  updated_at?: string
}

interface Vocabulary {
  id: string
  activity_id: string
  items: { term: string; definition: string }[]
  created_at?: string
  updated_at?: string
}

interface ImageActivity {
  id: string
  activity_id: string
  img_title: string
  img_url: string
  created_at?: string
  updated_at?: string
}

interface SubReading {
  id: string
  activity_id: string
  reading_title: string
  reading_text: string
  created_at?: string
  updated_at?: string
}

type ActivityType =
  | { id: string; type: "reading" }
  | { id: string; type: "reading_addon" }
  | { id: string; type: "source" }
  | { id: string; type: "in_text_source" }
  | { id: string; type: "question" }
  | { id: string; type: "graphic_organizer" }
  | { id: string; type: "vocabulary" }
  | { id: string; type: "image" }
  | { id: string; type: "sub_reading" }

export default function ActivitiesPage() {
  const router = useRouter()
  const params = useParams()
  const { slug, unitSlug, chapterSlug, lessonSlug } = params

  const [activities, setActivities] = useState<Activity[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null)
  const [activityTypeDetails, setActivityTypeDetails] = useState<{ [activityId: string]: any }>({})
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [lessonDetails, setLessonDetails] = useState<{ published: boolean } | null>(null)
  const [isTitleEditOpen, setIsTitleEditOpen] = useState(false)
  const [newLessonTitle, setNewLessonTitle] = useState("")
  const [isLessonTitlePublished, setIsLessonTitlePublished] = useState(false)

  const { toast } = useToast()

  const fetchActivities = async () => {
    if (!lessonSlug) return

    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("lesson_id", lessonSlug)
        .order("order", { ascending: true })

      if (error) {
        console.error("Error fetching activities:", error)
        return
      }

      setActivities(data)

      // Fetch details for each activity
      const details: { [activityId: string]: any } = {}
      for (const activity of data) {
        let detailData
        let detailError

        switch (activity.type) {
          case "reading":
            ;({ data: detailData, error: detailError } = await supabase
              .from("readings")
              .select("*")
              .eq("activity_id", activity.id)
              .single())
            break
          case "reading_addon":
            ;({ data: detailData, error: detailError } = await supabase
              .from("reading_addons")
              .select("*")
              .eq("activity_id", activity.id)
              .single())
            break
          case "source":
            ;({ data: detailData, error: detailError } = await supabase
              .from("sources")
              .select("*")
              .eq("activity_id", activity.id)
              .single())
            break
          case "in_text_source":
            ;({ data: detailData, error: detailError } = await supabase
              .from("in_text_sources")
              .select("*")
              .eq("activity_id", activity.id)
              .single())
            break
          case "question":
            ;({ data: detailData, error: detailError } = await supabase
              .from("questions")
              .select("*")
              .eq("activity_id", activity.id)
              .single())
            break
          case "graphic_organizer":
            ;({ data: detailData, error: detailError } = await supabase
              .from("graphic_organizers")
              .select("*")
              .eq("activity_id", activity.id)
              .single())
            break
          case "vocabulary":
            ;({ data: detailData, error: detailError } = await supabase
              .from("vocabularies")
              .select("*")
              .eq("activity_id", activity.id)
              .single())
            break
          case "image":
            ;({ data: detailData, error: detailError } = await supabase
              .from("image_activities")
              .select("*")
              .eq("activity_id", activity.id)
              .single())
            break
          case "sub_reading":
            ;({ data: detailData, error: detailError } = await supabase
              .from("sub_readings")
              .select("*")
              .eq("activity_id", activity.id)
              .single())
            break
          default:
            console.warn(`Unknown activity type: ${activity.type}`)
        }

        if (detailError) {
          console.error(`Error fetching details for activity ${activity.id}:`, detailError)
        } else if (detailData) {
          details[activity.id] = detailData
        }
      }

      setActivityTypeDetails(details)
    } catch (error) {
      console.error("Unexpected error fetching activities:", error)
    }
  }

  const fetchLessonDetails = async () => {
    if (!lessonSlug) return

    try {
      const { data, error } = await supabase.from("lessons").select("published, title").eq("id", lessonSlug).single()

      if (error) {
        console.error("Error fetching lesson details:", error)
        return
      }

      setLessonDetails(data)
      setIsPublished(data?.published || false)
      setNewLessonTitle(data?.title || "")
      setIsLessonTitlePublished(data?.published || false)
    } catch (error) {
      console.error("Unexpected error fetching lesson details:", error)
    }
  }

  useEffect(() => {
    fetchActivities()
    fetchLessonDetails()
  }, [lessonSlug])

  const handleOpenModal = (type: string) => {
    setSelectedActivityType(type)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setSelectedActivityType(null)
    setIsModalOpen(false)
  }

  const handleActivityCreated = (newActivity: Activity, activityDetails: any) => {
    setActivities((prevActivities) => {
      const updatedActivities = [...prevActivities, newActivity]
      return updatedActivities.sort((a, b) => a.order - b.order)
    })
    setActivityTypeDetails((prevDetails) => ({
      ...prevDetails,
      [newActivity.id]: activityDetails,
    }))
    handleCloseModal()
  }

  const handleActivityUpdated = (activityId: string, updatedDetails: any) => {
    setActivityTypeDetails((prevDetails) => ({
      ...prevDetails,
      [activityId]: updatedDetails,
    }))
  }

  const handleSaveOrder = async () => {
    setIsSavingOrder(true)
    try {
      const updates = activities.map((activity, index) => ({
        id: activity.id,
        order: index,
      }))

      const { error } = await supabase.from("activities").upsert(updates)

      if (error) {
        console.error("Error saving order:", error)
        toast({
          title: "Uh oh! Something went wrong.",
          description: "There was a problem saving the activity order.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success!",
          description: "Activity order saved successfully.",
        })
      }
    } finally {
      setIsSavingOrder(false)
    }
  }

  const handleDeleteActivity = async (activity: Activity) => {
    setActivityToDelete(activity)
    setIsDeleteAlertOpen(true)
  }

  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return

    try {
      const { error } = await supabase.from("activities").delete().eq("id", activityToDelete.id)

      if (error) {
        console.error("Error deleting activity:", error)
        toast({
          title: "Uh oh! Something went wrong.",
          description: "There was a problem deleting the activity.",
          variant: "destructive",
        })
      } else {
        setActivities((prevActivities) => prevActivities.filter((a) => a.id !== activityToDelete.id))
        setActivityTypeDetails((prevDetails) => {
          const { [activityToDelete.id]: deleted, ...rest } = prevDetails
          return rest
        })
        toast({
          title: "Success!",
          description: "Activity deleted successfully.",
        })
      }
    } finally {
      setIsDeleteAlertOpen(false)
      setActivityToDelete(null)
    }
  }

  const cancelDeleteActivity = () => {
    setIsDeleteAlertOpen(false)
    setActivityToDelete(null)
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) {
      return
    }

    const items = Array.from(activities)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setActivities(items)
  }

  const togglePublish = async () => {
    if (!lessonSlug) return

    try {
      const { error } = await supabase.from("lessons").update({ published: !isPublished }).eq("id", lessonSlug)

      if (error) {
        console.error("Error updating publish status:", error)
        toast({
          title: "Uh oh! Something went wrong.",
          description: "There was a problem updating the publish status.",
          variant: "destructive",
        })
      } else {
        setIsPublished(!isPublished)
        setLessonDetails((prevDetails) => ({
          ...prevDetails,
          published: !isPublished,
        }))
        toast({
          title: "Success!",
          description: `Lesson ${isPublished ? "unpublished" : "published"} successfully.`,
        })
      }
    } catch (error) {
      console.error("Unexpected error updating publish status:", error)
    }
  }

  const handleTitleEdit = () => {
    setIsTitleEditOpen(true)
  }

  const handleTitleSave = async () => {
    if (!lessonSlug) return

    try {
      const { error } = await supabase.from("lessons").update({ title: newLessonTitle }).eq("id", lessonSlug)

      if (error) {
        console.error("Error updating lesson title:", error)
        toast({
          title: "Uh oh! Something went wrong.",
          description: "There was a problem updating the lesson title.",
          variant: "destructive",
        })
      } else {
        setIsTitleEditOpen(false)
        setLessonDetails((prevDetails) => ({
          ...prevDetails,
          title: newLessonTitle,
        }))
        toast({
          title: "Success!",
          description: "Lesson title updated successfully.",
        })
      }
    } catch (error) {
      console.error("Unexpected error updating lesson title:", error)
    }
  }

  const handleTitleCancel = () => {
    setIsTitleEditOpen(false)
    setNewLessonTitle(lessonDetails?.title || "")
  }

  // Define getActivityTypeIcon only ONCE here
  const getActivityTypeIcon = (type: string) => {
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
      default:
        return null
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
      default:
        return "Unknown Type"
    }
  }

  // IMPORTANT: Remove the second declaration of getActivityTypeIcon that was here

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="space-x-2">
          <Button onClick={handleSaveOrder} disabled={isSavingOrder}>
            {isSavingOrder ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Order
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="space-x-2">
                <div>{isPublished ? "Published" : "Draft"}</div>
                {isPublished ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={togglePublish}>{isPublished ? "Unpublish" : "Publish"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4">
        {isTitleEditOpen ? (
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              placeholder="Enter lesson title"
            />
            <Button size="sm" onClick={handleTitleSave}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={handleTitleCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">{lessonDetails?.title || "Untitled Lesson"}</h1>
            <Button variant="ghost" size="icon" onClick={handleTitleEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Activities</h2>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="activities">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 mt-4">
                {activities.map((activity, index) => (
                  <Draggable key={activity.id} draggableId={activity.id} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-gray-100 rounded-md p-4 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-500">{index + 1}.</span>
                          {getActivityTypeIcon(activity.type)}
                          <div>{getActivityTypePreview({ id: activity.id, type: activity.type })}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {activity.type === "reading" && (
                                <DropdownMenuItem onClick={() => handleOpenModal("reading")}>
                                  Edit Reading
                                </DropdownMenuItem>
                              )}
                              {activity.type === "reading_addon" && (
                                <DropdownMenuItem onClick={() => handleOpenModal("reading_addon")}>
                                  Edit Reading Addon
                                </DropdownMenuItem>
                              )}
                              {activity.type === "source" && (
                                <DropdownMenuItem onClick={() => handleOpenModal("source")}>
                                  Edit Source
                                </DropdownMenuItem>
                              )}
                              {activity.type === "in_text_source" && (
                                <DropdownMenuItem onClick={() => handleOpenModal("in_text_source")}>
                                  Edit In-Text Source
                                </DropdownMenuItem>
                              )}
                              {activity.type === "question" && (
                                <DropdownMenuItem onClick={() => handleOpenModal("question")}>
                                  Edit Question
                                </DropdownMenuItem>
                              )}
                              {activity.type === "graphic_organizer" && (
                                <DropdownMenuItem onClick={() => handleOpenModal("graphic_organizer")}>
                                  Edit Graphic Organizer
                                </DropdownMenuItem>
                              )}
                              {activity.type === "vocabulary" && (
                                <DropdownMenuItem onClick={() => handleOpenModal("vocabulary")}>
                                  Edit Vocabulary
                                </DropdownMenuItem>
                              )}
                              {activity.type === "image" && (
                                <DropdownMenuItem onClick={() => handleOpenModal("image")}>Edit Image</DropdownMenuItem>
                              )}
                              {activity.type === "sub_reading" && (
                                <DropdownMenuItem onClick={() => handleOpenModal("sub_reading")}>
                                  Edit Sub Reading
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteActivity(activity)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the activity and remove its data from our
                servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDeleteActivity}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteActivity}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Add Activity</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="justify-start" onClick={() => handleOpenModal("reading")}>
            <FileText className="mr-2 h-4 w-4" />
            Reading
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleOpenModal("reading_addon")}>
            <BookPlus className="mr-2 h-4 w-4" />
            Reading Addon
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleOpenModal("source")}>
            <LibraryBig className="mr-2 h-4 w-4" />
            Source
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleOpenModal("in_text_source")}>
            <NotepadText className="mr-2 h-4 w-4" />
            In-Text Source
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleOpenModal("question")}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Question
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleOpenModal("graphic_organizer")}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Graphic Organizer
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleOpenModal("vocabulary")}>
            <BookOpen className="mr-2 h-4 w-4" />
            Vocabulary
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleOpenModal("image")}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Image
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleOpenModal("sub_reading")}>
            <BookDown className="mr-2 h-4 w-4" />
            Sub Reading
          </Button>
        </div>
      </div>

      {selectedActivityType === "reading" && (
        <ReadingActivityModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          lessonId={lessonSlug as string}
          onActivityCreated={handleActivityCreated}
        />
      )}

      {selectedActivityType === "reading_addon" && (
        <ReadingAddonModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          lessonId={lessonSlug as string}
          onActivityCreated={handleActivityCreated}
        />
      )}

      {selectedActivityType === "source" && (
        <SourceActivityModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          lessonId={lessonSlug as string}
          onActivityCreated={handleActivityCreated}
        />
      )}

      {selectedActivityType === "in_text_source" && (
        <InTextSourceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          lessonId={lessonSlug as string}
          onActivityCreated={handleActivityCreated}
        />
      )}

      {selectedActivityType === "question" && (
        <QuestionActivityModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          lessonId={lessonSlug as string}
          onActivityCreated={handleActivityCreated}
        />
      )}

      {selectedActivityType === "graphic_organizer" && (
        <GraphicOrganizerModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          lessonId={lessonSlug as string}
          onActivityCreated={handleActivityCreated}
        />
      )}

      {selectedActivityType === "vocabulary" && (
        <VocabularyActivityModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          lessonId={lessonSlug as string}
          onActivityCreated={handleActivityCreated}
        />
      )}

      {selectedActivityType === "image" && (
        <ImageActivityModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          lessonId={lessonSlug as string}
          onActivityCreated={handleActivityCreated}
        />
      )}

      {selectedActivityType === "sub_reading" && (
        <ReadingActivityModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          lessonId={lessonSlug as string}
          onActivityCreated={handleActivityCreated}
        />
      )}

      <Toaster />
    </DashboardLayout>
  )
}
