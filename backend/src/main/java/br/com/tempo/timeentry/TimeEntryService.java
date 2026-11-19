package br.com.tempo.timeentry;

import br.com.tempo.card.Card;
import br.com.tempo.card.CardRepository;
import br.com.tempo.error.BusinessRuleException;
import br.com.tempo.error.InvalidRequestException;
import br.com.tempo.error.ResourceNotFoundException;
import br.com.tempo.timeentry.dto.CardTimeResponse;
import br.com.tempo.timeentry.dto.ManualTimeEntryRequest;
import br.com.tempo.timeentry.dto.StartTimeEntryRequest;
import br.com.tempo.timeentry.dto.TimeEntryResponse;
import br.com.tempo.user.CurrentUser;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
public class TimeEntryService {

    private final TimeEntryRepository timeEntryRepository;
    private final CardRepository cardRepository;
    private final CurrentUser currentUser;

    public TimeEntryService(TimeEntryRepository timeEntryRepository, CardRepository cardRepository, CurrentUser currentUser) {
        this.timeEntryRepository = timeEntryRepository;
        this.cardRepository = cardRepository;
        this.currentUser = currentUser;
    }

    @Transactional
    public TimeEntryResponse start(Long cardId, StartTimeEntryRequest request) {
        Card card = cardRepository.findByIdAndColumnBoardUserId(cardId,
                currentUser.id()).orElseThrow(() -> new ResourceNotFoundException("Card", cardId));

        if (timeEntryRepository.findTimeEntryByUserIdAndEndedAtIsNull(currentUser.id()).isPresent()) {
            throw new BusinessRuleException("User can only have one open time entry");
        }

        String description = request != null ? normalizeDescription(request.description()) : null;

        TimeEntry timeEntry = new TimeEntry(
                card,
                currentUser.reference(),
                Instant.now(),
                description);
        timeEntryRepository.save(timeEntry);

        return TimeEntryResponse.from(timeEntry);
    }

    @Transactional
    public TimeEntryResponse stop(Long timeEntryId) {
        TimeEntry timeEntry = timeEntryRepository.findTimeEntryByIdAndUserId(timeEntryId,
                currentUser.id()).orElseThrow(
                        () -> new ResourceNotFoundException("Time entry", timeEntryId));

        if (timeEntry.getEndedAt() != null) throw new BusinessRuleException("Time entry has already ended");

        timeEntry.setEndedAt(Instant.now());
        return TimeEntryResponse.from(timeEntry);
    }

    @Transactional(readOnly = true)
    public CardTimeResponse getCardTime(Long cardId) {
        Card card = cardRepository.findByIdAndColumnBoardUserId(cardId,
                currentUser.id()).orElseThrow(() -> new ResourceNotFoundException("Card", cardId));
        List<TimeEntry> timeEntries = timeEntryRepository.findTimeEntryByCardIdAndEndedAtIsNotNull(card.getId());

        long totalSeconds = 0;
        for (TimeEntry timeEntry : timeEntries) {
            totalSeconds = totalSeconds + (timeEntry.getEndedAt().getEpochSecond() - timeEntry.getStartedAt().getEpochSecond());
        }

        CardTimeResponse.Running running = timeEntryRepository.findTimeEntryByCardIdAndEndedAtIsNull(cardId)
                .map(timeEntry -> new CardTimeResponse.Running(timeEntry.getId(),
                timeEntry.getStartedAt())).orElse(null);
        return new CardTimeResponse(cardId, totalSeconds, running);
    }

    @Transactional
    public TimeEntryResponse create(Long cardId, ManualTimeEntryRequest request) {
        Card card = cardRepository.findByIdAndColumnBoardUserId(cardId,
                currentUser.id()).orElseThrow(() -> new ResourceNotFoundException("Card", cardId));
        Interval interval = toInterval(request);

        if (timeEntryRepository.existsOverlapping(currentUser.id(), interval.start(), interval.end())) {
            throw new BusinessRuleException("Time entry overlaps another time entry");
        }

        TimeEntry timeEntry = new TimeEntry(card, currentUser.reference(), interval.start(),
                normalizeDescription(request.description()));
        timeEntry.setEndedAt(interval.end());
        timeEntryRepository.save(timeEntry);

        return TimeEntryResponse.from(timeEntry);
    }

    @Transactional
    public TimeEntryResponse update(Long timeEntryId, ManualTimeEntryRequest request) {
        TimeEntry timeEntry = timeEntryRepository.findTimeEntryByIdAndUserId(timeEntryId,
                currentUser.id()).orElseThrow(
                        () -> new ResourceNotFoundException("Time entry", timeEntryId));

        if (timeEntry.getEndedAt() == null) throw new BusinessRuleException("A running time entry cannot be edited");

        Interval interval = toInterval(request);
        if (timeEntryRepository.existsOverlappingExcluding(currentUser.id(), timeEntryId,
                interval.start(), interval.end())) {
            throw new BusinessRuleException("Time entry overlaps another time entry");
        }

        timeEntry.setStartedAt(interval.start());
        timeEntry.setEndedAt(interval.end());
        timeEntry.setDescription(normalizeDescription(request.description()));
        return TimeEntryResponse.from(timeEntry);
    }

    @Transactional(readOnly = true)
    public List<TimeEntryResponse> listByDate(LocalDate date, String timeZone) {
        ZoneId zone = parseZone(timeZone);
        Instant from = date.atStartOfDay(zone).toInstant();
        Instant to = date.plusDays(1).atStartOfDay(zone).toInstant();

        return timeEntryRepository.findStartedBetween(currentUser.id(), from, to).stream()
                .map(TimeEntryResponse::from)
                .toList();
    }

    private static Interval toInterval(ManualTimeEntryRequest request) {
        ZoneId zone = parseZone(request.timeZone());
        Instant start = ZonedDateTime.of(request.date(), request.startTime(), zone).toInstant();
        Instant end = ZonedDateTime.of(request.date(), request.endTime(), zone).toInstant();

        if (!end.isAfter(start)) throw new BusinessRuleException("End time must be after start time");
        if (end.isAfter(Instant.now())) throw new BusinessRuleException("Time entry cannot end in the future");

        return new Interval(start, end);
    }

    private static ZoneId parseZone(String timeZone) {
        try {
            return ZoneId.of(timeZone);
        } catch (DateTimeException e) {
            throw new InvalidRequestException("Unknown time zone: " + timeZone);
        }
    }

    private static String normalizeDescription(String description) {
        return description != null && !description.isBlank() ? description.trim() : null;
    }

    private record Interval(Instant start, Instant end) {
    }
}
