package br.com.tempo.timeentry;

import br.com.tempo.card.Card;
import br.com.tempo.card.CardRepository;
import br.com.tempo.error.BusinessRuleException;
import br.com.tempo.error.ResourceNotFoundException;
import br.com.tempo.timeentry.dto.CardTimeResponse;
import br.com.tempo.timeentry.dto.StartTimeEntryRequest;
import br.com.tempo.timeentry.dto.TimeEntryResponse;
import br.com.tempo.user.CurrentUser;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
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

        String description = request != null && request.description() != null && !request.description().isBlank() ?
                request.description().trim() : null;

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
}
