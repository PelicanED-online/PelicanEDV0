import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/supabase"
import SettingsClient from "./settings-client"

export const metadata: Metadata = {
  title: "Admin Settings | PelicanED",
  description: "Admin settings page for PelicanED",
}

export default async function AdminSettingsPage() {
  const user = await getCurrentUser()

  if (!user || user.userInfo.role !== "admin") {
    redirect("/login")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings</p>
        </div>
      </div>
      <SettingsClient />
    </div>
  )
}
