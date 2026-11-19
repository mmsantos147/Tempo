package br.com.tempo.journal;

import br.com.tempo.journal.dto.CreateCardFromItemRequest;
import br.com.tempo.journal.dto.JournalEntryRequest;
import br.com.tempo.journal.dto.JournalEntryResponse;
import br.com.tempo.journal.dto.JournalEntrySaveResult;
import br.com.tempo.journal.dto.JournalItemRequest;
import br.com.tempo.journal.dto.JournalItemResponse;
import br.com.tempo.journal.dto.MoveJournalItemRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
public class JournalController {

    private final JournalService journalService;

    public JournalController(JournalService journalService) {
        this.journalService = journalService;
    }

    @GetMapping("/journal")
    public List<LocalDate> listDates(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                     @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return journalService.listDates(from, to);
    }

    @GetMapping("/journal/{date}")
    public JournalEntryResponse get(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return journalService.get(date);
    }

    @PutMapping("/journal/{date}")
    public ResponseEntity<JournalEntryResponse> save(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                                     @RequestBody @Valid JournalEntryRequest request) {
        JournalEntrySaveResult result = journalService.save(date, request);
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK).body(result.entry());
    }

    @PostMapping("/journal/{date}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public JournalItemResponse addItem(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                       @RequestBody @Valid JournalItemRequest request) {
        return journalService.addItem(date, request);
    }

    @PutMapping("/journal-items/{id}")
    public JournalItemResponse updateItem(@PathVariable Long id, @RequestBody @Valid JournalItemRequest request) {
        return journalService.updateItem(id, request);
    }

    @PostMapping("/journal-items/{id}/move")
    public JournalItemResponse moveItem(@PathVariable Long id, @RequestBody @Valid MoveJournalItemRequest request) {
        return journalService.moveItem(id, request);
    }

    @DeleteMapping("/journal-items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable Long id) {
        journalService.deleteItem(id);
    }

    @PostMapping("/journal-items/{id}/create-card")
    @ResponseStatus(HttpStatus.CREATED)
    public JournalItemResponse createCard(@PathVariable Long id, @RequestBody @Valid CreateCardFromItemRequest request) {
        return journalService.createCard(id, request);
    }
}
