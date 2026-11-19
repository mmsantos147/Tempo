package br.com.tempo.auth.dto;

import br.com.tempo.user.User;

public record MeResponse(Long id, String name, String email) {

    public static MeResponse from(User user) {
        return new MeResponse(user.getId(), user.getName(), user.getEmail());
    }
}
