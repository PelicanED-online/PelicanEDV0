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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { RichTextEditor } from "@/components/rich-text-editor"

interface AddReadingAddonModalProps {
  onSubmit: (title: string, content: string) => void
  trigger?: React.ReactNode
}

export function AddReadingAddonModal({ onSubmit, trigger }: AddReadingAddonModalProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const { toast } = useToast()

  const handleSubmit = () => {
    onSubmit(title, content)
    setOpen(false)
    setTitle("") // Reset form
    setContent("") // Reset form
    toast({
      title: "Success!",
      description: "Reading addon added.",
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger || <Button>Add Reading Addon</Button>}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Add Reading Addon</AlertDialogTitle>
          <AlertDialogDescription>Add a new reading addon here.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
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
