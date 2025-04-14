import { DashboardLayout } from "@/components/dashboard-layout"
import ProfileClient from "./profile-client"

export const metadata = {
  title: "Profile | PelicanED",
  description: "Manage your profile information",
}

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <ProfileClient />
    </DashboardLayout>
  )
}
