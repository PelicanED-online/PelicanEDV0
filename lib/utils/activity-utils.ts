import type { ActivityType } from "@/lib/types/activity"
import {
  FileText,
  BookPlus,
  LibraryBig,
  NotepadText,
  HelpCircle,
  LayoutGrid,
  BookOpen,
  ImageIcon,
  BookDown,
} from "lucide-react"
import type React from "react"

export function getActivityTypeIcon(type: ActivityType["type"]): React.ReactNode {
  switch (type) {
    case "reading":
      return <FileText className="h-4 w-4" />
    case "reading_addon":
      return <BookPlus className="h-4 w-4" />
    case "source":
      return <LibraryBig className="h-4 w-4" />
    case "in_text_source":
      return <NotepadText className="h-4 w-4" />
    case "question":
      return <HelpCircle className="h-4 w-4" />
    case "graphic_organizer":
      return <LayoutGrid className="h-4 w-4" />
    case "vocabulary":
      return <BookOpen className="h-4 w-4" />
    case "image":
      return <ImageIcon className="h-4 w-4" />
    case "sub_reading":
      return <BookDown className="h-4 w-4" />
  }
}

export function getActivityTypePreview(activityType: ActivityType, details: any): string {
  if (!details) return "No content yet"

  switch (activityType.type) {
    case "reading":
      return details.reading_title || "Untitled Reading"
    case "reading_addon":
      const addonText = details.reaing_text
      return addonText ? (addonText.length > 50 ? addonText.substring(0, 50) + "..." : addonText) : "Reading Addon"
    case "source":
      return details.source_title_ce || "Untitled Source"
    case "in_text_source":
      return details.source_title_ce || "Untitled In-Text Source"
    case "question":
      // Use question_title if available, otherwise fall back to question text
      if (details.question_title) {
        return details.question_title
      }
      // Fallback to question text for backward compatibility
      const question = details.question || details.question_text
      return question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : "Untitled Question"
    case "graphic_organizer":
      return details.template_type || "Untitled Organizer"
    case "vocabulary":
      const vocabItems = details.items || []
      return vocabItems.length > 0
        ? `Vocabulary (${vocabItems.length} ${vocabItems.length === 1 ? "term" : "terms"})`
        : "Vocabulary (empty)"
    case "image":
      return details.img_title || "Untitled Image"
    case "sub_reading":
      return details.reading_title || "Untitled Sub-Reading"
  }
}
