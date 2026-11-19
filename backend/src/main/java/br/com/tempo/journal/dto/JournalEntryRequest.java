package br.com.tempo.journal.dto;

import jakarta.validation.constraints.Size;

public record JournalEntryRequest(
        @Size(max = 50_000) String whatIDid,
        @Size(max = 50_000) String howIFelt
) {
}
