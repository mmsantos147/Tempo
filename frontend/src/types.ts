export interface User {
  id: number
  name: string
  email: string
}

export interface BoardSummary {
  id: number
  name: string
  createdAt: string
}

export interface Card {
  id: number
  columnId: number
  title: string
  description: string | null
  position: number
  estimatedMinutes: number | null
  createdAt: string
  completedAt: string | null
}

export interface ColumnDetail {
  id: number
  name: string
  position: number
  cards: Card[]
}

export interface BoardDetail {
  id: number
  name: string
  createdAt: string
  columns: ColumnDetail[]
}

export interface BoardColumn {
  id: number
  boardId: number
  name: string
  position: number
}

export interface CardInput {
  title: string
  description: string | null
  estimatedMinutes: number | null
}

export interface TimeEntry {
  id: number
  cardId: number
  cardTitle: string
  startedAt: string
  endedAt: string | null
  description: string | null
}

export interface RunningTimeEntry {
  timeEntryId: number
  startedAt: string
}

export interface CardTime {
  cardId: number
  totalSeconds: number
  running: RunningTimeEntry | null
}

export interface TimeEntryInput {
  date: string
  startTime: string
  endTime: string
  description: string | null
}

export interface LinkedCard {
  id: number
  title: string
  boardId: number
  completedAt: string | null
}

export interface JournalItem {
  id: number
  text: string
  position: number
  card: LinkedCard | null
}

export interface JournalTexts {
  whatIDid: string
  howIFelt: string
}

export interface JournalEntry {
  date: string
  whatIDid: string | null
  howIFelt: string | null
  createdAt: string
  updatedAt: string
  items: JournalItem[]
}
