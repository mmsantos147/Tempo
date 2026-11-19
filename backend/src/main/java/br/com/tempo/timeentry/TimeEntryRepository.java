package br.com.tempo.timeentry;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
    Optional<TimeEntry> findTimeEntryByUserIdAndEndedAtIsNull(Long userId);

    Optional<TimeEntry> findTimeEntryByIdAndUserId(Long timeEntryId, Long userId);

    List<TimeEntry> findTimeEntryByCardIdAndEndedAtIsNotNull(Long cardId);

    Optional<TimeEntry> findTimeEntryByCardIdAndEndedAtIsNull(Long cardId);

    @Query("""
            select count(t) > 0 from TimeEntry t
            where t.user.id = :userId
              and t.startedAt < :end
              and (t.endedAt is null or t.endedAt > :start)
            """)
    boolean existsOverlapping(Long userId, Instant start, Instant end);

    @Query("""
            select count(t) > 0 from TimeEntry t
            where t.user.id = :userId
              and t.id <> :excludedId
              and t.startedAt < :end
              and (t.endedAt is null or t.endedAt > :start)
            """)
    boolean existsOverlappingExcluding(Long userId, Long excludedId, Instant start, Instant end);

    @Query("""
            select t from TimeEntry t
            join fetch t.card
            where t.user.id = :userId
              and t.startedAt >= :from
              and t.startedAt < :to
            order by t.startedAt
            """)
    List<TimeEntry> findStartedBetween(Long userId, Instant from, Instant to);
}
