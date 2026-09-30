package br.com.tempo.card;

import br.com.tempo.board.BoardService;
import br.com.tempo.board.dto.BoardDetailResponse;
import br.com.tempo.board.dto.BoardRequest;
import br.com.tempo.card.dto.CardRequest;
import br.com.tempo.card.dto.MoveCardRequest;
import br.com.tempo.column.BoardColumnService;
import br.com.tempo.column.dto.BoardColumnRequest;
import br.com.tempo.error.BusinessRuleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Testcontainers
@Transactional
class CardServiceTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @Autowired
    BoardService boardService;
    @Autowired
    BoardColumnService columnService;
    @Autowired
    CardService cardService;

    Long boardId;
    Long columnA;
    Long columnB;

    @BeforeEach
    void setUpBoard() {
        boardId = boardService.create(new BoardRequest("Test")).id();
        columnA = columnService.create(boardId, new BoardColumnRequest("A")).id();
        columnB = columnService.create(boardId, new BoardColumnRequest("B")).id();
        for (String title : List.of("a0", "a1", "a2", "a3")) {
            cardService.create(columnA, new CardRequest(title, null, null));
        }
        for (String title : List.of("b0", "b1")) {
            cardService.create(columnB, new CardRequest(title, null, null));
        }
    }

    @Test
    void moveDownWithinSameColumn() {
        cardService.move(idOf("a0"), new MoveCardRequest(columnA, 2));

        assertThat(titles(columnA)).containsExactly("a1", "a2", "a0", "a3");
        assertSequentialPositions();
    }

    @Test
    void moveUpWithinSameColumn() {
        cardService.move(idOf("a3"), new MoveCardRequest(columnA, 0));

        assertThat(titles(columnA)).containsExactly("a3", "a0", "a1", "a2");
        assertSequentialPositions();
    }

    @Test
    void moveBetweenColumns() {
        cardService.move(idOf("a1"), new MoveCardRequest(columnB, 1));

        assertThat(titles(columnA)).containsExactly("a0", "a2", "a3");
        assertThat(titles(columnB)).containsExactly("b0", "a1", "b1");
        assertSequentialPositions();
    }

    @Test
    void positionPastEndGoesLast() {
        cardService.move(idOf("a0"), new MoveCardRequest(columnB, 99));

        assertThat(titles(columnB)).containsExactly("b0", "b1", "a0");
        assertSequentialPositions();
    }

    @Test
    void deleteRenumbersNeighbors() {
        cardService.delete(idOf("a1"));

        assertThat(titles(columnA)).containsExactly("a0", "a2", "a3");
        assertSequentialPositions();
    }

    @Test
    void cannotMoveToColumnOfAnotherBoard() {
        Long otherBoard = boardService.create(new BoardRequest("Other")).id();
        Long foreignColumn = columnService.create(otherBoard, new BoardColumnRequest("X")).id();

        assertThatThrownBy(() -> cardService.move(idOf("a0"), new MoveCardRequest(foreignColumn, 0)))
                .isInstanceOf(BusinessRuleException.class);
    }

    private BoardDetailResponse board() {
        return boardService.get(boardId);
    }

    private List<String> titles(Long columnId) {
        return board().columns().stream()
                .filter(c -> c.id().equals(columnId))
                .findFirst().orElseThrow()
                .cards().stream().map(c -> c.title()).toList();
    }

    private Long idOf(String title) {
        return board().columns().stream()
                .flatMap(c -> c.cards().stream())
                .filter(c -> c.title().equals(title))
                .findFirst().orElseThrow()
                .id();
    }

    private void assertSequentialPositions() {
        board().columns().forEach(column -> {
            List<Integer> positions = column.cards().stream().map(c -> c.position()).toList();
            for (int i = 0; i < positions.size(); i++) {
                assertThat(positions.get(i)).as("position in column %s", column.name()).isEqualTo(i);
            }
        });
    }
}
