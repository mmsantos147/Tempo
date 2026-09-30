package br.com.tempo.timeentry;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
    Optional<TimeEntry> findTimeEntryByUserIdAndEndedAtIsNull(Long userId);

    Optional<TimeEntry> findTimeEntryByIdAndUserId(Long timeEntryId, Long userId);

    List<TimeEntry> findTimeEntryByCardIdAndEndedAtIsNotNull(Long cardId);

    Optional<TimeEntry> findTimeEntryByCardIdAndEndedAtIsNull(Long cardId);
}
