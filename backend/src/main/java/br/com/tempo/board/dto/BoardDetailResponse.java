package br.com.tempo.board.dto;

import br.com.tempo.card.dto.CardResponse;

import java.time.Instant;
import java.util.List;

public record BoardDetailResponse(Long id, String name, Instant createdAt, List<ColumnDetail> columns) {

    public record ColumnDetail(Long id, String name, int position, List<CardResponse> cards) {
    }
}
