"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PlusCircle, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface ActivityType {
  id: string
  activity_id: string
  type: "reading" | "source" | "question" | "graphic_organizer"
  order: number
}

// Update the AnswerOption interface to include order
interface AnswerOption {
  id?: string
  question_choices_id?: string
  text: string
  isCorrect: boolean
  choice_text?: string
  is_correct?: boolean
  order: number // Add order field
}

// Update the Question interface to include partB field
interface Question {
  activity_id: string
  question_id?: string
  order?: number
  published?: string
  question?: string
  question_text?: string
  question_title?: string
  question_type?: string
  answerOptions?: AnswerOption[]
  partB?: string // Add this field for Part B content
}

interface QuestionActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity: ActivityType
  initialData?: Question
  onSave: (question: Question) => void
}

export function QuestionActivityModal({
  open,
  onOpenChange,
  activity,
  initialData,
  onSave,
}: QuestionActivityModalProps) {
  const [formData, setFormData] = useState<Question>({
    activity_id: "",
    question_type: "",
    question_title: "",
    question_text: "",
    published: "No", // Default to "No"
    answerOptions: [],
    partB: "",
  })

  const [showQuestionFields, setShowQuestionFields] = useState(false)
  const [isMultipleChoice, setIsMultipleChoice] = useState(false)
  const { toast } = useToast()

  // In the useEffect hook, update the formData initialization to include partB
  useEffect(() => {
    if (activity && open) {
      // If initialData has answerOptions with order, use them
      // Otherwise, initialize with default order values
      let answerOptions = initialData?.answerOptions

      if (!answerOptions || answerOptions.length === 0) {
        // Create 5 options for Multiple Select, 4 for Multiple Choice
        const isMultipleSelect = initialData?.question_type === "Multiple Select"
        const optionCount = isMultipleSelect ? 5 : 4

        answerOptions = Array.from({ length: optionCount }, (_, i) => ({
          id: `${i + 1}`,
          text: "",
          isCorrect: false,
          order: i,
        }))
      } else {
        // Convert from database format to component format
        answerOptions = answerOptions.map((option, index) => ({
          id: option.question_choices_id || `temp-${index}`,
          text: option.choice_text || "",
          isCorrect: option.is_correct || false,
          order: option.order !== undefined ? option.order : index,
        }))

        // Sort by order
        answerOptions.sort((a, b) => a.order - b.order)
      }

      setFormData({
        activity_id: activity.activity_id,
        question_id: initialData?.question_id,
        question_type: initialData?.question_type || "",
        question_title: initialData?.question_title || "",
        // Handle backward compatibility - if question_text exists use it, otherwise use question
        question_text: initialData?.question_text || initialData?.question || "",
        partB: initialData?.partB || "", // Initialize partB field
        order: activity.order,
        published: initialData?.published || "No",
        answerOptions: answerOptions,
      })

      const questionType = initialData?.question_type || ""
      setShowQuestionFields(!!questionType && questionType !== "" && questionType !== "none")
      setIsMultipleChoice(questionType === "Multiple Choice" || questionType === "Multiple Select")
    } else {
      setShowQuestionFields(false)
      setIsMultipleChoice(false)
    }
  }, [activity, initialData, open])

  const handleQuestionTextChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      question_text: value,
    }))
  }

  // Add a handler for Part B text changes
  const handlePartBTextChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      partB: value,
    }))
  }

  const handleQuestionTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      question_title: e.target.value,
    }))
  }

  const handleQuestionTypeChange = (value: string) => {
    const formattedValue = value === "Check for Understanding" ? "Check for Understanding" : value
    const isMultChoice = value === "Multiple Choice" || value === "Multiple Select"
    const isMultSelect = value === "Multiple Select"

    setFormData((prev) => {
      // Always create new answer options when switching to Multiple Choice or Multiple Select
      let answerOptions = []

      if (isMultChoice) {
        // Create 5 options for Multiple Select, 4 for Multiple Choice
        const optionCount = isMultSelect ? 5 : 4
        answerOptions = Array.from({ length: optionCount }, (_, i) => ({
          id: `${i + 1}`,
          text: "",
          isCorrect: false,
          order: i,
        }))
      } else {
        // For other question types, keep existing options if any
        answerOptions = prev.answerOptions || []
      }

      return {
        ...prev,
        question_type: formattedValue,
        answerOptions: answerOptions,
      }
    })

    setShowQuestionFields(formattedValue !== "none")
    setIsMultipleChoice(isMultChoice)
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      published: checked ? "Yes" : "No",
    }))
  }

  const handleAnswerChange = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      answerOptions: prev.answerOptions?.map((option) => (option.id === id ? { ...option, text: value } : option)),
    }))
  }

  const handleCorrectAnswerChange = (id: string) => {
    setFormData((prev) => {
      if (prev.question_type === "Multiple Select") {
        // For Multiple Select, toggle the selected option
        return {
          ...prev,
          answerOptions: prev.answerOptions?.map((option) =>
            option.id === id ? { ...option, isCorrect: !option.isCorrect } : option,
          ),
        }
      } else {
        // For Multiple Choice, only one option can be correct
        return {
          ...prev,
          answerOptions: prev.answerOptions?.map((option) => ({ ...option, isCorrect: option.id === id })),
        }
      }
    })
  }

  const addAnswerOption = () => {
    setFormData((prev) => {
      const currentOptions = prev.answerOptions || []
      // Find the highest order value and add 1 for the new option
      const nextOrder = currentOptions.length > 0 ? Math.max(...currentOptions.map((o) => o.order)) + 1 : 0

      return {
        ...prev,
        answerOptions: [
          ...currentOptions,
          {
            id: `${Date.now()}`,
            text: "",
            isCorrect: false,
            order: nextOrder,
          },
        ],
      }
    })
  }

  const removeAnswerOption = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      answerOptions: prev.answerOptions?.filter((option) => option.id !== id),
    }))
  }

  // Update the handleSubmit function to format the data correctly
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that a question type is selected
    if (!formData.question_type || formData.question_type === "none") {
      toast({
        title: "Validation Error",
        description: "Please select a question type.",
        variant: "destructive",
      })
      return
    }

    // Validate multiple choice questions have at least 2 options and one correct answer
    if (formData.question_type === "Multiple Choice" || formData.question_type === "Multiple Select") {
      if (!formData.answerOptions || formData.answerOptions.length < 2) {
        toast({
          title: "Validation Error",
          description: `${formData.question_type} questions must have at least 2 answer options.`,
          variant: "destructive",
        })
        return
      }

      const correctAnswersCount = formData.answerOptions.filter((option) => option.isCorrect).length

      if (correctAnswersCount === 0) {
        toast({
          title: "Validation Error",
          description: `Please select at least one correct answer for the ${formData.question_type} question.`,
          variant: "destructive",
        })
        return
      }

      if (formData.question_type === "Multiple Select" && correctAnswersCount < 2) {
        toast({
          title: "Validation Error",
          description: "Multiple Select questions must have at least 2 correct answers.",
          variant: "destructive",
        })
        return
      }

      // Check if any answer options are empty
      if (formData.answerOptions.some((option) => !option.text.trim())) {
        toast({
          title: "Validation Error",
          description: "All answer options must have text.",
          variant: "destructive",
        })
        return
      }
    }

    // Format the answer options to match the database structure
    if (formData.answerOptions && formData.answerOptions.length > 0) {
      formData.answerOptions = formData.answerOptions.map((option, index) => ({
        question_choices_id: option.id && option.id.startsWith("temp-") ? undefined : option.id,
        choice_text: option.text,
        is_correct: option.isCorrect,
        order: option.order !== undefined ? option.order : index,
      }))
    }

    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Question Activity</DialogTitle>
          <DialogDescription>
            Create or edit a question activity. Students will answer this question via text input.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="question-type" className="text-right">
                Question Type
              </Label>
              <div className="col-span-3">
                <Select value={formData.question_type} onValueChange={handleQuestionTypeChange}>
                  <SelectTrigger id="question-type">
                    <SelectValue placeholder="Select a question type">
                      {formData.question_type || "Select a Question Type"}
                    </SelectValue>
                  </SelectTrigger>
                  {/* In the SelectContent component, add the new question type option */}
                  <SelectContent>
                    <SelectItem value="none">Select a Question Type</SelectItem>
                    <SelectItem value="Open Ended">Open Ended</SelectItem>
                    <SelectItem value="Check for Understanding">Check for Understanding</SelectItem>
                    <SelectItem value="Supporting Question">Supporting Question</SelectItem>
                    <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                    <SelectItem value="Multiple Select">Multiple Select</SelectItem>
                    <SelectItem value="Part A Part B Question">Part A Part B Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Show question fields if question type is not "none" */}
            {showQuestionFields && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="question-title" className="text-right">
                    Question Title
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="question-title"
                      value={formData.question_title}
                      onChange={handleQuestionTitleChange}
                      placeholder="Enter a title for this question"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="question-text" className="text-right pt-2">
                    Question
                  </Label>
                  <div className="col-span-3">
                    <RichTextEditor
                      value={formData.question_text || ""}
                      onChange={handleQuestionTextChange}
                      placeholder="Enter your question here"
                      className="min-h-[150px]"
                    />
                  </div>
                </div>

                {/* After the question text field and before the Multiple Choice/Select Answer Options section,
                add the Part B field that shows only when the question type is "Part A Part B Question" */}
                {formData.question_type === "Part A Part B Question" && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="question-part-b" className="text-right pt-2">
                      Part B
                    </Label>
                    <div className="col-span-3">
                      <RichTextEditor
                        value={formData.partB || ""}
                        onChange={handlePartBTextChange}
                        placeholder="Enter Part B of your question here"
                        className="min-h-[150px]"
                      />
                    </div>
                  </div>
                )}

                {/* Multiple Choice/Select Answer Options */}
                {isMultipleChoice && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Answer Options</Label>
                    <div className="col-span-3 space-y-3">
                      {formData.question_type === "Multiple Select" ? (
                        <div className="space-y-3">
                          {formData.answerOptions?.map((option) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`answer-${option.id}`}
                                checked={option.isCorrect}
                                onCheckedChange={() => handleCorrectAnswerChange(option.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Input
                                  value={option.text}
                                  onChange={(e) => handleAnswerChange(option.id, e.target.value)}
                                  placeholder={`Answer option ${option.id}`}
                                />
                                {/* Hidden field for order */}
                                <input type="hidden" value={option.order} />
                              </div>
                              {formData.answerOptions && formData.answerOptions.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeAnswerOption(option.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remove answer option</span>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <RadioGroup
                          value={formData.answerOptions?.find((o) => o.isCorrect)?.id || ""}
                          onValueChange={handleCorrectAnswerChange}
                          className="space-y-3"
                        >
                          {formData.answerOptions?.map((option) => (
                            <div key={option.id} className="flex items-center gap-2">
                              <RadioGroupItem value={option.id} id={`answer-${option.id}`} className="mt-1" />
                              <div className="flex-1">
                                <Input
                                  value={option.text}
                                  onChange={(e) => handleAnswerChange(option.id, e.target.value)}
                                  placeholder={`Answer option ${option.id}`}
                                />
                                {/* Hidden field for order */}
                                <input type="hidden" value={option.order} />
                              </div>
                              {formData.answerOptions && formData.answerOptions.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeAnswerOption(option.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remove answer option</span>
                                </Button>
                              )}
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addAnswerOption}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Answer Option
                      </Button>

                      <p className="text-sm text-muted-foreground mt-2">
                        {formData.question_type === "Multiple Select"
                          ? "Check the boxes next to all correct answers."
                          : "Select the radio button next to the correct answer."}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="published" className="text-right">
                Published
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch id="published" checked={formData.published === "Yes"} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="published" className="text-sm text-muted-foreground">
                  {formData.published}
                </Label>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="flex-shrink-0 pt-2 border-t">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!formData.question_type || formData.question_type === "none"}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
