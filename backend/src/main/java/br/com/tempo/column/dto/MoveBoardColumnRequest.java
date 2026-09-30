package br.com.tempo.column.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record MoveBoardColumnRequest(
        @NotNull @PositiveOrZero Integer position
) {
}
