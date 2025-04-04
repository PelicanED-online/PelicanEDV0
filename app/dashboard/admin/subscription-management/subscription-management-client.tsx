"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Plus, AlertCircle } from "lucide-react"
import { AddSubscriptionModal } from "@/components/subscriptions/add-subscription-modal"
import { EditSubscriptionModal } from "@/components/subscriptions/edit-subscription-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface District {
  district_id: string
  district_name: string
}

interface AcademicYear {
  academic_year_id: string
  year_range: string
}

interface Subscription {
  id: number
  district_id: string
  district: number | null
  school: number | null
  teachers: number | null
  students: number | null
  paid: string
  academic_year_id: string
  districts?: { district_name: string }
  academic_years?: { year_range: string }
}

interface ErrorDetails {
  subscriptions?: string
  districts?: string
  academicYears?: string
}

interface SubscriptionManagementClientProps {
  initialSubscriptions: Subscription[]
  initialDistricts: District[]
  initialAcademicYears: AcademicYear[]
  hasServerErrors?: boolean
  errorDetails?: ErrorDetails
}

export default function SubscriptionManagementClient({
  initialSubscriptions,
  initialDistricts,
  initialAcademicYears,
  hasServerErrors = false,
  errorDetails = {},
}: SubscriptionManagementClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // State for data
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions)
  const [districts, setDistricts] = useState<District[]>(initialDistricts)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(initialAcademicYears)
  const [clientErrors, setClientErrors] = useState<ErrorDetails>({})

  // Determine if we need to fetch data on the client
  const needsClientFetch = hasServerErrors || initialSubscriptions.length === 0

  // Function to fetch data on the client side
  const fetchData = async () => {
    setIsLoading(true)
    const errors: ErrorDetails = {}

    try {
      console.log("Fetching subscription data on client...")

      // Fetch subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase.from("subscriptions").select(`
        *,
        districts:district_id (district_name),
        academic_years:academic_year_id (year_range)
      `)

      if (subscriptionsError) {
        console.error("Client error fetching subscriptions:", subscriptionsError)
        errors.subscriptions = subscriptionsError.message
      } else {
        console.log(`Fetched ${subscriptionsData?.length || 0} subscriptions on client`)
        setSubscriptions(subscriptionsData || [])
      }

      // Fetch districts
      const { data: districtsData, error: districtsError } = await supabase
        .from("districts")
        .select("district_id, district_name")

      if (districtsError) {
        console.error("Client error fetching districts:", districtsError)
        errors.districts = districtsError.message
      } else {
        console.log(`Fetched ${districtsData?.length || 0} districts on client`)
        setDistricts(districtsData || [])
      }

      // Fetch academic years
      const { data: academicYearsData, error: academicYearsError } = await supabase
        .from("academic_years")
        .select("academic_year_id, year_range")

      if (academicYearsError) {
        console.error("Client error fetching academic years:", academicYearsError)
        errors.academicYears = academicYearsError.message
      } else {
        console.log(`Fetched ${academicYearsData?.length || 0} academic years on client`)
        setAcademicYears(academicYearsData || [])
      }

      setClientErrors(errors)

      if (Object.keys(errors).length > 0) {
        toast({
          title: "Data Loading Error",
          description: "There was an error loading some data. Please check the console for details.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Unexpected error in client data fetching:", error)
      setClientErrors({
        subscriptions: "An unexpected error occurred while fetching data.",
      })
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Fetch data on mount if needed
  useEffect(() => {
    if (needsClientFetch) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Log data on component mount to help debug
  useEffect(() => {
    console.log("Client component mounted with data:", {
      initialSubscriptions: initialSubscriptions.length,
      initialDistricts: initialDistricts.length,
      initialAcademicYears: initialAcademicYears.length,
      hasServerErrors,
      needsClientFetch,
    })

    if (hasServerErrors) {
      console.error("Server error details:", errorDetails)
    }
  }, [initialSubscriptions, initialDistricts, initialAcademicYears, hasServerErrors, errorDetails, needsClientFetch])

  const handleEditClick = (subscription: Subscription) => {
    console.log("Edit clicked for subscription:", subscription)
    setSelectedSubscription(subscription)
    setIsEditModalOpen(true)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  // Determine if we have any errors
  const hasErrors = hasServerErrors || Object.keys(clientErrors).length > 0

  // Combine error details
  const allErrorDetails = { ...errorDetails, ...clientErrors }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </div>

      {hasErrors && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading the data.{" "}
            {needsClientFetch ? "Attempting to fetch data on the client side." : "Please try refreshing the page."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            View and manage all subscriptions in the system.
            {subscriptions.length === 0 && !isLoading && (
              <span className="block mt-1 text-yellow-600">
                No subscriptions found. Add a new subscription using the "Add Plan" button.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading subscriptions...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>District Name</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length > 0 ? (
                  subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>{subscription.id}</TableCell>
                      <TableCell>{subscription.districts?.district_name || "N/A"}</TableCell>
                      <TableCell>{subscription.district}</TableCell>
                      <TableCell>{subscription.school}</TableCell>
                      <TableCell>{subscription.teachers}</TableCell>
                      <TableCell>{subscription.students}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            subscription.paid === "Yes"
                              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                              : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                          }`}
                        >
                          {subscription.paid}
                        </span>
                      </TableCell>
                      <TableCell>{subscription.academic_years?.year_range || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-md hover:bg-accent hover:text-accent-foreground"
                          aria-label={`Edit ${subscription.districts?.district_name || "Subscription"}`}
                          onClick={() => handleEditClick(subscription)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                      {hasErrors
                        ? "Error loading subscriptions. Please check the console for details or try refreshing."
                        : "No subscriptions found. Add a new subscription using the 'Add Plan' button."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddSubscriptionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          // Refresh data after adding
          fetchData()
        }}
        districts={districts}
        academicYears={academicYears}
      />

      {selectedSubscription && (
        <EditSubscriptionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            // Refresh data after editing
            fetchData()
            // Small delay to avoid UI flicker
            setTimeout(() => setSelectedSubscription(null), 300)
          }}
          subscription={selectedSubscription}
          districts={districts}
          academicYears={academicYears}
        />
      )}
    </div>
  )
}

