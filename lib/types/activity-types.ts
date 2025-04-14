export interface Reading {
  activity_id: string
  reading_id: string
  reading_title?: string
  reaing_text?: string
  order?: number
  published?: string
}

export interface ReadingAddon {
  activity_id: string
  reading_id?: string
  reaing_text?: string
  order?: number
  published?: string
}

export interface Source {
  activity_id: string
  source_id: string
  image_location?: string
  order?: number
  published?: string
  source_image_description?: string
  source_title_ce?: string
  source_title_ad?: string
  source_text?: string
  source_image?: string
}

export interface InTextSource {
  activity_id: string
  in_text_source_id?: string
  source_title_ad?: string
  source_title_ce?: string
  source_intro?: string
  source_text?: string
  order?: number
  published?: string
}

export interface Question {
  activity_id: string
  question_id?: string
  order?: number
  published?: string
  question?: string
  question_text?: string
  question_title?: string
  question_type?: string
  answerOptions?: {
    question_choices_id?: string
    choice_text: string
    is_correct: boolean
    order: number
  }[]
  partB?: string
}

export interface GraphicOrganizer {
  activity_id: string
  go_id?: string
  content?: any
  order?: number
  template_type?: string
  published?: string
}

export interface VocabularyItem {
  id?: string
  word: string
  definition: string
  order?: number
  vocab_order?: number
}

export interface Vocabulary {
  activity_id: string
  order?: number
  published?: string
  items: VocabularyItem[]
}

export interface ImageActivity {
  activity_id: string
  image_id?: string
  img_url?: string
  img_title?: string
  description_title?: string
  description?: string
  alt?: string
  position?: string
  published?: string
  order?: number
}

export interface SubReading {
  activity_id: string
  reading_id: string
  reading_title?: string
  reaing_text?: string
  order?: number
  published?: string
}
