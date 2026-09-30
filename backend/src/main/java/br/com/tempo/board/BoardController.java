package br.com.tempo.board;

import br.com.tempo.board.dto.BoardDetailResponse;
import br.com.tempo.board.dto.BoardRequest;
import br.com.tempo.board.dto.BoardSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/boards")
public class BoardController {

    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    @GetMapping
    public List<BoardSummaryResponse> list() {
        return boardService.list();
    }

    @GetMapping("/{id}")
    public BoardDetailResponse get(@PathVariable Long id) {
        return boardService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BoardSummaryResponse create(@RequestBody @Valid BoardRequest request) {
        return boardService.create(request);
    }

    @PutMapping("/{id}")
    public BoardSummaryResponse update(@PathVariable Long id, @RequestBody @Valid BoardRequest request) {
        return boardService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        boardService.delete(id);
    }
}
