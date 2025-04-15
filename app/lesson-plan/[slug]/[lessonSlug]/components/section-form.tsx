"use client"

// app/lesson-plan/[slug]/[lessonSlug]/components/section-form.tsx

import React from "react"

interface SectionFormProps {
  onSubmit: (formData: FormData) => Promise<void>
  initialValues?: { section_name: string }
}

const SectionForm: React.FC<SectionFormProps> = ({ onSubmit, initialValues }) => {
  const [values, setValues] = React.useState({
    section_name: initialValues?.section_name || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    // Make sure the section name is properly included in the form data when saving
    formData.append("section_name", values.section_name)

    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="section_name">Section Name:</label>
        <input type="text" id="section_name" name="section_name" value={values.section_name} onChange={handleChange} />
      </div>
      <button type="submit">Save Section</button>
    </form>
  )
}

export default SectionForm
