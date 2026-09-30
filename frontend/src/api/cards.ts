import type { Card, CardInput } from '../types'
import { request } from './client'

export const cardsApi = {
  create: (columnId: number, input: CardInput) => request<Card>('POST', `/columns/${columnId}/cards`, input),
  update: (id: number, input: CardInput) => request<Card>('PUT', `/cards/${id}`, input),
  move: (id: number, columnId: number, position: number) =>
    request<Card>('POST', `/cards/${id}/move`, { columnId, position }),
  complete: (id: number) => request<Card>('POST', `/cards/${id}/complete`),
  reopen: (id: number) => request<Card>('POST', `/cards/${id}/reopen`),
  remove: (id: number) => request<void>('DELETE', `/cards/${id}`),
}
