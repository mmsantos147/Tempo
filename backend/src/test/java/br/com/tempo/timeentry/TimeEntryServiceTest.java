package br.com.tempo.timeentry;

import br.com.tempo.board.BoardService;
import br.com.tempo.board.dto.BoardRequest;
import br.com.tempo.card.CardRepository;
import br.com.tempo.card.CardService;
import br.com.tempo.card.dto.CardRequest;
import br.com.tempo.column.BoardColumnService;
import br.com.tempo.column.dto.BoardColumnRequest;
import br.com.tempo.error.BusinessRuleException;
import br.com.tempo.error.InvalidRequestException;
import br.com.tempo.error.ResourceNotFoundException;
import br.com.tempo.support.ServiceTest;
import br.com.tempo.timeentry.dto.ManualTimeEntryRequest;
import br.com.tempo.timeentry.dto.TimeEntryResponse;
import br.com.tempo.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TimeEntryServiceTest extends ServiceTest {

    static final String ZONE = "America/Sao_Paulo";
    static final LocalDate DAY = LocalDate.of(2026, 10, 15);

    @Autowired
    BoardService boardService;
    @Autowired
    BoardColumnService columnService;
    @Autowired
    CardService cardService;
    @Autowired
    CardRepository cardRepository;
    @Autowired
    TimeEntryService timeEntryService;
    @Autowired
    TimeEntryRepository timeEntryRepository;

    User user;
    Long cardId;

    @BeforeEach
    void setUp() {
        user = signInAsNewUser();
        Long boardId = boardService.create(new BoardRequest("Board")).id();
        Long columnId = columnService.create(boardId, new BoardColumnRequest("To do")).id();
        cardId = cardService.create(columnId, new CardRequest("Write tests", null, null)).id();
    }

    @Test
    void createConvertsLocalTimesInTheGivenZone() {
        TimeEntryResponse entry = timeEntryService.create(cardId, request(DAY, "09:00", "10:30", "  notes  "));

        assertThat(entry.startedAt()).isEqualTo(Instant.parse("2026-10-15T12:00:00Z"));
        assertThat(entry.endedAt()).isEqualTo(Instant.parse("2026-10-15T13:30:00Z"));
        assertThat(entry.cardTitle()).isEqualTo("Write tests");
        assertThat(entry.description()).isEqualTo("notes");
    }

    @Test
    void blankDescriptionIsStoredAsNull() {
        assertThat(timeEntryService.create(cardId, request(DAY, "09:00", "10:00", "   ")).description()).isNull();
    }

    @Test
    void endMustBeAfterStart() {
        assertThatThrownBy(() -> timeEntryService.create(cardId, request(DAY, "10:00", "10:00", null)))
                .isInstanceOf(BusinessRuleException.class);
        assertThatThrownBy(() -> timeEntryService.create(cardId, request(DAY, "11:00", "10:00", null)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void cannotEndInTheFuture() {
        LocalDate tomorrow = LocalDate.now().plusDays(2);
        assertThatThrownBy(() -> timeEntryService.create(cardId, request(tomorrow, "09:00", "10:00", null)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void unknownTimeZoneIsABadRequest() {
        ManualTimeEntryRequest request = new ManualTimeEntryRequest(DAY, LocalTime.of(9, 0), LocalTime.of(10, 0),
                "Mars/Olympus", null);

        assertThatThrownBy(() -> timeEntryService.create(cardId, request)).isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> timeEntryService.listByDate(DAY, "Mars/Olympus"))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void overlappingEntriesAreRejected() {
        timeEntryService.create(cardId, request(DAY, "09:00", "10:00", null));

        assertThatThrownBy(() -> timeEntryService.create(cardId, request(DAY, "09:30", "10:30", null)))
                .isInstanceOf(BusinessRuleException.class);
        assertThatThrownBy(() -> timeEntryService.create(cardId, request(DAY, "08:00", "11:00", null)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void adjacentEntriesDoNotOverlap() {
        timeEntryService.create(cardId, request(DAY, "09:00", "10:00", null));
        timeEntryService.create(cardId, request(DAY, "10:00", "11:00", null));
        timeEntryService.create(cardId, request(DAY, "08:00", "09:00", null));

        assertThat(timeEntryService.listByDate(DAY, ZONE)).hasSize(3);
    }

    @Test
    void openTimerCountsUntilNow() {
        Instant timerStart = Instant.parse("2026-10-15T11:00:00Z");
        timeEntryRepository.save(new TimeEntry(cardRepository.getReferenceById(cardId), user, timerStart, null));

        assertThatThrownBy(() -> timeEntryService.create(cardId, request(DAY.plusDays(3), "09:00", "10:00", null)))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(timeEntryService.create(cardId, request(DAY, "07:00", "08:00", null)).id()).isNotNull();
    }

    @Test
    void updateIgnoresTheEntryItselfWhenCheckingOverlap() {
        TimeEntryResponse entry = timeEntryService.create(cardId, request(DAY, "09:00", "10:00", null));

        TimeEntryResponse updated = timeEntryService.update(entry.id(), request(DAY, "09:30", "10:30", "moved"));

        assertThat(updated.startedAt()).isEqualTo(Instant.parse("2026-10-15T12:30:00Z"));
        assertThat(updated.endedAt()).isEqualTo(Instant.parse("2026-10-15T13:30:00Z"));
        assertThat(updated.description()).isEqualTo("moved");
    }

    @Test
    void updateCannotOverlapAnotherEntry() {
        TimeEntryResponse first = timeEntryService.create(cardId, request(DAY, "09:00", "10:00", null));
        timeEntryService.create(cardId, request(DAY, "11:00", "12:00", null));

        assertThatThrownBy(() -> timeEntryService.update(first.id(), request(DAY, "09:00", "11:30", null)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void runningEntryCannotBeEdited() {
        TimeEntryResponse running = timeEntryService.start(cardId, null);

        assertThatThrownBy(() -> timeEntryService.update(running.id(), request(DAY, "09:00", "10:00", null)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void listByDateUsesTheLocalDayOfStartedAt() {
        timeEntryService.create(cardId, request(DAY.minusDays(1), "23:00", "23:59", null));
        timeEntryService.create(cardId, request(DAY, "14:00", "15:00", "second"));
        timeEntryService.create(cardId, request(DAY, "00:00", "01:00", "first"));
        timeEntryService.create(cardId, request(DAY.plusDays(1), "00:00", "00:30", null));

        assertThat(timeEntryService.listByDate(DAY, ZONE))
                .extracting(TimeEntryResponse::description)
                .containsExactly("first", "second");
    }

    @Test
    void entriesOfAnotherUserAreInvisible() {
        TimeEntryResponse entry = timeEntryService.create(cardId, request(DAY, "09:00", "10:00", null));
        signInAsNewUser();

        assertThat(timeEntryService.listByDate(DAY, ZONE)).isEmpty();
        assertThatThrownBy(() -> timeEntryService.update(entry.id(), request(DAY, "11:00", "12:00", null)))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> timeEntryService.create(cardId, request(DAY, "11:00", "12:00", null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void entriesOfAnotherUserDoNotCauseOverlap() {
        timeEntryService.create(cardId, request(DAY, "09:00", "10:00", null));
        User other = signInAsNewUser();
        Long boardId = boardService.create(new BoardRequest("Other")).id();
        Long columnId = columnService.create(boardId, new BoardColumnRequest("Col")).id();
        Long otherCard = cardService.create(columnId, new CardRequest("Other card", null, null)).id();

        assertThat(timeEntryService.create(otherCard, request(DAY, "09:00", "10:00", null)).id()).isNotNull();
        assertThat(other.getId()).isNotEqualTo(user.getId());
    }

    private static ManualTimeEntryRequest request(LocalDate date, String start, String end, String description) {
        return new ManualTimeEntryRequest(date, LocalTime.parse(start), LocalTime.parse(end), ZONE, description);
    }
}
