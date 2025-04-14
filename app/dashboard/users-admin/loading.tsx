import { DashboardLayout } from "@/components/dashboard-layout"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="w-full px-6 py-6 space-y-6 bg-background min-h-screen">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-t-4 border-b-4 border-primary rounded-full animate-spin"></div>
            <p className="text-xl font-semibold">Loading users...</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
