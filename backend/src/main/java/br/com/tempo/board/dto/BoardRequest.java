package br.com.tempo.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BoardRequest(
        @NotBlank @Size(max = 100) String name
) {
}
