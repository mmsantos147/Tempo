package br.com.tempo.card;

import br.com.tempo.column.BoardColumn;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "card")
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "column_id", nullable = false)
    private BoardColumn column;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false)
    private int position;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected Card() {
    }

    public Card(BoardColumn column, String title, int position) {
        this.column = column;
        this.title = title;
        this.position = position;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public BoardColumn getColumn() {
        return column;
    }

    public void setColumn(BoardColumn column) {
        this.column = column;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public Integer getEstimatedMinutes() {
        return estimatedMinutes;
    }

    public void setEstimatedMinutes(Integer estimatedMinutes) {
        this.estimatedMinutes = estimatedMinutes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
