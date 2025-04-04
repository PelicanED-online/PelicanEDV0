"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCurrentUser } from "@/lib/supabase"
import { BarChart3, GraduationCap, School, Users } from "lucide-react"

export default function DistrictDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pelican"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 w-full p-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">District Dashboard</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4 w-full">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Schools</CardTitle>
                  <School className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-muted-foreground">+1 from last year</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">342</div>
                  <p className="text-xs text-muted-foreground">+24 from last year</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5,248</div>
                  <p className="text-xs text-muted-foreground">+156 from last year</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78%</div>
                  <p className="text-xs text-muted-foreground">+4% from last year</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 w-full">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Performance trend chart will appear here
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Top Performing Schools</CardTitle>
                  <CardDescription>Based on student achievement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">Lincoln High School</p>
                        <p className="text-sm text-muted-foreground">92% average performance</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">Washington Middle School</p>
                        <p className="text-sm text-muted-foreground">88% average performance</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">Roosevelt Elementary</p>
                        <p className="text-sm text-muted-foreground">85% average performance</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="schools" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>School Directory</CardTitle>
                <CardDescription>All schools in your district</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-3 p-4 font-medium">
                    <div>School Name</div>
                    <div>Principal</div>
                    <div>Students</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-3 p-4">
                      <div>Lincoln High School</div>
                      <div>Sarah Johnson</div>
                      <div>1,245</div>
                    </div>
                    <div className="grid grid-cols-3 p-4">
                      <div>Washington Middle School</div>
                      <div>Michael Chen</div>
                      <div>876</div>
                    </div>
                    <div className="grid grid-cols-3 p-4">
                      <div>Roosevelt Elementary</div>
                      <div>Emily Davis</div>
                      <div>542</div>
                    </div>
                    <div className="grid grid-cols-3 p-4">
                      <div>Jefferson Elementary</div>
                      <div>Robert Wilson</div>
                      <div>498</div>
                    </div>
                    <div className="grid grid-cols-3 p-4">
                      <div>Madison Middle School</div>
                      <div>Jennifer Lopez</div>
                      <div>754</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="performance" className="space-y-4 w-full">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 w-full">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>District-wide performance by subject</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Subject performance chart will appear here
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Grade Level Performance</CardTitle>
                  <CardDescription>Performance by grade level</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Grade level performance chart will appear here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

