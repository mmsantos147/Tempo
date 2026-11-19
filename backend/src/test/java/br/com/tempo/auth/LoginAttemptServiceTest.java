package br.com.tempo.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginAttemptServiceTest {

    static final String IP = "203.0.113.7";

    final LoginAttemptService service = new LoginAttemptService();

    @Test
    void blocksTheEmailFromThatIpAfterTooManyFailures() {
        fail("me@test.local", IP, LoginAttemptService.MAX_FAILURES_PER_EMAIL_AND_IP);

        assertThatThrownBy(() -> service.checkAllowed("me@test.local", IP))
                .isInstanceOf(TooManyLoginAttemptsException.class)
                .satisfies(e -> {
                    long seconds = ((TooManyLoginAttemptsException) e).getRetryAfter().toSeconds();
                    assertThat(seconds)
                            .isPositive()
                            .isLessThanOrEqualTo(LoginAttemptService.BLOCK.toSeconds());
                });
        assertThatCode(() -> service.checkAllowed("me@test.local", "198.51.100.1")).doesNotThrowAnyException();
        assertThatCode(() -> service.checkAllowed("other@test.local", IP)).doesNotThrowAnyException();
    }

    @Test
    void blocksTheIpAfterTooManyFailuresAcrossEmails() {
        for (int i = 0; i < LoginAttemptService.MAX_FAILURES_PER_IP; i++) {
            service.recordFailure("user" + i + "@test.local", IP);
        }

        assertThatThrownBy(() -> service.checkAllowed("new@test.local", IP))
                .isInstanceOf(TooManyLoginAttemptsException.class);
    }

    @Test
    void successResetsTheEmailCounter() {
        fail("me@test.local", IP, LoginAttemptService.MAX_FAILURES_PER_EMAIL_AND_IP - 1);
        service.recordSuccess("me@test.local", IP);
        fail("me@test.local", IP, LoginAttemptService.MAX_FAILURES_PER_EMAIL_AND_IP - 1);

        assertThatCode(() -> service.checkAllowed("me@test.local", IP)).doesNotThrowAnyException();
    }

    private void fail(String email, String ip, int times) {
        for (int i = 0; i < times; i++) {
            service.recordFailure(email, ip);
        }
    }
}
