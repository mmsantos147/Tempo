import type { BoardDetail, BoardSummary } from '../types'
import { request } from './client'

export const boardsApi = {
  list: () => request<BoardSummary[]>('GET', '/boards'),
  get: (id: number) => request<BoardDetail>('GET', `/boards/${id}`),
  create: (name: string) => request<BoardSummary>('POST', '/boards', { name }),
  update: (id: number, name: string) => request<BoardSummary>('PUT', `/boards/${id}`, { name }),
  remove: (id: number) => request<void>('DELETE', `/boards/${id}`),
}
