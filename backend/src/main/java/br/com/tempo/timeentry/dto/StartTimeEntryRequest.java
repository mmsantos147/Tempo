package br.com.tempo.timeentry.dto;

import jakarta.validation.constraints.Size;

public record StartTimeEntryRequest(
        @Size(max = 500) String description
) {
}
