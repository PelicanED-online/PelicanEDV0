import { DashboardLayout } from "@/components/dashboard-layout"

export default function Loading() {
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

