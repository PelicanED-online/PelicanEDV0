"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import type { QuizQuestion } from "@/types/quiz"
import { QuizQuestionForm } from "@/components/quiz-question-form"
import { useDropzone } from "react-dropzone"
import { useAuth } from "@/hooks/auth"
import { useParams } from "next/navigation"
import type { Activity, ActivityType, Lesson, Reading, Video, Image, Quiz, Assignment } from "@/types/curriculum"
import { Editor } from "@/components/editor"

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  activityType: ActivityType
  onSave: (activity: Activity) => void
  activity?: Activity
  lesson?: Lesson
}

export function ActivityModal({ isOpen, onClose, activityType, onSave, activity, lesson }: ActivityModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState("")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageUrl, setImageUrl] = useState("")
  const [imageTitle, setImageTitle] = useState("")
  const [imageDescription, setImageDescription] = useState("")
  const [descriptionTitle, setDescriptionTitle] = useState("")
  const router = useRouter()
  const { user } = useAuth()
  const params = useParams()

  const supabase = createClient()

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles)
    },
  })

  const readingSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    required: z.boolean().default(false),
  })

  const videoSchema = z.object({
    title: z.string().min(1, "Title is required"),
    url: z.string().url("Must be a valid URL"),
    required: z.boolean().default(false),
  })

  const imageSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    description_title: z.string().optional(),
    required: z.boolean().default(false),
  })

  const quizSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    required: z.boolean().default(false),
    passing_grade: z.coerce.number().min(0).max(100),
  })

  const assignmentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    required: z.boolean().default(false),
  })

  const getSchemaForActivityType = () => {
    switch (activityType) {
      case "reading":
      case "sub_reading":
        return readingSchema
      case "video":
        return videoSchema
      case "image":
        return imageSchema
      case "quiz":
        return quizSchema
      case "assignment":
        return assignmentSchema
      default:
        return z.object({})
    }
  }

  const form = useForm({
    resolver: zodResolver(getSchemaForActivityType()),
    defaultValues: {
      title: activity?.title || "",
      content: (activity as Reading)?.content || "",
      url: (activity as Video)?.url || "",
      description: (activity as Image | Quiz | Assignment)?.description || "",
      description_title: (activity as Image)?.description_title || "",
      required: activity?.required || false,
      passing_grade: (activity as Quiz)?.passing_grade || 70,
    },
  })

  useEffect(() => {
    if (activity) {
      form.reset({
        title: activity.title || "",
        content: (activity as Reading)?.content || "",
        url: (activity as Video)?.url || "",
        description: (activity as Image | Quiz | Assignment)?.description || "",
        description_title: (activity as Image)?.description_title || "",
        required: activity.required || false,
        passing_grade: (activity as Quiz)?.passing_grade || 70,
      })

      if (activityType === "reading" || activityType === "sub_reading") {
        setContent((activity as Reading)?.content || "")
      }

      if (activityType === "quiz") {
        setQuestions((activity as Quiz)?.questions || [])
      }

      if (activityType === "image") {
        setImageUrl((activity as Image)?.url || "")
        setImageTitle((activity as Image)?.title || "")
        setImageDescription((activity as Image)?.description || "")
        setDescriptionTitle((activity as Image)?.description_title || "")
      }
    }
  }, [activity, activityType, form])

  const handleContentChange = (value: string) => {
    setContent(value)
    form.setValue("content", value)
  }

  const handleQuestionsChange = (updatedQuestions: QuizQuestion[]) => {
    setQuestions(updatedQuestions)
  }

  const handleImageUpload = async () => {
    if (files.length === 0) return imageUrl

    const file = files[0]
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `reading_images/${fileName}`

    try {
      setUploadProgress(0)
      const { data, error } = await supabase.storage.from("media").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        throw error
      }

      setUploadProgress(100)

      const { data: urlData } = await supabase.storage.from("media").createSignedUrl(filePath, 31536000) // URL valid for 1 year

      if (urlData?.signedUrl) {
        setImageUrl(urlData.signedUrl)
        return urlData.signedUrl
      }
      return ""
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
      return ""
    }
  }

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      let activityData: any = {
        id: activity?.id || uuidv4(),
        title: data.title,
        type: activityType,
        required: data.required,
        lesson_id: lesson?.id,
        created_at: activity?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (activityType === "reading" || activityType === "sub_reading") {
        activityData = {
          ...activityData,
          content,
        }
      } else if (activityType === "video") {
        activityData = {
          ...activityData,
          url: data.url,
        }
      } else if (activityType === "image") {
        const uploadedUrl = await handleImageUpload()
        activityData = {
          ...activityData,
          url: uploadedUrl || imageUrl,
          description: data.description,
          description_title: data.description_title,
        }
      } else if (activityType === "quiz") {
        activityData = {
          ...activityData,
          description: data.description,
          questions,
          passing_grade: data.passing_grade,
        }
      } else if (activityType === "assignment") {
        activityData = {
          ...activityData,
          description: data.description,
        }
      }

      onSave(activityData)
      onClose()
    } catch (error) {
      console.error("Error saving activity:", error)
      toast.error("Failed to save activity")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {activity ? "Edit" : "Add"} {activityType.charAt(0).toUpperCase() + activityType.slice(1)} Activity
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(activityType === "reading" || activityType === "sub_reading") && (
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Editor value={content} onChange={handleContentChange} placeholder="Enter content" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {activityType === "video" && (
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter video URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {activityType === "image" && (
                <>
                  <FormField
                    control={form.control}
                    name="description_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter description title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label>Image</Label>
                    {imageUrl && (
                      <div className="mb-4">
                        <img src={imageUrl || "/placeholder.svg"} alt="Uploaded" className="max-h-40 rounded" />
                      </div>
                    )}
                    <div
                      {...getRootProps()}
                      className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer"
                    >
                      <input {...getInputProps()} />
                      <p>Drag & drop an image here, or click to select one</p>
                      {files.length > 0 && <p className="mt-2 text-sm text-gray-500">Selected: {files[0].name}</p>}
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activityType === "quiz" && (
                <>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="passing_grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Grade (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4">
                    <Label>Questions</Label>
                    <QuizQuestionForm questions={questions} onChange={handleQuestionsChange} />
                  </div>
                </>
              )}

              {activityType === "assignment" && (
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Required</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <div className="p-6 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

