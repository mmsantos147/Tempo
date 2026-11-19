package br.com.tempo.journal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record MoveJournalItemRequest(
        @NotNull @PositiveOrZero Integer position
) {
}
