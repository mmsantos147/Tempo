package br.com.tempo.journal;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface JournalItemRepository extends JpaRepository<JournalItem, Long> {

    @Query("""
            select i from JournalItem i
            left join fetch i.card c
            left join fetch c.column
            where i.entry.id = :entryId
            order by i.position
            """)
    List<JournalItem> findWithCardsByEntryId(Long entryId);

    List<JournalItem> findByEntryIdOrderByPositionAsc(Long entryId);

    Optional<JournalItem> findByIdAndEntryUserId(Long id, Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from JournalItem i where i.id = :id and i.entry.user.id = :userId")
    Optional<JournalItem> findForUpdate(Long id, Long userId);

    int countByEntryId(Long entryId);
}
