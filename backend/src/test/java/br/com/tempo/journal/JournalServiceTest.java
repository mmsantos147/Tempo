package br.com.tempo.journal;

import br.com.tempo.board.BoardService;
import br.com.tempo.board.dto.BoardRequest;
import br.com.tempo.card.CardService;
import br.com.tempo.column.BoardColumnService;
import br.com.tempo.column.dto.BoardColumnRequest;
import br.com.tempo.error.BusinessRuleException;
import br.com.tempo.error.InvalidRequestException;
import br.com.tempo.error.ResourceNotFoundException;
import br.com.tempo.journal.dto.CreateCardFromItemRequest;
import br.com.tempo.journal.dto.JournalEntryRequest;
import br.com.tempo.journal.dto.JournalEntryResponse;
import br.com.tempo.journal.dto.JournalEntrySaveResult;
import br.com.tempo.journal.dto.JournalItemRequest;
import br.com.tempo.journal.dto.JournalItemResponse;
import br.com.tempo.journal.dto.MoveJournalItemRequest;
import br.com.tempo.support.ServiceTest;
import br.com.tempo.user.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JournalServiceTest extends ServiceTest {

    static final LocalDate DAY = LocalDate.of(2026, 10, 15);

    @Autowired
    JournalService journalService;
    @Autowired
    BoardService boardService;
    @Autowired
    BoardColumnService columnService;
    @Autowired
    CardService cardService;

    @Autowired
    EntityManager entityManager;

    User me;
    Long boardId;
    Long columnId;

    @BeforeEach
    void setUp() {
        me = signInAsNewUser();
        boardId = boardService.create(new BoardRequest("Board")).id();
        columnId = columnService.create(boardId, new BoardColumnRequest("To do")).id();
    }

    @Test
    void saveCreatesThenUpdates() {
        JournalEntrySaveResult created = journalService.save(DAY, new JournalEntryRequest("Coded", "Good"));
        JournalEntrySaveResult updated = journalService.save(DAY, new JournalEntryRequest("Coded a lot", "Tired"));

        assertThat(created.created()).isTrue();
        assertThat(updated.created()).isFalse();
        assertThat(journalService.get(DAY))
                .extracting(JournalEntryResponse::whatIDid, JournalEntryResponse::howIFelt)
                .containsExactly("Coded a lot", "Tired");
    }

    @Test
    void blankTextsAreStoredAsNull() {
        JournalEntryResponse entry = journalService.save(DAY, new JournalEntryRequest("   ", "")).entry();

        assertThat(entry.whatIDid()).isNull();
        assertThat(entry.howIFelt()).isNull();
    }

    @Test
    void missingEntryIsNotFound() {
        assertThatThrownBy(() -> journalService.get(DAY)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void futureDatesCannotBeWritten() {
        LocalDate future = LocalDate.now().plusDays(3);

        assertThatThrownBy(() -> journalService.save(future, new JournalEntryRequest("x", null)))
                .isInstanceOf(BusinessRuleException.class);
        assertThatThrownBy(() -> journalService.addItem(future, new JournalItemRequest("x")))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void listDatesReturnsOnlyDatesInRange() {
        journalService.save(DAY.minusDays(20), new JournalEntryRequest("old", null));
        journalService.save(DAY, new JournalEntryRequest("a", null));
        journalService.save(DAY.minusDays(1), new JournalEntryRequest("b", null));

        assertThat(journalService.listDates(DAY.withDayOfMonth(1), DAY.withDayOfMonth(31)))
                .containsExactly(DAY.minusDays(1), DAY);
    }

    @Test
    void listDatesRejectsInvalidRanges() {
        assertThatThrownBy(() -> journalService.listDates(DAY, DAY.minusDays(1)))
                .isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> journalService.listDates(DAY.minusYears(2), DAY))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void addItemCreatesTheEntryAndAppends() {
        journalService.addItem(DAY, new JournalItemRequest(" first "));
        journalService.addItem(DAY, new JournalItemRequest("second"));

        JournalEntryResponse entry = journalService.get(DAY);
        assertThat(entry.whatIDid()).isNull();
        assertThat(entry.items()).extracting(JournalItemResponse::text).containsExactly("first", "second");
        assertThat(entry.items()).extracting(JournalItemResponse::position).containsExactly(0, 1);
    }

    @Test
    void moveAndDeleteRenumberItems() {
        List<Long> ids = addItems("a", "b", "c", "d");

        journalService.moveItem(ids.get(0), new MoveJournalItemRequest(2));
        assertThat(texts()).containsExactly("b", "c", "a", "d");

        journalService.moveItem(ids.get(3), new MoveJournalItemRequest(99));
        journalService.deleteItem(ids.get(1));
        assertThat(texts()).containsExactly("c", "a", "d");
        assertThat(journalService.get(DAY).items()).extracting(JournalItemResponse::position).containsExactly(0, 1, 2);
    }

    @Test
    void createCardLinksTheItemOnce() {
        Long itemId = addItems("Ship the journal").get(0);

        JournalItemResponse item = journalService.createCard(itemId, new CreateCardFromItemRequest(columnId));

        assertThat(item.card()).isNotNull();
        assertThat(item.card().title()).isEqualTo("Ship the journal");
        assertThat(item.card().boardId()).isEqualTo(boardId);
        assertThat(cardService.get(item.card().id()).columnId()).isEqualTo(columnId);
        assertThat(journalService.get(DAY).items().get(0).card().id()).isEqualTo(item.card().id());
        assertThatThrownBy(() -> journalService.createCard(itemId, new CreateCardFromItemRequest(columnId)))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void deletingTheCardUnlinksTheItem() {
        Long itemId = addItems("Temporary").get(0);
        Long cardId = journalService.createCard(itemId, new CreateCardFromItemRequest(columnId)).card().id();
        endRequest();

        cardService.delete(cardId);
        endRequest();

        assertThat(journalService.get(DAY).items().get(0).card()).isNull();
    }

    @Test
    void anotherUserCannotTouchTheJournal() {
        Long itemId = addItems("mine").get(0);
        signInAsNewUser();
        Long foreignBoard = boardService.create(new BoardRequest("Theirs")).id();
        Long foreignColumn = columnService.create(foreignBoard, new BoardColumnRequest("Col")).id();

        assertThatThrownBy(() -> journalService.get(DAY)).isInstanceOf(ResourceNotFoundException.class);
        assertThat(journalService.listDates(DAY, DAY)).isEmpty();
        assertThatThrownBy(() -> journalService.updateItem(itemId, new JournalItemRequest("theirs")))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> journalService.deleteItem(itemId)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> journalService.createCard(itemId, new CreateCardFromItemRequest(foreignColumn)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createCardRequiresAColumnOfTheCurrentUser() {
        Long itemId = addItems("mine").get(0);
        Long foreignColumn = runAsAnotherUserAndCreateColumn();

        assertThatThrownBy(() -> journalService.createCard(itemId, new CreateCardFromItemRequest(foreignColumn)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private void endRequest() {
        entityManager.flush();
        entityManager.clear();
    }

    private Long runAsAnotherUserAndCreateColumn() {
        signInAsNewUser();
        Long foreignBoard = boardService.create(new BoardRequest("Theirs")).id();
        Long foreignColumn = columnService.create(foreignBoard, new BoardColumnRequest("Col")).id();
        signIn(me);
        return foreignColumn;
    }

    private List<Long> addItems(String... texts) {
        return Arrays.stream(texts)
                .map(text -> journalService.addItem(DAY, new JournalItemRequest(text)).id())
                .toList();
    }

    private List<String> texts() {
        return journalService.get(DAY).items().stream().map(JournalItemResponse::text).toList();
    }
}
