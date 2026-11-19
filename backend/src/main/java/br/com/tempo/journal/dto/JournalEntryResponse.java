package br.com.tempo.journal.dto;

import br.com.tempo.journal.JournalEntry;
import br.com.tempo.journal.JournalItem;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record JournalEntryResponse(
        LocalDate date,
        String whatIDid,
        String howIFelt,
        Instant createdAt,
        Instant updatedAt,
        List<JournalItemResponse> items
) {

    public static JournalEntryResponse from(JournalEntry entry, List<JournalItem> items) {
        return new JournalEntryResponse(
                entry.getEntryDate(),
                entry.getWhatIDid(),
                entry.getHowIFelt(),
                entry.getCreatedAt(),
                entry.getUpdatedAt(),
                items.stream().map(JournalItemResponse::from).toList());
    }
}
