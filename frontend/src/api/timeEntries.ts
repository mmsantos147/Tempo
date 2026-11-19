import type { CardTime, TimeEntry, TimeEntryInput } from '../types'
import { APP_TIME_ZONE } from '../utils/time'
import { request } from './client'

const withTimeZone = (input: TimeEntryInput) => ({ ...input, timeZone: APP_TIME_ZONE })

export const timeEntriesApi = {
  start: (cardId: number) => request<TimeEntry>('POST', `/cards/${cardId}/time-entries/start`),
  stop: (timeEntryId: number) => request<TimeEntry>('POST', `/time-entries/${timeEntryId}/stop`),
  cardTime: (cardId: number) => request<CardTime>('GET', `/cards/${cardId}/time`),
  create: (cardId: number, input: TimeEntryInput) =>
    request<TimeEntry>('POST', `/cards/${cardId}/time-entries`, withTimeZone(input)),
  update: (id: number, input: TimeEntryInput) => request<TimeEntry>('PUT', `/time-entries/${id}`, withTimeZone(input)),
  listByDate: (date: string) =>
    request<TimeEntry[]>('GET', `/time-entries?${new URLSearchParams({ date, timeZone: APP_TIME_ZONE })}`),
}
