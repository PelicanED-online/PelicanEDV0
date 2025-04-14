"use client"

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

interface ReadingAddonModalProps {
  onSubmit: (title: string, content: string) => void
  initialTitle?: string
  initialContent?: string
}

export function ReadingAddonModal({ onSubmit, initialTitle = "", initialContent = "" }: ReadingAddonModalProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const { toast } = useToast()

  const handleSubmit = () => {
    onSubmit(title, content)
    setOpen(false)
    toast({
      title: "Success!",
      description: "Reading addon updated.",
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Edit Reading Addon</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Reading Addon</AlertDialogTitle>
          <AlertDialogDescription>Make changes to the reading addon here.</AlertDialogDescription>
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
          <AlertDialogAction onClick={handleSubmit}>Save</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
