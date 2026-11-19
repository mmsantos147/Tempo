package br.com.tempo.journal;

import br.com.tempo.card.Card;
import br.com.tempo.card.CardService;
import br.com.tempo.card.dto.CardRequest;
import br.com.tempo.card.dto.CardResponse;
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
import br.com.tempo.user.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class JournalService {

    private static final long MAX_RANGE_DAYS = 366;

    private final JournalEntryRepository entryRepository;
    private final JournalItemRepository itemRepository;
    private final CardService cardService;
    private final CurrentUser currentUser;

    public JournalService(JournalEntryRepository entryRepository,
                          JournalItemRepository itemRepository,
                          CardService cardService,
                          CurrentUser currentUser) {
        this.entryRepository = entryRepository;
        this.itemRepository = itemRepository;
        this.cardService = cardService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<LocalDate> listDates(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new InvalidRequestException("'from' must not be after 'to'");
        }
        if (ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) {
            throw new InvalidRequestException("The range cannot be longer than " + MAX_RANGE_DAYS + " days");
        }
        return entryRepository.findDatesBetween(currentUser.id(), from, to);
    }

    @Transactional(readOnly = true)
    public JournalEntryResponse get(LocalDate date) {
        JournalEntry entry = entryRepository.findByUserIdAndEntryDate(currentUser.id(), date)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry", date));
        return toResponse(entry);
    }

    @Transactional
    public JournalEntrySaveResult save(LocalDate date, JournalEntryRequest request) {
        requireNotFuture(date);
        boolean created = entryRepository.insertIfAbsent(currentUser.id(), date) > 0;
        JournalEntry entry = findOwnEntry(date);

        entry.setWhatIDid(normalizeText(request.whatIDid()));
        entry.setHowIFelt(normalizeText(request.howIFelt()));
        entryRepository.flush();

        return new JournalEntrySaveResult(toResponse(entry), created);
    }

    @Transactional
    public JournalItemResponse addItem(LocalDate date, JournalItemRequest request) {
        requireNotFuture(date);
        entryRepository.insertIfAbsent(currentUser.id(), date);
        JournalEntry entry = findOwnEntry(date);

        int position = itemRepository.countByEntryId(entry.getId());
        JournalItem item = itemRepository.save(new JournalItem(entry, request.text().trim(), position));
        return JournalItemResponse.from(item);
    }

    @Transactional
    public JournalItemResponse updateItem(Long itemId, JournalItemRequest request) {
        JournalItem item = findItem(itemId);
        item.setText(request.text().trim());
        return JournalItemResponse.from(item);
    }

    @Transactional
    public JournalItemResponse moveItem(Long itemId, MoveJournalItemRequest request) {
        JournalItem item = findItem(itemId);
        List<JournalItem> items = itemRepository.findByEntryIdOrderByPositionAsc(item.getEntry().getId());

        items.removeIf(i -> i.getId().equals(item.getId()));
        items.add(Math.min(request.position(), items.size()), item);
        renumber(items);

        return JournalItemResponse.from(item);
    }

    @Transactional
    public void deleteItem(Long itemId) {
        JournalItem item = findItem(itemId);
        List<JournalItem> remaining = itemRepository.findByEntryIdOrderByPositionAsc(item.getEntry().getId());
        remaining.removeIf(i -> i.getId().equals(item.getId()));

        itemRepository.delete(item);
        renumber(remaining);
    }

    @Transactional
    public JournalItemResponse createCard(Long itemId, CreateCardFromItemRequest request) {
        JournalItem item = itemRepository.findForUpdate(itemId, currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Journal item", itemId));
        if (item.getCard() != null) {
            throw new BusinessRuleException("This item already has a card");
        }

        CardResponse created = cardService.create(request.columnId(), new CardRequest(item.getText(), null, null));
        Card card = cardService.findEntity(created.id());
        item.setCard(card);

        return JournalItemResponse.from(item);
    }

    private JournalEntry findOwnEntry(LocalDate date) {
        return entryRepository.findByUserIdAndEntryDate(currentUser.id(), date)
                .orElseThrow(() -> new ResourceNotFoundException("Journal entry", date));
    }

    private JournalItem findItem(Long itemId) {
        return itemRepository.findByIdAndEntryUserId(itemId, currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Journal item", itemId));
    }

    private JournalEntryResponse toResponse(JournalEntry entry) {
        return JournalEntryResponse.from(entry, itemRepository.findWithCardsByEntryId(entry.getId()));
    }

    private static void requireNotFuture(LocalDate date) {
        LocalDate latestToday = LocalDate.now(ZoneOffset.MAX);
        if (date.isAfter(latestToday)) {
            throw new BusinessRuleException("Journal entries cannot be written for future dates");
        }
    }

    private static String normalizeText(String text) {
        return text == null || text.isBlank() ? null : text;
    }

    private static void renumber(List<JournalItem> items) {
        for (int i = 0; i < items.size(); i++) {
            items.get(i).setPosition(i);
        }
    }
}
