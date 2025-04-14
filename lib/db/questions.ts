import { supabase } from "@/lib/supabase"

export async function fetchQuestions(activityId: string) {
  try {
    const { data, error } = await supabase.from("questions").select("*").eq("activity_id", activityId)

    if (error) {
      console.error("Error fetching questions:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching questions:", error)
    return null
  }
}

export async function createQuestion(activityId: string, questionText: string, published: string) {
  try {
    const { data, error } = await supabase
      .from("questions")
      .insert([{ activity_id: activityId, question_text: questionText, published }])
      .select()

    if (error) {
      console.error("Error creating question:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error creating question:", error)
    return null
  }
}

export async function updateQuestion(questionId: string, questionText: string, published: string) {
  try {
    const { data, error } = await supabase
      .from("questions")
      .update({ question_text: questionText, published })
      .eq("question_id", questionId)
      .select()

    if (error) {
      console.error("Error updating question:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error updating question:", error)
    return null
  }
}

export async function deleteQuestion(questionId: string) {
  try {
    const { data, error } = await supabase.from("questions").delete().eq("question_id", questionId).select()

    if (error) {
      console.error("Error deleting question:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error deleting question:", error)
    return null
  }
}
