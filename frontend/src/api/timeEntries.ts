import type { CardTime, TimeEntry } from '../types'
import { request } from './client'

export const timeEntriesApi = {
  start: (cardId: number) => request<TimeEntry>('POST', `/cards/${cardId}/time-entries/start`),
  stop: (timeEntryId: number) => request<TimeEntry>('POST', `/time-entries/${timeEntryId}/stop`),
  cardTime: (cardId: number) => request<CardTime>('GET', `/cards/${cardId}/time`),
}
