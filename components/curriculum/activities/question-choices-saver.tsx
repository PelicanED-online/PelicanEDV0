"use client"

import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

interface QuestionChoicesSaverProps {
  questionId: string
  answerOptions: {
    id?: string
    question_choices_id?: string
    text: string
    choice_text?: string
    isCorrect: boolean
    is_correct?: boolean
    order?: number
  }[]
}

const saveQuestionChoices = async ({ questionId, answerOptions }: QuestionChoicesSaverProps) => {
  if (!questionId || !answerOptions || answerOptions.length === 0) {
    return
  }

  try {
    // First, delete existing choices for this question
    await supabase.from("question_choices").delete().eq("question_id", questionId)

    // Then, insert the new choices
    const choicesToInsert = answerOptions.map((option, index) => ({
      question_choices_id: uuidv4(),
      question_id: questionId,
      choice_text: option.choice_text || option.text || "",
      is_correct: option.is_correct || option.isCorrect || false,
      order: option.order !== undefined ? option.order : index,
    }))

    const { error } = await supabase.from("question_choices").insert(choicesToInsert)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Error saving question choices:", error)
    throw error
  }
}

export default saveQuestionChoices

