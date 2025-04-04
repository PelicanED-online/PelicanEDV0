import { DashboardLayout } from "@/components/dashboard-layout"
import { supabase } from "@/lib/supabase"
import { Suspense } from "react"

// Client component to handle the interactive parts
import SubscriptionManagementClient from "./subscription-management-client"

export default async function SubscriptionsPage() {
  console.log("Fetching subscription data on server...")

  try {
    // Fetch subscriptions with district names and academic years
    const { data: subscriptions, error: subscriptionsError } = await supabase.from("subscriptions").select(`
        *,
        districts:district_id (district_name),
        academic_years:academic_year_id (year_range)
      `)

    if (subscriptionsError) {
      console.error("Error fetching subscriptions:", subscriptionsError)
    } else {
      console.log(`Fetched ${subscriptions?.length || 0} subscriptions on server`)
    }

    // Fetch all districts for the dropdowns
    const { data: districts, error: districtsError } = await supabase
      .from("districts")
      .select("district_id, district_name")

    if (districtsError) {
      console.error("Error fetching districts:", districtsError)
    } else {
      console.log(`Fetched ${districts?.length || 0} districts on server`)
    }

    // Fetch all academic years for the dropdowns
    const { data: academicYears, error: academicYearsError } = await supabase
      .from("academic_years")
      .select("academic_year_id, year_range")

    if (academicYearsError) {
      console.error("Error fetching academic years:", academicYearsError)
    } else {
      console.log(`Fetched ${academicYears?.length || 0} academic years on server`)
    }

    // Check if we have any errors
    const hasErrors = subscriptionsError || districtsError || academicYearsError

    return (
      <DashboardLayout>
        <div className="w-full py-6 space-y-6">
          <Suspense fallback={<div>Loading subscription data...</div>}>
            <SubscriptionManagementClient
              initialSubscriptions={subscriptions || []}
              initialDistricts={districts || []}
              initialAcademicYears={academicYears || []}
              hasServerErrors={hasErrors}
              errorDetails={{
                subscriptions: subscriptionsError?.message,
                districts: districtsError?.message,
                academicYears: academicYearsError?.message,
              }}
            />
          </Suspense>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    console.error("Unexpected error in subscription page:", error)

    // Return a fallback UI with client-side data fetching
    return (
      <DashboardLayout>
        <div className="w-full py-6 space-y-6">
          <Suspense fallback={<div>Loading subscription data...</div>}>
            <SubscriptionManagementClient
              initialSubscriptions={[]}
              initialDistricts={[]}
              initialAcademicYears={[]}
              hasServerErrors={true}
              errorDetails={{
                subscriptions: "Server-side data fetching failed. Falling back to client-side fetching.",
              }}
            />
          </Suspense>
        </div>
      </DashboardLayout>
    )
  }
}

