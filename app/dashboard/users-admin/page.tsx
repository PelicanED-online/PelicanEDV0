"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UsersTable } from "@/components/users/users-table"
import { AddUserModal } from "@/components/users/add-user-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search } from "lucide-react"

// Update the User interface to include district_registration and school_registration
export interface User {
  id: string
  user_id: string | null
  firstName: string | null
  lastName: string | null
  role: string | null
  created_at: string
  updated_at: string | null
  district_id: string | null
  school_id: string | null
  district_registration?: {
    district_registration_id: string
    user_id: string
    district_id: string | null
  } | null
  school_registrations?: {
    school_registration_id: string
    user_id: string
    school_id: string | null
  }[]
}

export interface School {
  school_id: string
  school_name: string
  district_id: string | null
}

export interface District {
  district_id: string
  district_name: string
  domain: string
  contact_email: string | null
  contact: string | null
  number: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const { toast } = useToast()
  const usersPerPage = 25

  // Fetch users, schools, and districts from Supabase
  const fetchData = async () => {
    try {
      // Fetch users
      const { data: userData, error: userError } = await supabase
        .from("user_information")
        .select("*")
        .order("created_at", { ascending: false })

      if (userError) {
        throw userError
      }

      // Fetch district registrations
      const { data: districtRegistrationData, error: districtRegistrationError } = await supabase
        .from("district_registration")
        .select("district_registration_id, user_id, district_id")

      if (districtRegistrationError) {
        throw districtRegistrationError
      }

      // Fetch school registrations
      const { data: schoolRegistrationData, error: schoolRegistrationError } = await supabase
        .from("school_registration")
        .select("school_registration_id, user_id, school_id")

      if (schoolRegistrationError) {
        throw schoolRegistrationError
      }

      // Fetch schools
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .select("school_id, school_name, district_id")

      if (schoolError) {
        throw schoolError
      }

      // Fetch districts
      const { data: districtData, error: districtError } = await supabase
        .from("districts")
        .select("district_id, district_name, domain, contact_email, contact, number")

      if (districtError) {
        throw districtError
      }

      // Enhance user data with district registration and school registration information
      const enhancedUserData =
        userData?.map((user) => {
          // Find district registration for this user
          const userDistrictReg = districtRegistrationData?.find((reg) => reg.user_id === user.user_id)

          // Find all school registrations for this user
          const userSchoolRegs = schoolRegistrationData?.filter((reg) => reg.user_id === user.user_id) || []

          return {
            ...user,
            district_registration: userDistrictReg || null,
            school_registrations: userSchoolRegs,
          }
        }) || []

      setUsers(enhancedUserData)
      setSchools(schoolData || [])
      setDistricts(districtData || [])

      // Apply any existing search filter to the new data
      let result = enhancedUserData
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        result = enhancedUserData.filter(
          (user) =>
            user.firstName?.toLowerCase().includes(query) ||
            false ||
            user.lastName?.toLowerCase().includes(query) ||
            false ||
            user.role?.toLowerCase().includes(query) ||
            false,
        )
      }

      setFilteredUsers(result)
      setTotalPages(Math.ceil(result.length / usersPerPage))

      // Set loading to false after everything is ready
      setLoading(false)
    } catch (error: any) {
      console.error("Error fetching data:", error.message)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [])

  // Filter and paginate users when search query changes
  useEffect(() => {
    if (!loading) {
      // Only filter if not loading
      let result = users

      // Apply search filter if query exists
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        result = users.filter(
          (user) =>
            user.firstName?.toLowerCase().includes(query) ||
            false ||
            user.lastName?.toLowerCase().includes(query) ||
            false ||
            user.role?.toLowerCase().includes(query) ||
            false,
        )
      }

      setFilteredUsers(result)
      setTotalPages(Math.ceil(result.length / usersPerPage))
      setCurrentPage(1) // Reset to first page when filter changes
    }
  }, [searchQuery, users, loading])

  // Handle adding a new user
  const handleAddUser = async (userData: Omit<User, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase.from("user_information").insert([userData]).select()

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "User added successfully!",
      })

      // Refresh the users list
      fetchData()
      return true
    } catch (error: any) {
      console.error("Error adding user:", error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to add user. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  // Get current page of users
  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * usersPerPage
    const endIndex = startIndex + usersPerPage
    return filteredUsers.slice(startIndex, endIndex)
  }

  return (
    <DashboardLayout>
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Users</h1>
          <Button onClick={() => setIsAddUserModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Users table - only show when not loading */}
        {!loading && (
          <div className="pb-20">
            {" "}
            {/* Add padding at the bottom to ensure content extends */}
            <UsersTable
              users={getCurrentPageUsers()}
              schools={schools}
              districts={districts}
              loading={false}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Add User Modal */}
        <AddUserModal
          isOpen={isAddUserModalOpen}
          onClose={() => setIsAddUserModalOpen(false)}
          onAddUser={handleAddUser}
        />
      </div>
    </DashboardLayout>
  )
}
