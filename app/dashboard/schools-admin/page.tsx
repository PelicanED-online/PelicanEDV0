"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { SchoolsTable } from "@/components/schools/schools-table"
import { AddSchoolModal } from "@/components/schools/add-school-modal"
import { EditSchoolModal } from "@/components/schools/edit-school-modal"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export interface School {
  school_id: string
  district_id: string | null
  school_name: string | null
}

export interface District {
  district_id: string
  district_name: string
  domain: string
  contact_email: string | null
  contact: string | null
  number: string | null
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [filteredSchools, setFilteredSchools] = useState<School[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const { toast } = useToast()

  const ITEMS_PER_PAGE = 25

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Filter schools based on search query
    if (searchQuery.trim() === "") {
      setFilteredSchools(schools)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = schools.filter(
        (school) =>
          (school.school_name && school.school_name.toLowerCase().includes(query)) ||
          getDistrictName(school.district_id).toLowerCase().includes(query),
      )
      setFilteredSchools(filtered)
    }

    // Reset to first page when search changes
    setCurrentPage(1)
  }, [searchQuery, schools, districts])

  useEffect(() => {
    // Calculate total pages
    setTotalPages(Math.max(1, Math.ceil(filteredSchools.length / ITEMS_PER_PAGE)))
  }, [filteredSchools])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from("schools")
        .select("*")
        .order("school_name", { ascending: true })

      if (schoolsError) {
        console.error("Error fetching schools:", schoolsError)
        toast({
          title: "Error",
          description: "Failed to load schools. Please try again.",
          variant: "destructive",
        })
      }

      // Fetch districts
      const { data: districtsData, error: districtsError } = await supabase
        .from("districts")
        .select("*")
        .order("district_name", { ascending: true })

      if (districtsError) {
        console.error("Error fetching districts:", districtsError)
        toast({
          title: "Error",
          description: "Failed to load districts. Please try again.",
          variant: "destructive",
        })
      }

      setSchools(schoolsData || [])
      setFilteredSchools(schoolsData || [])
      setDistricts(districtsData || [])
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDistrictName = (districtId: string | null) => {
    if (!districtId) return "N/A"
    const district = districts.find((d) => d.district_id === districtId)
    return district ? district.district_name : "Unknown District"
  }

  const handleAddSchool = async (newSchool: Omit<School, "school_id">) => {
    try {
      const { data, error } = await supabase.from("schools").insert([newSchool]).select()

      if (error) {
        console.error("Error adding school:", error)
        toast({
          title: "Error",
          description: "Failed to add school. Please try again.",
          variant: "destructive",
        })
        return false
      } else {
        toast({
          title: "Success",
          description: "School added successfully.",
          className: "bottom-right-toast",
        })
        await fetchData()
        setIsAddModalOpen(false)
        return true
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleUpdateSchool = async (updatedSchool: School) => {
    try {
      const { error } = await supabase
        .from("schools")
        .update({
          school_name: updatedSchool.school_name,
          district_id: updatedSchool.district_id,
        })
        .eq("school_id", updatedSchool.school_id)

      if (error) {
        console.error("Error updating school:", error)
        toast({
          title: "Error",
          description: "Failed to update school. Please try again.",
          variant: "destructive",
        })
        return false
      } else {
        toast({
          title: "Success",
          description: "School updated successfully.",
          className: "bottom-right-toast",
        })
        await fetchData()
        return true
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleDeleteSchool = async (schoolId: string) => {
    try {
      const { error } = await supabase.from("schools").delete().eq("school_id", schoolId)

      if (error) {
        console.error("Error deleting school:", error)
        toast({
          title: "Error",
          description: "Failed to delete school. Please try again.",
          variant: "destructive",
        })
        return false
      } else {
        toast({
          title: "Success",
          description: "School deleted successfully.",
          className: "bottom-right-toast",
        })
        await fetchData()
        return true
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
      return false
    }
  }

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school)
    setIsEditModalOpen(true)
  }

  // Get current page of schools
  const currentSchools = filteredSchools.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <DashboardLayout>
      <div className="w-full px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Schools</h1>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add School
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        <SchoolsTable
          schools={currentSchools}
          districts={districts}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          onEdit={handleEditSchool}
        />

        <AddSchoolModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddSchool={handleAddSchool}
          districts={districts}
        />

        <EditSchoolModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedSchool(null)
          }}
          school={selectedSchool}
          districts={districts}
          onUpdateSchool={handleUpdateSchool}
          onDeleteSchool={handleDeleteSchool}
        />
      </div>
      <Toaster />
    </DashboardLayout>
  )
}
