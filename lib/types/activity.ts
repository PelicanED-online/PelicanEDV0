export interface Activity {
  activity_id: string
  lesson_id: string
  order: number | null
  name: string | null
  published?: string
}

export interface ActivityType {
  id: string
  activity_id: string
  type:
    | "reading"
    | "source"
    | "question"
    | "graphic_organizer"
    | "vocabulary"
    | "in_text_source"
    | "image"
    | "reading_addon"
    | "sub_reading"
  order: number
}
