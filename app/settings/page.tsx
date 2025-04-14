import { DashboardLayout } from "@/components/dashboard-layout"
import SettingsClient from "./settings-client"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="w-full px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <SettingsClient />
      </div>
    </DashboardLayout>
  )
}
