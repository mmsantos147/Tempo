package br.com.tempo.journal.dto;

import jakarta.validation.constraints.NotNull;

public record CreateCardFromItemRequest(
        @NotNull Long columnId
) {
}
