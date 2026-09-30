package br.com.tempo.column;

import br.com.tempo.board.Board;
import br.com.tempo.board.BoardService;
import br.com.tempo.column.dto.BoardColumnRequest;
import br.com.tempo.column.dto.BoardColumnResponse;
import br.com.tempo.column.dto.MoveBoardColumnRequest;
import br.com.tempo.error.ResourceNotFoundException;
import br.com.tempo.user.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BoardColumnService {

    private final BoardColumnRepository columnRepository;
    private final BoardService boardService;
    private final CurrentUser currentUser;

    public BoardColumnService(BoardColumnRepository columnRepository, BoardService boardService, CurrentUser currentUser) {
        this.columnRepository = columnRepository;
        this.boardService = boardService;
        this.currentUser = currentUser;
    }

    @Transactional
    public BoardColumnResponse create(Long boardId, BoardColumnRequest request) {
        Board board = boardService.findEntity(boardId);
        int position = columnRepository.countByBoardId(boardId);
        BoardColumn column = columnRepository.save(new BoardColumn(board, request.name().trim(), position));
        return BoardColumnResponse.from(column);
    }

    @Transactional
    public BoardColumnResponse update(Long id, BoardColumnRequest request) {
        BoardColumn column = findEntity(id);
        column.setName(request.name().trim());
        return BoardColumnResponse.from(column);
    }

    @Transactional
    public BoardColumnResponse move(Long id, MoveBoardColumnRequest request) {
        BoardColumn column = findEntity(id);
        List<BoardColumn> columns = columnRepository.findByBoardIdOrderByPositionAsc(column.getBoard().getId());

        columns.removeIf(c -> c.getId().equals(column.getId()));
        columns.add(Math.min(request.position(), columns.size()), column);
        renumber(columns);

        return BoardColumnResponse.from(column);
    }

    @Transactional
    public void delete(Long id) {
        BoardColumn column = findEntity(id);
        List<BoardColumn> remaining = columnRepository.findByBoardIdOrderByPositionAsc(column.getBoard().getId());
        remaining.removeIf(c -> c.getId().equals(column.getId()));

        columnRepository.delete(column);
        renumber(remaining);
    }

    @Transactional(readOnly = true)
    public BoardColumn findEntity(Long id) {
        return columnRepository.findByIdAndBoardUserId(id, currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Column", id));
    }

    private static void renumber(List<BoardColumn> columns) {
        for (int i = 0; i < columns.size(); i++) {
            columns.get(i).setPosition(i);
        }
    }
}
