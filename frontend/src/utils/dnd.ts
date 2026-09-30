import type { UniqueIdentifier } from '@dnd-kit/core'

const CARD_PREFIX = 'card-'
const COLUMN_PREFIX = 'column-'

export const cardDndId = (cardId: number) => `${CARD_PREFIX}${cardId}`
export const columnDndId = (columnId: number) => `${COLUMN_PREFIX}${columnId}`

export function parseDndId(id: UniqueIdentifier): { type: 'card' | 'column'; id: number } | null {
  const value = String(id)
  if (value.startsWith(CARD_PREFIX)) return { type: 'card', id: Number(value.slice(CARD_PREFIX.length)) }
  if (value.startsWith(COLUMN_PREFIX)) return { type: 'column', id: Number(value.slice(COLUMN_PREFIX.length)) }
  return null
}
