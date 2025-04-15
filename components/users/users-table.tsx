"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { User, School, District } from "@/app/dashboard/users-admin/page"

interface UsersTableProps {
  users: User[]
  schools: School[]
  districts: District[]
  loading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function UsersTable({
  users,
  schools,
  districts,
  loading, // We'll keep this prop for consistency but won't use it
  currentPage,
  totalPages,
  onPageChange,
}: UsersTableProps) {
  // Format role to capitalize first letter
  const formatRole = (role: string | null) => {
    if (!role) return "N/A"
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  // Get school names from school registrations
  const getSchoolNames = (user: User) => {
    if (!user.school_registrations || user.school_registrations.length === 0) return "N/A"

    // Get all school names for this user's registrations
    const schoolNames = user.school_registrations
      .map((reg) => {
        if (!reg.school_id) return null

        // Find the school in the schools table
        const school = schools.find((s) => s.school_id === reg.school_id)

        // Return the school name if found, otherwise a truncated ID
        return school ? school.school_name : reg.school_id.substring(0, 8) + "..."
      })
      .filter((name) => name !== null) // Remove null values

    if (schoolNames.length === 0) return "N/A"

    // Join multiple school names with commas
    return schoolNames.join(", ")
  }

  // Get district name from district_id
  const getDistrictName = (user: User) => {
    if (!user.district_registration) return "N/A"

    const districtId = user.district_registration.district_id
    if (!districtId) return "N/A"

    const district = districts.find((d) => d.district_id === districtId)
    return district ? district.district_name : districtId.substring(0, 8) + "..."
  }

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  if (users.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>District</TableHead>
              <TableHead>School</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No users found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>District</TableHead>
              <TableHead>School</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.firstName || user.lastName ? `${user.firstName || ""} ${user.lastName || ""}` : "N/A"}
                </TableCell>
                <TableCell>{formatRole(user.role)}</TableCell>
                <TableCell>{getDistrictName(user)}</TableCell>
                <TableCell>{getSchoolNames(user)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{users.length}</span> of{" "}
          <span className="font-medium">{totalPages * 25}</span> Users
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Page</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Page</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

