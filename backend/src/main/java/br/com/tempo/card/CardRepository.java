package br.com.tempo.card;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, Long> {

    List<Card> findByColumnIdOrderByPositionAsc(Long columnId);

    List<Card> findByColumnBoardIdOrderByPositionAsc(Long boardId);

    Optional<Card> findByIdAndColumnBoardUserId(Long id, Long userId);

    int countByColumnId(Long columnId);
}
