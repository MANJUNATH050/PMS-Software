package com.aseuro.pms.controller;

import org.junit.jupiter.api.Test;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class RootControllerTest {

    @Test
    void testRootEndpointReturnsSuccessMessage() {
        RootController controller = new RootController();
        ResponseEntity<String> response = controller.root();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("PMS Backend is running successfully", response.getBody());
    }
}
