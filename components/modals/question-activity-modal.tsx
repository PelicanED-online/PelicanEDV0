"use client"

import React from "react"

// Find the addOption function and update it to initialize the order property correctly:
const addOption = (questionIndex: number) => {
  // Assuming questions and setQuestions are managed by useState or similar
  const [questions, setQuestions] = React.useState([]) // Initialize questions and setQuestions
  const newQuestions = [...questions]
  const currentQuestions = newQuestions[questionIndex] // Access currentQuestions from newQuestions
  // Determine the next order value
  const nextOrder =
    currentQuestions.options.length > 0 ? Math.max(...currentQuestions.options.map((o) => o.order)) + 1 : 0

  newQuestions[questionIndex].options = [
    ...currentQuestions.options,
    { text: "", isCorrect: false, order: nextOrder }, // Initialize order here
  ]
  setQuestions(newQuestions)
}
