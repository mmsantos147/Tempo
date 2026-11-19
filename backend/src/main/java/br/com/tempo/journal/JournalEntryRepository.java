package br.com.tempo.journal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    Optional<JournalEntry> findByUserIdAndEntryDate(Long userId, LocalDate entryDate);

    @Query("""
            select e.entryDate from JournalEntry e
            where e.user.id = :userId
              and e.entryDate between :from and :to
            order by e.entryDate
            """)
    List<LocalDate> findDatesBetween(Long userId, LocalDate from, LocalDate to);

    @Modifying
    @Query(value = """
            INSERT INTO journal_entry (user_id, entry_date)
            VALUES (:userId, :entryDate)
            ON CONFLICT (user_id, entry_date) DO NOTHING
            """, nativeQuery = true)
    int insertIfAbsent(Long userId, LocalDate entryDate);
}
