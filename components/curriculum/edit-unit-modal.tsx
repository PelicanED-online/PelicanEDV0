"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Unit {
  unit_id: string
  subject_id: string
  name: string
  unit_title: string | null
}

interface EditUnitModalProps {
  unit: Unit
  onUnitUpdated: () => void
}

export function EditUnitModal({ unit, onUnitUpdated }: EditUnitModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: unit.name,
    unit_title: unit.unit_title || "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update the record using the unit_id
      const { error } = await supabase
        .from("units")
        .update({
          name: formData.name,
          unit_title: formData.unit_title || null,
        })
        .eq("unit_id", unit.unit_id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Unit has been updated successfully.",
      })

      setOpen(false)
      onUnitUpdated()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update unit",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this unit? This action cannot be undone.")) {
      return
    }

    setLoading(true)

    try {
      // Close the modal first
      setOpen(false)

      // Then perform the delete operation
      const { error } = await supabase.from("units").delete().eq("unit_id", unit.unit_id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Unit has been deleted successfully.",
      })

      // Refresh the data
      onUnitUpdated()

      // Force a router refresh
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete unit",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Unit</DialogTitle>
            <DialogDescription>Make changes to the unit. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Unit Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit_title" className="text-right">
                Title
              </Label>
              <Input
                id="unit_title"
                name="unit_title"
                value={formData.unit_title}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
