import type { Card, ColumnDetail } from '../types'

export function withPositions(columns: ColumnDetail[]): ColumnDetail[] {
  return columns.map((column, columnIndex) => ({
    ...column,
    position: columnIndex,
    cards: column.cards.map((card, cardIndex) => ({ ...card, columnId: column.id, position: cardIndex })),
  }))
}

export function findCard(columns: ColumnDetail[], cardId: number): Card | undefined {
  for (const column of columns) {
    const card = column.cards.find((c) => c.id === cardId)
    if (card) return card
  }
  return undefined
}

export function allCardIds(columns: ColumnDetail[]): number[] {
  return columns.flatMap((column) => column.cards.map((card) => card.id))
}
