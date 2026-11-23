package com.navnirman.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Password encoder used when creating and authenticating user accounts.
     */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * Stateless API security configuration.
     * Public endpoints remain public; all other endpoints require a valid JWT,
     * and /api/admin/** additionally requires the ADMIN role.
     */
    @Bean
    SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwt) throws Exception {

        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Browser preflight requests must reach the CORS handler.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Health checks.
                        .requestMatchers(
                                "/api/health",
                                "/actuator/health"
                        ).permitAll()

                        // Authentication and payment-provider webhook endpoints.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/admin/login",
                                "/api/payments/webhook"
                        ).permitAll()

                        // Public catalogue and subscription-plan endpoints.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/categories",
                                "/api/videos",
                                "/api/videos/*/stream",
                                "/api/subscriptions/plans"
                        ).permitAll()

                        // Authenticated user endpoint.
                        .requestMatchers("/api/auth/me").authenticated()

                        // All administrative APIs require ROLE_ADMIN.
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Everything else requires authentication.
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /**
     * CORS origins for local Vite development, Capacitor Android, and the
     * production Cloudflare Pages site. The Pages origin must match the exact
     * deployed hostname.
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost",
                "https://localhost",
                "capacitor://localhost",
                "https://navnirman.pages.dev"
        ));

        config.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Range"
        ));

        config.setExposedHeaders(List.of(
                "Content-Range",
                "Accept-Ranges",
                "Content-Length"
        ));

        // The app sends JWTs in the Authorization header, not cookies.
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
