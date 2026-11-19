package br.com.tempo.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class InitialUserRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InitialUserRunner.class);
    private static final Pattern BCRYPT_HASH = Pattern.compile("^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$");

    private final UserRepository userRepository;
    private final String email;
    private final String name;
    private final String passwordHash;

    public InitialUserRunner(UserRepository userRepository,
                             @Value("${tempo.initial-user.email}") String email,
                             @Value("${tempo.initial-user.name}") String name,
                             @Value("${tempo.initial-user.password-hash}") String passwordHash) {
        this.userRepository = userRepository;
        this.email = email.trim().toLowerCase(Locale.ROOT);
        this.name = name.trim();
        this.passwordHash = passwordHash.trim();
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email.isEmpty()) {
            return;
        }
        if (!BCRYPT_HASH.matcher(passwordHash).matches()) {
            throw new IllegalStateException("TEMPO_USER_PASSWORD_HASH must be a BCrypt hash");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            log.info("Initial user {} already exists", email);
            return;
        }
        userRepository.save(new User(name.isEmpty() ? email : name, email, passwordHash));
        log.info("Created initial user {}", email);
    }
}
