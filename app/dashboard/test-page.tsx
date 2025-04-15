"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 w-full p-4">
        <h1 className="text-3xl font-bold tracking-tight">Test Page</h1>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sidebar Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a test page to verify the sidebar is working correctly.</p>
            <p className="mt-4">
              If you can see this page and the sidebar with navigation items, everything is working!
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

