package com.company.pms.security;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.*;
import org.springframework.web.cors.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwt,
            @Value("${app.frontend-url}") String frontend) throws Exception {
        http.csrf(x -> x.disable()).cors(c -> c.configurationSource(r -> {
            CorsConfiguration cfg = new CorsConfiguration();
            cfg.setAllowedOriginPatterns(List.of("*"));
            cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
            cfg.setAllowedHeaders(List.of("*"));
            cfg.setAllowCredentials(true);
            return cfg;
        })).sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a.requestMatchers("/api/auth/login", "/error").permitAll()
                        .requestMatchers("/api/hr/**").hasRole("HR")
                        .requestMatchers("/api/employee/pms/**").hasAnyRole("EMPLOYEE", "MANAGER", "HR")
                        .anyRequest().authenticated())
                .addFilterBefore(jwt,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
