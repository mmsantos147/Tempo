package br.com.tempo.timeentry;

import br.com.tempo.timeentry.dto.CardTimeResponse;
import br.com.tempo.timeentry.dto.ManualTimeEntryRequest;
import br.com.tempo.timeentry.dto.StartTimeEntryRequest;
import br.com.tempo.timeentry.dto.TimeEntryResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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
public class TimeEntryController {

    private final TimeEntryService timeEntryService;

    public TimeEntryController(TimeEntryService timeEntryService) {
        this.timeEntryService = timeEntryService;
    }

    @PostMapping("/cards/{cardId}/time-entries/start")
    @ResponseStatus(HttpStatus.CREATED)
    public TimeEntryResponse start(@PathVariable Long cardId,
                                   @RequestBody(required = false) @Valid StartTimeEntryRequest request) {
        return timeEntryService.start(cardId, request);
    }

    @PostMapping("/time-entries/{id}/stop")
    public TimeEntryResponse stop(@PathVariable Long id) {
        return timeEntryService.stop(id);
    }

    @GetMapping("/cards/{cardId}/time")
    public CardTimeResponse getCardTime(@PathVariable Long cardId) {
        return timeEntryService.getCardTime(cardId);
    }

    @PostMapping("/cards/{cardId}/time-entries")
    @ResponseStatus(HttpStatus.CREATED)
    public TimeEntryResponse create(@PathVariable Long cardId, @RequestBody @Valid ManualTimeEntryRequest request) {
        return timeEntryService.create(cardId, request);
    }

    @PutMapping("/time-entries/{id}")
    public TimeEntryResponse update(@PathVariable Long id, @RequestBody @Valid ManualTimeEntryRequest request) {
        return timeEntryService.update(id, request);
    }

    @GetMapping("/time-entries")
    public List<TimeEntryResponse> listByDate(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                              @RequestParam String timeZone) {
        return timeEntryService.listByDate(date, timeZone);
    }
}
