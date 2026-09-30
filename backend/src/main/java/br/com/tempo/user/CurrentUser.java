package br.com.tempo.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    private final Long userId;
    private final UserRepository userRepository;

    public CurrentUser(@Value("${tempo.default-user-id}") Long userId, UserRepository userRepository) {
        this.userId = userId;
        this.userRepository = userRepository;
    }

    public Long id() {
        return userId;
    }

    public User reference() {
        return userRepository.getReferenceById(userId);
    }
}
