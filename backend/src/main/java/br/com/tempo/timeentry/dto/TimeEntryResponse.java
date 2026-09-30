package br.com.tempo.timeentry.dto;

import br.com.tempo.timeentry.TimeEntry;

import java.time.Instant;

public record TimeEntryResponse(
        Long id,
        Long cardId,
        Instant startedAt,
        Instant endedAt,
        String description
) {

    public static TimeEntryResponse from(TimeEntry timeEntry) {
        return new TimeEntryResponse(
                timeEntry.getId(),
                timeEntry.getCard().getId(),
                timeEntry.getStartedAt(),
                timeEntry.getEndedAt(),
                timeEntry.getDescription());
    }
}
