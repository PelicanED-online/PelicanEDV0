"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import type { School, District } from "@/app/dashboard/schools-admin/page"

interface SchoolsTableProps {
  schools: School[]
  districts: District[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  setCurrentPage: (page: number) => void
  onEdit: (school: School) => void
}

export function SchoolsTable({
  schools,
  districts,
  isLoading,
  currentPage,
  totalPages,
  setCurrentPage,
  onEdit,
}: SchoolsTableProps) {
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const getDistrictName = (districtId: string | null) => {
    if (!districtId) return "N/A"
    const district = districts.find((d) => d.district_id === districtId)
    return district ? district.district_name : "Unknown District"
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading schools...</p>
      </div>
    )
  }

  if (schools.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No schools found.</p>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>School Name</TableHead>
            <TableHead>District</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schools.map((school) => (
            <TableRow key={school.school_id}>
              <TableCell className="font-medium">{school.school_name || "Unnamed School"}</TableCell>
              <TableCell>{getDistrictName(school.district_id)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(school)}
                  aria-label={`Edit ${school.school_name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{schools.length}</span> of{" "}
          <span className="font-medium">{totalPages * 25}</span> Schools
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Page</span>
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Page</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
