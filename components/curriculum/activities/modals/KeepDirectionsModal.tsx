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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface KeepDirectionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onKeep: () => void
  onDelete: () => void
}

export function KeepDirectionsModal({ open, onOpenChange, onKeep, onDelete }: KeepDirectionsModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activity Has Directions</AlertDialogTitle>
          <AlertDialogDescription>
            This activity is referenced by directions in lesson plans. What would you like to do with these directions?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            • Keep directions: Remove the activity reference but keep the directions in lesson plans
          </p>
          <p className="text-sm text-muted-foreground">
            • Delete directions: Remove both the activity and its associated directions
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={onKeep}>
            Keep Directions
          </Button>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
            Delete Directions
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
