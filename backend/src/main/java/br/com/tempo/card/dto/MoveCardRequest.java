package br.com.tempo.card.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record MoveCardRequest(
        @NotNull Long columnId,
        @NotNull @PositiveOrZero Integer position
) {
}
