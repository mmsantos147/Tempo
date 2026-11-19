package br.com.tempo.journal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JournalItemRequest(
        @NotBlank @Size(max = 200) String text
) {
}
