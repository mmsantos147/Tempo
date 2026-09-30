package br.com.tempo.column.dto;

import br.com.tempo.column.BoardColumn;

public record BoardColumnResponse(Long id, Long boardId, String name, int position) {

    public static BoardColumnResponse from(BoardColumn column) {
        return new BoardColumnResponse(column.getId(), column.getBoard().getId(), column.getName(), column.getPosition());
    }
}
