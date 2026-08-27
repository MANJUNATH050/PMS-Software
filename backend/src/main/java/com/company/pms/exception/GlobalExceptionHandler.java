package com.company.pms.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.dao.DataIntegrityViolationException;
import java.time.Instant;
import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<?> api(ApiException e) {
        return ResponseEntity.status(e.status())
                .body(Map.of("timestamp", Instant.now(), "status", e.status(), "message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(x -> errors.put(x.getField(), x.getDefaultMessage()));
        return ResponseEntity.badRequest().body(
                Map.of("timestamp", Instant.now(), "status", 400, "message", "Validation failed", "errors", errors));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> constraint(DataIntegrityViolationException e) {
        return ResponseEntity.status(409).body(Map.of(
                "timestamp", Instant.now(),
                "status", 409,
                "message", "Employee data conflicts with an existing record."));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<?> other() {
        return ResponseEntity.status(500).body(Map.of("timestamp", Instant.now(), "status", 500, "message",
                "Something went wrong. Please try again later."));
    }
}
