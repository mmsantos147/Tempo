package br.com.tempo.column;

import br.com.tempo.column.dto.BoardColumnRequest;
import br.com.tempo.column.dto.BoardColumnResponse;
import br.com.tempo.column.dto.MoveBoardColumnRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BoardColumnController {

    private final BoardColumnService columnService;

    public BoardColumnController(BoardColumnService columnService) {
        this.columnService = columnService;
    }

    @PostMapping("/boards/{boardId}/columns")
    @ResponseStatus(HttpStatus.CREATED)
    public BoardColumnResponse create(@PathVariable Long boardId, @RequestBody @Valid BoardColumnRequest request) {
        return columnService.create(boardId, request);
    }

    @PutMapping("/columns/{id}")
    public BoardColumnResponse update(@PathVariable Long id, @RequestBody @Valid BoardColumnRequest request) {
        return columnService.update(id, request);
    }

    @PostMapping("/columns/{id}/move")
    public BoardColumnResponse move(@PathVariable Long id, @RequestBody @Valid MoveBoardColumnRequest request) {
        return columnService.move(id, request);
    }

    @DeleteMapping("/columns/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        columnService.delete(id);
    }
}
