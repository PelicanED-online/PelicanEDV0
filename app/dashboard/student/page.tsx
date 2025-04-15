"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCurrentUser } from "@/lib/supabase"
import { BarChart3, BookOpen, CheckCircle, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function StudentDashboard() {
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
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4 w-full">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">6</div>
                  <p className="text-xs text-muted-foreground">Current semester</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24/36</div>
                  <p className="text-xs text-muted-foreground">67% completion rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assignments Due</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85%</div>
                  <p className="text-xs text-muted-foreground">B average</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 w-full">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Course Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Biology</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Mathematics</span>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">English</span>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">History</span>
                        <span className="text-sm font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Chemistry</span>
                        <span className="text-sm font-medium">72%</span>
                      </div>
                      <Progress value={72} className="h-2" />
                    </div>
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
                        <p className="text-sm font-medium leading-none">Biology Lab Report</p>
                        <p className="text-sm text-muted-foreground">Due tomorrow</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Math Problem Set</p>
                        <p className="text-sm text-muted-foreground">Due in 3 days</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">English Essay</p>
                        <p className="text-sm text-muted-foreground">Due in 5 days</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="lessons" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Current Lessons</CardTitle>
                <CardDescription>Your active lessons across all subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-4 font-medium">
                    <div>Lesson</div>
                    <div>Subject</div>
                    <div>Progress</div>
                    <div>Status</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-4 p-4">
                      <div>Cell Structure and Function</div>
                      <div>Biology</div>
                      <div>
                        <Progress value={75} className="h-2 w-[100px]" />
                      </div>
                      <div>In Progress</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Quadratic Equations</div>
                      <div>Mathematics</div>
                      <div>
                        <Progress value={90} className="h-2 w-[100px]" />
                      </div>
                      <div>Almost Complete</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Shakespeare's Macbeth</div>
                      <div>English</div>
                      <div>
                        <Progress value={50} className="h-2 w-[100px]" />
                      </div>
                      <div>In Progress</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>World War II</div>
                      <div>History</div>
                      <div>
                        <Progress value={30} className="h-2 w-[100px]" />
                      </div>
                      <div>Just Started</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Periodic Table</div>
                      <div>Chemistry</div>
                      <div>
                        <Progress value={60} className="h-2 w-[100px]" />
                      </div>
                      <div>In Progress</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="assignments" className="space-y-4 w-full">
            <Card>
              <CardHeader>
                <CardTitle>Current Assignments</CardTitle>
                <CardDescription>Track your assignments and due dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-4 font-medium">
                    <div>Assignment</div>
                    <div>Subject</div>
                    <div>Due Date</div>
                    <div>Status</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-4 p-4">
                      <div>Lab Report: Cell Observation</div>
                      <div>Biology</div>
                      <div>Oct 10, 2023</div>
                      <div>Not Started</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Problem Set: Quadratic Functions</div>
                      <div>Mathematics</div>
                      <div>Oct 12, 2023</div>
                      <div>In Progress</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Essay: Character Analysis</div>
                      <div>English</div>
                      <div>Oct 15, 2023</div>
                      <div>Not Started</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Research Paper: WWII Impact</div>
                      <div>History</div>
                      <div>Oct 20, 2023</div>
                      <div>Not Started</div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Lab Report: Element Reactions</div>
                      <div>Chemistry</div>
                      <div>Oct 18, 2023</div>
                      <div>Not Started</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="progress" className="space-y-4 w-full">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 w-full">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Grade Trends</CardTitle>
                  <CardDescription>Your performance over time</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Grade trends chart will appear here
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Comparison across subjects</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Subject performance chart will appear here
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Learning Achievements</CardTitle>
                <CardDescription>Badges and accomplishments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-pelican-100 flex items-center justify-center mb-2">
                      <CheckCircle className="h-8 w-8 text-pelican" />
                    </div>
                    <span className="text-sm font-medium">Perfect Attendance</span>
                  </div>
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-pelican-100 flex items-center justify-center mb-2">
                      <BookOpen className="h-8 w-8 text-pelican" />
                    </div>
                    <span className="text-sm font-medium">Science Whiz</span>
                  </div>
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-pelican-100 flex items-center justify-center mb-2">
                      <BarChart3 className="h-8 w-8 text-pelican" />
                    </div>
                    <span className="text-sm font-medium">Math Master</span>
                  </div>
                  <div className="flex flex-col items-center p-4 border rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-pelican-100 flex items-center justify-center mb-2">
                      <Clock className="h-8 w-8 text-pelican" />
                    </div>
                    <span className="text-sm font-medium">Early Submitter</span>
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

