"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import type { UserRole } from "@/lib/supabase"

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onAddUser: (userData: {
    firstName: string | null
    lastName: string | null
    role: UserRole | null
    user_id: string | null
    district_id: string | null
    school_id: string | null
  }) => Promise<boolean>
}

export function AddUserModal({ isOpen, onClose, onAddUser }: AddUserModalProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState<UserRole | "">("")
  const [userId, setUserId] = useState("")
  const [districtId, setDistrictId] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [loading, setLoading] = useState(false)
  const [districts, setDistricts] = useState<{ district_id: string; name: string }[]>([])
  const [schools, setSchools] = useState<{ school_id: string; name: string }[]>([])
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingSchools, setLoadingSchools] = useState(false)

  // Fetch districts when modal opens
  const fetchDistricts = async () => {
    if (isOpen && districts.length === 0 && !loadingDistricts) {
      setLoadingDistricts(true)
      try {
        const { data, error } = await supabase
          .from("districts")
          .select("district_id, name")
          .order("name", { ascending: true })

        if (error) throw error
        setDistricts(data || [])
      } catch (error) {
        console.error("Error fetching districts:", error)
      } finally {
        setLoadingDistricts(false)
      }
    }
  }

  // Fetch schools when a district is selected
  const fetchSchools = async (districtId: string) => {
    if (!districtId) {
      setSchools([])
      return
    }

    setLoadingSchools(true)
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("school_id, name")
        .eq("district_id", districtId)
        .order("name", { ascending: true })

      if (error) throw error
      setSchools(data || [])
    } catch (error) {
      console.error("Error fetching schools:", error)
    } finally {
      setLoadingSchools(false)
    }
  }

  // Handle district change
  const handleDistrictChange = (value: string) => {
    setDistrictId(value)
    setSchoolId("") // Reset school when district changes
    fetchSchools(value)
  }

  // Reset form
  const resetForm = () => {
    setFirstName("")
    setLastName("")
    setRole("")
    setUserId("")
    setDistrictId("")
    setSchoolId("")
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!role) {
        alert("Role is required")
        setLoading(false)
        return
      }

      const userData = {
        firstName: firstName || null,
        lastName: lastName || null,
        role: (role as UserRole) || null,
        user_id: userId || null,
        district_id: districtId || null,
        school_id: schoolId || null,
      }

      const success = await onAddUser(userData)
      if (success) {
        resetForm()
        onClose()
      }
    } catch (error) {
      console.error("Error adding user:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          fetchDistricts()
        } else {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="district">District</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">User ID (Auth ID)</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID from auth system"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="districtId">District</Label>
            <Select value={districtId} onValueChange={handleDistrictChange}>
              <SelectTrigger id="districtId">
                <SelectValue placeholder="Select a district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {districts.map((district) => (
                  <SelectItem key={district.district_id} value={district.district_id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {districtId && (
            <div className="space-y-2">
              <Label htmlFor="schoolId">School</Label>
              <Select value={schoolId} onValueChange={(value) => setSchoolId(value)}>
                <SelectTrigger id="schoolId">
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.school_id} value={school.school_id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !role}>
              {loading ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
