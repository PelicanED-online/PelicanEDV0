"use client"

import { useState, useEffect, useCallback } from "react"
import type { Activity, ActivityType } from "@/lib/types/activity"
import { useDragAndDrop } from "@/hooks/use-drag-and-drop"
import * as ActivityDb from "@/lib/db/activities"

export function useActivities(lessonId: string | undefined) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [activityTypes, setActivityTypes] = useState<Record<string, ActivityType[]>>({})
  const [activityTypeDetails, setActivityTypeDetails] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivitiesData() {
      if (!lessonId) return

      setLoading(true)
      try {
        const { data, error } = await ActivityDb.fetchActivities(lessonId)

        if (error) {
          console.error("Error fetching activities:", error)
        } else {
          setActivities(data || [])
        }
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivitiesData()
  }, [lessonId])

  const { handleDragEnd } = useDragAndDrop()

  const saveLesson = useCallback(() => {
    console.log("Saving lesson...")
  }, [])

  const handleAddActivity = useCallback(() => {
    console.log("Adding activity...")
  }, [])

  return {
    activities,
    setActivities,
    activityTypes,
    setActivityTypes,
    activityTypeDetails,
    setActivityTypeDetails,
    loading,
    handleDragEnd,
    saveLesson,
    handleAddActivity,
  }
}
