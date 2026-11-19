package br.com.tempo.auth;

import br.com.tempo.auth.dto.LoginRequest;
import br.com.tempo.auth.dto.MeResponse;
import br.com.tempo.user.CurrentUser;
import br.com.tempo.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class AuthService {

    private static final int BCRYPT_MAX_BYTES = 72;
    private static final String SESSION_COOKIE = "JSESSIONID";

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final CsrfTokenRepository csrfTokenRepository;
    private final LoginAttemptService loginAttemptService;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    public AuthService(AuthenticationManager authenticationManager,
                       SecurityContextRepository securityContextRepository,
                       CsrfTokenRepository csrfTokenRepository,
                       LoginAttemptService loginAttemptService,
                       UserRepository userRepository,
                       CurrentUser currentUser) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.csrfTokenRepository = csrfTokenRepository;
        this.loginAttemptService = loginAttemptService;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
    }

    public void loadCsrfToken(HttpServletRequest request) {
        CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (token != null) {
            token.getToken();
        }
    }

    @Transactional(readOnly = true)
    public MeResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String clientIp = httpRequest.getRemoteAddr();
        loginAttemptService.checkAllowed(email, clientIp);

        Authentication authentication;
        try {
            if (request.password().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES) {
                throw new BadCredentialsException("Password too long");
            }
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, request.password()));
        } catch (AuthenticationException e) {
            loginAttemptService.recordFailure(email, clientIp);
            throw e;
        }
        loginAttemptService.recordSuccess(email, clientIp);

        HttpSession existing = httpRequest.getSession(false);
        if (existing != null) {
            httpRequest.changeSessionId();
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
        csrfTokenRepository.saveToken(csrfTokenRepository.generateToken(httpRequest), httpRequest, httpResponse);

        AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
        return userRepository.findById(principal.id())
                .map(MeResponse::from)
                .orElseThrow(() -> new BadCredentialsException("User no longer exists"));
    }

    public void logout(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        csrfTokenRepository.saveToken(null, httpRequest, httpResponse);
        ResponseCookie expiredSession = ResponseCookie.from(SESSION_COOKIE, "")
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .build();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, expiredSession.toString());
    }

    @Transactional(readOnly = true)
    public MeResponse me() {
        return userRepository.findById(currentUser.id())
                .map(MeResponse::from)
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("User no longer exists"));
    }
}
