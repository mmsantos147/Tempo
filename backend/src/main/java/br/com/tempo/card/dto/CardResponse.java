package br.com.tempo.card.dto;

import br.com.tempo.card.Card;

import java.time.Instant;

public record CardResponse(
        Long id,
        Long columnId,
        String title,
        String description,
        int position,
        Integer estimatedMinutes,
        Instant createdAt,
        Instant completedAt
) {

    public static CardResponse from(Card card) {
        return new CardResponse(
                card.getId(),
                card.getColumn().getId(),
                card.getTitle(),
                card.getDescription(),
                card.getPosition(),
                card.getEstimatedMinutes(),
                card.getCreatedAt(),
                card.getCompletedAt());
    }
}
