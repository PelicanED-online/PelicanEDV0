"use client"

import { useCallback } from "react"
import { useActivities } from "./lesson/useActivities"

export function useDragAndDrop() {
  const { activities, setActivities, activityTypes, setActivityTypes } = useActivities()

  const handleDragEnd = useCallback(
    (result: any) => {
      if (!result.destination) return

      const { source, destination, type } = result

      // Handle activity reordering
      if (type === "activities") {
        const items = Array.from(activities)
        const [reorderedItem] = items.splice(source.index, 1)
        items.splice(destination.index, 0, reorderedItem)

        // Update order property
        const updatedItems = items.map((item, index) => ({
          ...item,
          order: index + 1,
        }))

        setActivities(updatedItems)
      }
      // Handle activity type reordering within an activity
      else if (type.startsWith("activity-types-")) {
        const activityId = type.replace("activity-types-", "")
        const types = Array.from(activityTypes[activityId] || [])
        const [reorderedItem] = types.splice(source.index, 1)
        types.splice(destination.index, 0, reorderedItem)

        // Update order property
        const updatedTypes = types.map((item, index) => ({
          ...item,
          order: index,
        }))

        setActivityTypes({
          ...activityTypes,
          [activityId]: updatedTypes,
        })
      }
    },
    [activities, activityTypes, setActivities, setActivityTypes],
  )

  return { handleDragEnd }
}
