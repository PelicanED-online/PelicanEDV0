"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DistrictsTable } from "@/components/districts/districts-table"
import { AddDistrictModal } from "@/components/districts/add-district-modal"
import { EditDistrictModal } from "@/components/districts/edit-district-modal"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export interface District {
  district_id: string
  district_name: string
  domain: string
  student_domain?: string
  contact_email?: string
  contact?: string
  number?: string
}

export default function DistrictsPage() {
  const [districts, setDistricts] = useState<District[]>([])
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null)
  const { toast } = useToast()

  const ITEMS_PER_PAGE = 25

  useEffect(() => {
    fetchDistricts()
  }, [])

  useEffect(() => {
    // Filter districts based on search query
    if (searchQuery.trim() === "") {
      setFilteredDistricts(districts)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = districts.filter(
        (district) =>
          district.district_name.toLowerCase().includes(query) ||
          district.domain.toLowerCase().includes(query) ||
          (district.student_domain && district.student_domain.toLowerCase().includes(query)) ||
          (district.contact_email && district.contact_email.toLowerCase().includes(query)) ||
          (district.contact && district.contact.toLowerCase().includes(query)),
      )
      setFilteredDistricts(filtered)
    }

    // Reset to first page when search changes
    setCurrentPage(1)
  }, [searchQuery, districts])

  useEffect(() => {
    // Calculate total pages
    setTotalPages(Math.max(1, Math.ceil(filteredDistricts.length / ITEMS_PER_PAGE)))
  }, [filteredDistricts])

  const fetchDistricts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("districts").select("*").order("district_name", { ascending: true })

      if (error) {
        console.error("Error fetching districts:", error)
        toast({
          title: "Error",
          description: "Failed to load districts. Please try again.",
          variant: "destructive",
        })
      } else {
        setDistricts(data || [])
        setFilteredDistricts(data || [])
      }
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

  const handleAddDistrict = async (newDistrict: Omit<District, "district_id">) => {
    try {
      const { data, error } = await supabase.from("districts").insert([newDistrict]).select()

      if (error) {
        console.error("Error adding district:", error)
        toast({
          title: "Error",
          description: "Failed to add district. Please try again.",
          variant: "destructive",
        })
        return false
      } else {
        toast({
          title: "Success",
          description: "District added successfully.",
          className: "bottom-right-toast",
        })
        await fetchDistricts()
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

  const handleUpdateDistrict = async (updatedDistrict: District) => {
    try {
      const { error } = await supabase
        .from("districts")
        .update({
          district_name: updatedDistrict.district_name,
          domain: updatedDistrict.domain,
          student_domain: updatedDistrict.student_domain,
          contact_email: updatedDistrict.contact_email,
          contact: updatedDistrict.contact,
          number: updatedDistrict.number,
        })
        .eq("district_id", updatedDistrict.district_id)

      if (error) {
        console.error("Error updating district:", error)
        toast({
          title: "Error",
          description: "Failed to update district. Please try again.",
          variant: "destructive",
        })
        return false
      } else {
        toast({
          title: "Success",
          description: "District updated successfully.",
          className: "bottom-right-toast",
        })
        await fetchDistricts()
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

  const handleDeleteDistrict = async (districtId: string) => {
    try {
      const { error } = await supabase.from("districts").delete().eq("district_id", districtId)

      if (error) {
        console.error("Error deleting district:", error)
        toast({
          title: "Error",
          description: "Failed to delete district. Please try again.",
          variant: "destructive",
        })
        return false
      } else {
        toast({
          title: "Success",
          description: "District deleted successfully.",
          className: "bottom-right-toast",
        })
        await fetchDistricts()
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

  const handleEditDistrict = (district: District) => {
    setSelectedDistrict(district)
    setIsEditModalOpen(true)
  }

  // Get current page of districts
  const currentDistricts = filteredDistricts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-t-4 border-b-4 border-primary rounded-full animate-spin"></div>
            <p className="text-xl font-semibold">Loading districts...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Districts</h1>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add District
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search districts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        <DistrictsTable
          districts={currentDistricts}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          onEdit={handleEditDistrict}
        />

        <AddDistrictModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddDistrict={handleAddDistrict}
        />

        <EditDistrictModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedDistrict(null)
          }}
          district={selectedDistrict}
          onUpdateDistrict={handleUpdateDistrict}
          onDeleteDistrict={handleDeleteDistrict}
        />
      </div>
      <Toaster />
    </DashboardLayout>
  )
}
