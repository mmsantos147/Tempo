package br.com.tempo.auth;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    static final int MAX_FAILURES_PER_EMAIL_AND_IP = 5;
    static final int MAX_FAILURES_PER_IP = 20;
    static final Duration WINDOW = Duration.ofMinutes(15);
    static final Duration BLOCK = Duration.ofMinutes(15);

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();

    public void checkAllowed(String email, String clientIp) {
        Instant now = Instant.now();
        for (String key : keys(email, clientIp)) {
            Attempts current = attempts.get(key);
            if (current != null && current.isBlocked(now)) {
                throw new TooManyLoginAttemptsException(Duration.between(now, current.blockedUntil()));
            }
        }
    }

    public void recordFailure(String email, String clientIp) {
        Instant now = Instant.now();
        attempts.values().removeIf(current -> current.isExpired(now));
        attempts.compute(emailAndIpKey(email, clientIp),
                (key, current) -> next(current, now, MAX_FAILURES_PER_EMAIL_AND_IP));
        attempts.compute(ipKey(clientIp),
                (key, current) -> next(current, now, MAX_FAILURES_PER_IP));
    }

    public void recordSuccess(String email, String clientIp) {
        attempts.remove(emailAndIpKey(email, clientIp));
    }

    private static Attempts next(Attempts current, Instant now, int maxFailures) {
        Attempts base = current == null || current.isExpired(now) ? new Attempts(now, 0, null) : current;
        int failures = base.failures() + 1;
        Instant blockedUntil = failures >= maxFailures ? now.plus(BLOCK) : base.blockedUntil();
        return new Attempts(base.windowStart(), failures, blockedUntil);
    }

    private static String[] keys(String email, String clientIp) {
        return new String[] {emailAndIpKey(email, clientIp), ipKey(clientIp)};
    }

    private static String emailAndIpKey(String email, String clientIp) {
        return "email-ip:" + email + "|" + clientIp;
    }

    private static String ipKey(String clientIp) {
        return "ip:" + clientIp;
    }

    private record Attempts(Instant windowStart, int failures, Instant blockedUntil) {

        boolean isBlocked(Instant now) {
            return blockedUntil != null && now.isBefore(blockedUntil);
        }

        boolean isExpired(Instant now) {
            return !isBlocked(now) && !now.isBefore(windowStart.plus(WINDOW));
        }
    }
}
