package com.aseuro.pms.exception;

import org.springframework.http.HttpStatus;

import java.time.Instant;

public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final Instant lockedUntil;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null);
    }

    public ApiException(HttpStatus status, String message, Instant lockedUntil) {
        super(message);
        this.status = status;
        this.lockedUntil = lockedUntil;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Instant getLockedUntil() {
        return lockedUntil;
    }
}
