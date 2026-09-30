package br.com.tempo.card;

import br.com.tempo.card.dto.CardRequest;
import br.com.tempo.card.dto.CardResponse;
import br.com.tempo.card.dto.MoveCardRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CardController {

    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @PostMapping("/columns/{columnId}/cards")
    @ResponseStatus(HttpStatus.CREATED)
    public CardResponse create(@PathVariable Long columnId, @RequestBody @Valid CardRequest request) {
        return cardService.create(columnId, request);
    }

    @GetMapping("/cards/{id}")
    public CardResponse get(@PathVariable Long id) {
        return cardService.get(id);
    }

    @PutMapping("/cards/{id}")
    public CardResponse update(@PathVariable Long id, @RequestBody @Valid CardRequest request) {
        return cardService.update(id, request);
    }

    @PostMapping("/cards/{id}/move")
    public CardResponse move(@PathVariable Long id, @RequestBody @Valid MoveCardRequest request) {
        return cardService.move(id, request);
    }

    @PostMapping("/cards/{id}/complete")
    public CardResponse complete(@PathVariable Long id) {
        return cardService.complete(id);
    }

    @PostMapping("/cards/{id}/reopen")
    public CardResponse reopen(@PathVariable Long id) {
        return cardService.reopen(id);
    }

    @DeleteMapping("/cards/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        cardService.delete(id);
    }
}
