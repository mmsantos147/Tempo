package br.com.tempo.card;

import br.com.tempo.card.dto.CardRequest;
import br.com.tempo.card.dto.CardResponse;
import br.com.tempo.card.dto.MoveCardRequest;
import br.com.tempo.column.BoardColumn;
import br.com.tempo.column.BoardColumnService;
import br.com.tempo.error.BusinessRuleException;
import br.com.tempo.error.ResourceNotFoundException;
import br.com.tempo.user.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class CardService {

    private final CardRepository cardRepository;
    private final BoardColumnService columnService;
    private final CurrentUser currentUser;

    public CardService(CardRepository cardRepository, BoardColumnService columnService, CurrentUser currentUser) {
        this.cardRepository = cardRepository;
        this.columnService = columnService;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public CardResponse get(Long id) {
        return CardResponse.from(findEntity(id));
    }

    @Transactional
    public CardResponse create(Long columnId, CardRequest request) {
        BoardColumn column = columnService.findEntity(columnId);
        int position = cardRepository.countByColumnId(columnId);

        Card card = new Card(column, request.title().trim(), position);
        apply(card, request);
        return CardResponse.from(cardRepository.save(card));
    }

    @Transactional
    public CardResponse update(Long id, CardRequest request) {
        Card card = findEntity(id);
        card.setTitle(request.title().trim());
        apply(card, request);
        return CardResponse.from(card);
    }

    @Transactional
    public CardResponse move(Long id, MoveCardRequest request) {
        Card card = findEntity(id);
        BoardColumn source = card.getColumn();
        boolean sameColumn = source.getId().equals(request.columnId());
        BoardColumn target = sameColumn ? source : columnService.findEntity(request.columnId());

        if (!target.getBoard().getId().equals(source.getBoard().getId())) {
            throw new BusinessRuleException("Cannot move a card to a column of another board");
        }

        List<Card> sourceCards = cardRepository.findByColumnIdOrderByPositionAsc(source.getId());
        sourceCards.removeIf(c -> c.getId().equals(card.getId()));

        List<Card> targetCards = sameColumn ? sourceCards : cardRepository.findByColumnIdOrderByPositionAsc(target.getId());
        targetCards.add(Math.min(request.position(), targetCards.size()), card);
        card.setColumn(target);

        renumber(sourceCards);
        if (!sameColumn) {
            renumber(targetCards);
        }
        return CardResponse.from(card);
    }

    @Transactional
    public CardResponse complete(Long id) {
        Card card = findEntity(id);
        if (card.getCompletedAt() == null) {
            card.setCompletedAt(Instant.now());
        }
        return CardResponse.from(card);
    }

    @Transactional
    public CardResponse reopen(Long id) {
        Card card = findEntity(id);
        card.setCompletedAt(null);
        return CardResponse.from(card);
    }

    @Transactional
    public void delete(Long id) {
        Card card = findEntity(id);
        List<Card> remaining = cardRepository.findByColumnIdOrderByPositionAsc(card.getColumn().getId());
        remaining.removeIf(c -> c.getId().equals(card.getId()));

        cardRepository.delete(card);
        renumber(remaining);
    }

    @Transactional(readOnly = true)
    public Card findEntity(Long id) {
        return cardRepository.findByIdAndColumnBoardUserId(id, currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Card", id));
    }

    private static void apply(Card card, CardRequest request) {
        card.setDescription(request.description());
        card.setEstimatedMinutes(request.estimatedMinutes());
    }

    private static void renumber(List<Card> cards) {
        for (int i = 0; i < cards.size(); i++) {
            cards.get(i).setPosition(i);
        }
    }
}
