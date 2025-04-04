"use client"

import type React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { RichTextEditor } from "@/components/rich-text-editor"

interface AddReadingActivityModalProps {
  onSubmit: (content: string) => void
  trigger?: React.ReactNode
}

export function AddReadingActivityModal({ onSubmit, trigger }: AddReadingActivityModalProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const { toast } = useToast()

  const handleSubmit = () => {
    onSubmit(content)
    setOpen(false)
    setContent("") // Reset form
    toast({
      title: "Success!",
      description: "Reading activity added.",
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger || <Button>Add Reading Activity</Button>}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Add Reading Activity</AlertDialogTitle>
          <AlertDialogDescription>Add a new reading activity content here.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="content" className="text-right">
              Content
            </Label>
            <div className="col-span-3">
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Enter content"
                className="min-h-[150px]"
              />
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit}>Add</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

