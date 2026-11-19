package br.com.tempo.journal.dto;

import br.com.tempo.card.Card;
import br.com.tempo.journal.JournalItem;

import java.time.Instant;

public record JournalItemResponse(Long id, String text, int position, LinkedCard card) {

    public static JournalItemResponse from(JournalItem item) {
        return new JournalItemResponse(item.getId(), item.getText(), item.getPosition(), LinkedCard.from(item.getCard()));
    }

    public record LinkedCard(Long id, String title, Long boardId, Instant completedAt) {

        static LinkedCard from(Card card) {
            if (card == null) {
                return null;
            }
            return new LinkedCard(card.getId(), card.getTitle(), card.getColumn().getBoard().getId(), card.getCompletedAt());
        }
    }
}
