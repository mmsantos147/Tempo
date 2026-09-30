package br.com.tempo.board;

import br.com.tempo.board.dto.BoardDetailResponse;
import br.com.tempo.board.dto.BoardDetailResponse.ColumnDetail;
import br.com.tempo.board.dto.BoardRequest;
import br.com.tempo.board.dto.BoardSummaryResponse;
import br.com.tempo.card.CardRepository;
import br.com.tempo.card.dto.CardResponse;
import br.com.tempo.column.BoardColumnRepository;
import br.com.tempo.error.ResourceNotFoundException;
import br.com.tempo.user.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.mapping;
import static java.util.stream.Collectors.toList;

@Service
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardColumnRepository columnRepository;
    private final CardRepository cardRepository;
    private final CurrentUser currentUser;

    public BoardService(BoardRepository boardRepository,
                        BoardColumnRepository columnRepository,
                        CardRepository cardRepository,
                        CurrentUser currentUser) {
        this.boardRepository = boardRepository;
        this.columnRepository = columnRepository;
        this.cardRepository = cardRepository;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<BoardSummaryResponse> list() {
        return boardRepository.findByUserIdOrderByCreatedAtAsc(currentUser.id()).stream()
                .map(BoardSummaryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BoardDetailResponse get(Long id) {
        Board board = findEntity(id);

        Map<Long, List<CardResponse>> cardsByColumn = cardRepository.findByColumnBoardIdOrderByPositionAsc(id).stream()
                .collect(groupingBy(card -> card.getColumn().getId(), mapping(CardResponse::from, toList())));

        List<ColumnDetail> columns = columnRepository.findByBoardIdOrderByPositionAsc(id).stream()
                .map(column -> new ColumnDetail(
                        column.getId(),
                        column.getName(),
                        column.getPosition(),
                        cardsByColumn.getOrDefault(column.getId(), List.of())))
                .toList();

        return new BoardDetailResponse(board.getId(), board.getName(), board.getCreatedAt(), columns);
    }

    @Transactional
    public BoardSummaryResponse create(BoardRequest request) {
        Board board = boardRepository.save(new Board(currentUser.reference(), request.name().trim()));
        return BoardSummaryResponse.from(board);
    }

    @Transactional
    public BoardSummaryResponse update(Long id, BoardRequest request) {
        Board board = findEntity(id);
        board.setName(request.name().trim());
        return BoardSummaryResponse.from(board);
    }

    @Transactional
    public void delete(Long id) {
        boardRepository.delete(findEntity(id));
    }

    @Transactional(readOnly = true)
    public Board findEntity(Long id) {
        return boardRepository.findByIdAndUserId(id, currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Board", id));
    }
}
