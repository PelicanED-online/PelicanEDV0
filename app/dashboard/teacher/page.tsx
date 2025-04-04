"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCurrentUser } from "@/lib/supabase"
import { BarChart3, BookOpen, CheckCircle, Clock, GraduationCap } from "lucide-react"

export default function TeacherDashboard() {
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
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4 w-full">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">Current semester</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">124</div>
                  <p className="text-xs text-muted-foreground">Across all classes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">8 graded, 4 pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78%</div>
                  <p className="text-xs text-muted-foreground">+3% from last semester</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 w-full">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Class Performance</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Class performance chart will appear here
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <CardDescription>Assignments due soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Biology Quiz - Period 2</p>
                        <p className="text-sm text-muted-foreground">Due in 2 days</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Chemistry Lab Report - Period 4</p>
                        <p className="text-sm text-muted-foreground">Due in 5 days</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Physics Homework - Period 1</p>
                        <p className="text-sm text-muted-foreground">Due in 1 week</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="classes" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>My Classes</CardTitle>
                <CardDescription>Current semester classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-4 font-medium">
                    <div>Class Name</div>
                    <div>Period</div>
                    <div>Students</div>
                    <div>Avg. Grade</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-4 p-4">
                      <div>Biology 101</div>
                      <div>Period 1</div>
                      <div>28</div>
                      <div>82%</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Biology 101</div>
                      <div>Period 2</div>
                      <div>26</div>
                      <div>79%</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>AP Biology</div>
                      <div>Period 3</div>
                      <div>22</div>
                      <div>88%</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Chemistry 101</div>
                      <div>Period 4</div>
                      <div>24</div>
                      <div>75%</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Physics 101</div>
                      <div>Period 5</div>
                      <div>24</div>
                      <div>76%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="students" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Student Progress</CardTitle>
                <CardDescription>Track individual student performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-4 font-medium">
                    <div>Student Name</div>
                    <div>Class</div>
                    <div>Assignments Completed</div>
                    <div>Current Grade</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-4 p-4">
                      <div>John Smith</div>
                      <div>Biology 101 - P1</div>
                      <div>8/10</div>
                      <div>92%</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Maria Garcia</div>
                      <div>Biology 101 - P1</div>
                      <div>7/10</div>
                      <div>85%</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>David Johnson</div>
                      <div>AP Biology - P3</div>
                      <div>9/10</div>
                      <div>94%</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Sarah Williams</div>
                      <div>Chemistry 101 - P4</div>
                      <div>6/10</div>
                      <div>78%</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Michael Brown</div>
                      <div>Physics 101 - P5</div>
                      <div>5/10</div>
                      <div>72%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="lessons" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Plans</CardTitle>
                <CardDescription>Manage your curriculum and lesson plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-4 font-medium">
                    <div>Lesson Title</div>
                    <div>Class</div>
                    <div>Status</div>
                    <div>Date</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-4 p-4">
                      <div>Cell Structure and Function</div>
                      <div>Biology 101</div>
                      <div>Completed</div>
                      <div>Sep 15, 2023</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>DNA Replication</div>
                      <div>AP Biology</div>
                      <div>Completed</div>
                      <div>Sep 22, 2023</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Cellular Respiration</div>
                      <div>Biology 101</div>
                      <div>In Progress</div>
                      <div>Oct 5, 2023</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Atomic Structure</div>
                      <div>Chemistry 101</div>
                      <div>Planned</div>
                      <div>Oct 12, 2023</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Newton's Laws of Motion</div>
                      <div>Physics 101</div>
                      <div>Planned</div>
                      <div>Oct 19, 2023</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

