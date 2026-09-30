package br.com.tempo.board;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardRepository extends JpaRepository<Board, Long> {

    List<Board> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<Board> findByIdAndUserId(Long id, Long userId);
}
