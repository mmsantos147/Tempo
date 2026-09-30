package br.com.tempo.card.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CardRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 10_000) String description,
        @PositiveOrZero Integer estimatedMinutes
) {
}
