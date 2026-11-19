package br.com.tempo.journal.dto;

public record JournalEntrySaveResult(JournalEntryResponse entry, boolean created) {
}
