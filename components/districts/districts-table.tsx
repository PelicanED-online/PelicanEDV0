"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import type { District } from "@/app/dashboard/districts-admin/page"

interface DistrictsTableProps {
  districts: District[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  setCurrentPage: (page: number) => void
  onEdit: (district: District) => void
}

export function DistrictsTable({
  districts,
  isLoading,
  currentPage,
  totalPages,
  setCurrentPage,
  onEdit,
}: DistrictsTableProps) {
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

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground">Loading districts...</p>
      </div>
    )
  }

  if (districts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No districts found.</p>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Primary Domain</TableHead>
            <TableHead>Secondary Domain</TableHead>
            <TableHead>Contact Email</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {districts.map((district) => (
            <TableRow key={district.district_id}>
              <TableCell className="font-medium">{district.district_name}</TableCell>
              <TableCell>{district.domain}</TableCell>
              <TableCell>{district.student_domain || "-"}</TableCell>
              <TableCell>{district.contact_email || "-"}</TableCell>
              <TableCell>{district.contact || "-"}</TableCell>
              <TableCell>{district.number || "-"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(district)}
                  aria-label={`Edit ${district.district_name}`}
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
          Showing <span className="font-medium">{districts.length}</span> of{" "}
          <span className="font-medium">{totalPages * 25}</span> Districts
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

