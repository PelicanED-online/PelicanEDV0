"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, User, Mail, Building, School } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { updateUserProfile } from "@/app/actions/profile-actions"

export default function ProfileClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    schoolName: "",
    districtName: "",
    role: "",
  })

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true)
        const currentUser = await getCurrentUser()

        if (!currentUser) {
          router.push("/login")
          return
        }

        // Get additional information like school and district names
        let schoolName = ""
        let districtName = ""

        if (currentUser.userInfo?.school_id) {
          const { data: schoolData } = await supabase
            .from("schools")
            .select("name")
            .eq("id", currentUser.userInfo.school_id)
            .single()

          schoolName = schoolData?.name || ""
        }

        if (currentUser.userInfo?.district_id) {
          const { data: districtData } = await supabase
            .from("districts")
            .select("name")
            .eq("id", currentUser.userInfo.district_id)
            .single()

          districtName = districtData?.name || ""
        }

        setUser(currentUser)
        setFormData({
          firstName: currentUser.userInfo?.firstName || "",
          lastName: currentUser.userInfo?.lastName || "",
          email: currentUser.email || "",
          schoolName,
          districtName,
          role: currentUser.userInfo?.role || currentUser.userInfo?.data?.role || "",
        })
      } catch (error) {
        console.error("Error loading user:", error)
        toast({
          title: "Error",
          description: "Failed to load user information",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      setSaving(true)

      // Update user information using the server action
      const result = await updateUserProfile(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile information",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pelican"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      <div className="w-full">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>View and update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    <User className="h-4 w-4 inline mr-2" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    <User className="h-4 w-4 inline mr-2" />
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email Address
                </Label>
                <Input id="email" name="email" value={formData.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    <User className="h-4 w-4 inline mr-2" />
                    Role
                  </Label>
                  <Input
                    id="role"
                    name="role"
                    value={formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                    disabled
                    className="bg-muted"
                  />
                </div>
                {formData.schoolName && (
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">
                      <School className="h-4 w-4 inline mr-2" />
                      School
                    </Label>
                    <Input
                      id="schoolName"
                      name="schoolName"
                      value={formData.schoolName}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                )}
              </div>

              {formData.districtName && (
                <div className="space-y-2">
                  <Label htmlFor="districtName">
                    <Building className="h-4 w-4 inline mr-2" />
                    District
                  </Label>
                  <Input
                    id="districtName"
                    name="districtName"
                    value={formData.districtName}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}

