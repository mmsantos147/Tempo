import type { JournalEntry, JournalItem, JournalTexts } from '../types'
import { request } from './client'

export const journalApi = {
  listDates: (from: string, to: string) =>
    request<string[]>('GET', `/journal?${new URLSearchParams({ from, to })}`),
  get: (date: string) => request<JournalEntry>('GET', `/journal/${date}`),
  save: (date: string, texts: JournalTexts) => request<JournalEntry>('PUT', `/journal/${date}`, texts),
  addItem: (date: string, text: string) => request<JournalItem>('POST', `/journal/${date}/items`, { text }),
  updateItem: (id: number, text: string) => request<JournalItem>('PUT', `/journal-items/${id}`, { text }),
  moveItem: (id: number, position: number) => request<JournalItem>('POST', `/journal-items/${id}/move`, { position }),
  removeItem: (id: number) => request<void>('DELETE', `/journal-items/${id}`),
  createCard: (id: number, columnId: number) =>
    request<JournalItem>('POST', `/journal-items/${id}/create-card`, { columnId }),
}
