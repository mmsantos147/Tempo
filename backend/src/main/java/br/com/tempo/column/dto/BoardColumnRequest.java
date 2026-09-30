package br.com.tempo.column.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BoardColumnRequest(
        @NotBlank @Size(max = 100) String name
) {
}
