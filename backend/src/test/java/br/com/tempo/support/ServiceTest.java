package br.com.tempo.support;

import br.com.tempo.auth.AppUserPrincipal;
import br.com.tempo.user.User;
import br.com.tempo.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@SpringBootTest
@Transactional
@Import(TestcontainersConfig.class)
public abstract class ServiceTest {

    @Autowired
    protected UserRepository userRepository;

    protected User signInAsNewUser() {
        String email = UUID.randomUUID() + "@test.local";
        User user = userRepository.save(new User("Test", email, "unused"));
        signIn(user);
        return user;
    }

    protected void signIn(User user) {
        AppUserPrincipal principal = AppUserPrincipal.from(user);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(principal, null, List.of()));
        SecurityContextHolder.setContext(context);
    }

    @AfterEach
    void signOut() {
        SecurityContextHolder.clearContext();
    }
}
