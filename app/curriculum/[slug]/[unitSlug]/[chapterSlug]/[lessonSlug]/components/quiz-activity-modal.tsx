"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import type { Quiz, QuizQuestion } from "@/types/curriculum"
import { v4 as uuidv4 } from "uuid"
import { QuizQuestionForm } from "@/components/quiz-question-form"

interface QuizActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (quiz: Quiz) => void
  quiz?: Quiz
}

export function QuizActivityModal({ isOpen, onClose, onSave, quiz }: QuizActivityModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [required, setRequired] = useState(false)
  const [passingGrade, setPassingGrade] = useState(70)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title || "")
      setDescription(quiz.description || "")
      setRequired(quiz.required || false)
      setPassingGrade(quiz.passing_grade || 70)
      setQuestions(quiz.questions || [])
    } else {
      setTitle("")
      setDescription("")
      setRequired(false)
      setPassingGrade(70)
      setQuestions([])
    }
  }, [quiz, isOpen])

  const handleQuestionsChange = (updatedQuestions: QuizQuestion[]) => {
    setQuestions(updatedQuestions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const quizData: Quiz = {
        id: quiz?.id || uuidv4(),
        title,
        description,
        required,
        passing_grade: passingGrade,
        questions,
        type: "quiz",
        created_at: quiz?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      onSave(quizData)
      onClose()
    } catch (error) {
      console.error("Error saving quiz:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">{quiz ? "Edit" : "Add"} Quiz</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingGrade">Passing Grade (%)</Label>
              <Input
                id="passingGrade"
                type="number"
                min="0"
                max="100"
                value={passingGrade}
                onChange={(e) => setPassingGrade(Number.parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-4">
              <Label>Questions</Label>
              <QuizQuestionForm questions={questions} onChange={handleQuestionsChange} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={required}
                onCheckedChange={(checked) => setRequired(checked as boolean)}
              />
              <Label htmlFor="required">Required</Label>
            </div>
          </form>
        </div>

        <div className="p-6 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
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

