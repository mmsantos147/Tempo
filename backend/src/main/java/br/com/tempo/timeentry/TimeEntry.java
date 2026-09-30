package br.com.tempo.timeentry;

import br.com.tempo.card.Card;
import br.com.tempo.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "time_entry")
public class TimeEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(length = 500)
    private String description;

    protected TimeEntry() {
    }

    public TimeEntry(Card card, User user, Instant startedAt, String description) {
        this.card = card;
        this.user = user;
        this.startedAt = startedAt;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public Card getCard() {
        return card;
    }

    public User getUser() {
        return user;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
