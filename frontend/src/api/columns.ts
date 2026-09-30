import type { BoardColumn } from '../types'
import { request } from './client'

export const columnsApi = {
  create: (boardId: number, name: string) => request<BoardColumn>('POST', `/boards/${boardId}/columns`, { name }),
  update: (id: number, name: string) => request<BoardColumn>('PUT', `/columns/${id}`, { name }),
  move: (id: number, position: number) => request<BoardColumn>('POST', `/columns/${id}/move`, { position }),
  remove: (id: number) => request<void>('DELETE', `/columns/${id}`),
}
