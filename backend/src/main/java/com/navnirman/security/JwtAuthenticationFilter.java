
package com.navnirman.security;

import com.navnirman.user.AppUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwt;
    private final AppUserRepository users;

    public JwtAuthenticationFilter(
            JwtService jwt,
            AppUserRepository users) {
        this.jwt = jwt;
        this.users = users;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {

        String path = request.getServletPath();

        return request.getMethod().equalsIgnoreCase("OPTIONS")
                || path.equals("/api/auth/register")
                || path.equals("/api/auth/login")
                || path.equals("/api/auth/admin/login")
                || path.equals("/api/payments/webhook");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain)
            throws ServletException, IOException {

        String authorization = request.getHeader("Authorization");

        if (authorization != null &&
                authorization.startsWith("Bearer ")) {

            String token = authorization.substring(7);

            if (jwt.isValid(token)) {

                var user = users.findByEmailIgnoreCase(
                        jwt.extractSubject(token)
                ).orElse(null);

                if (user != null && user.isEnabled()) {

                    var authentication =
                            new UsernamePasswordAuthenticationToken(
                                    user.getEmail(),
                                    null,
                                    List.of(
                                            new SimpleGrantedAuthority(
                                                    "ROLE_" +
                                                    user.getRole().name()
                                            )
                                    )
                            );

                    SecurityContextHolder.getContext()
                            .setAuthentication(authentication);
                }
            }
        }

        chain.doFilter(request, response);
    }
}
