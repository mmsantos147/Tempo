package br.com.tempo.timeentry.dto;

import java.time.Instant;

public record CardTimeResponse(
        Long cardId,
        long totalSeconds,
        Running running
) {

    public record Running(Long timeEntryId, Instant startedAt) {
    }
}
