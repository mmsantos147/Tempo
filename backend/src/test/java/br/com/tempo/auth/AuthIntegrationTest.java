package br.com.tempo.auth;

import br.com.tempo.support.TestcontainersConfig;
import br.com.tempo.user.User;
import br.com.tempo.user.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Import(TestcontainersConfig.class)
class AuthIntegrationTest {

    static final String PASSWORD = "correct horse battery staple";

    @Autowired
    MockMvc mvc;
    @Autowired
    UserRepository userRepository;
    @Autowired
    PasswordEncoder passwordEncoder;

    User user;

    @BeforeEach
    void createUser() {
        String email = UUID.randomUUID() + "@test.local";
        user = userRepository.save(new User("Ana", email, passwordEncoder.encode(PASSWORD)));
    }

    @Test
    void protectedRoutesAnswer401WithProblemDetail() throws Exception {
        mvc.perform(get("/boards"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(401));
        mvc.perform(get("/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void csrfEndpointIssuesAReadableCookie() throws Exception {
        mvc.perform(get("/auth/csrf"))
                .andExpect(status().isNoContent())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", false));
    }

    @Test
    void loginWithoutCsrfTokenIsForbidden() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(credentials(PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void loginMeAndLogout() throws Exception {
        Cookie csrf = csrfCookie();
        MvcResult login = mvc.perform(post("/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials(PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(user.getId()))
                .andExpect(jsonPath("$.email").value(user.getEmail()))
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        Cookie rotated = login.getResponse().getCookie("XSRF-TOKEN");
        assertThat(session).isNotNull();
        assertThat(rotated.getValue()).isNotEqualTo(csrf.getValue());

        mvc.perform(get("/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ana"));
        mvc.perform(get("/boards").session(session)).andExpect(status().isOk());

        mvc.perform(post("/auth/logout").session(session).cookie(rotated).header("X-XSRF-TOKEN", rotated.getValue()))
                .andExpect(status().isNoContent());
        assertThat(session.isInvalid()).isTrue();
    }

    @Test
    void wrongPasswordIs401() throws Exception {
        Cookie csrf = csrfCookie();
        mvc.perform(post("/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials("wrong password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Invalid email or password"));
    }

    @Test
    void repeatedFailuresAre429WithRetryAfter() throws Exception {
        Cookie csrf = csrfCookie();
        String body = "{\"email\":\"nobody-" + UUID.randomUUID() + "@test.local\",\"password\":\"nope\"}";
        for (int i = 0; i < LoginAttemptService.MAX_FAILURES_PER_EMAIL_AND_IP; i++) {
            mvc.perform(post("/auth/login").cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isUnauthorized());
        }

        mvc.perform(post("/auth/login").cookie(csrf).header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    private Cookie csrfCookie() throws Exception {
        return mvc.perform(get("/auth/csrf")).andReturn().getResponse().getCookie("XSRF-TOKEN");
    }

    private String credentials(String password) {
        return "{\"email\":\"" + user.getEmail().toUpperCase() + "\",\"password\":\"" + password + "\"}";
    }
}
