package com.aseuro.pms.dto;

<<<<<<< HEAD
import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
=======
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Please enter a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        String password
) {
>>>>>>> 7e242a5ead40c3cafff0fc936fda8630cb8d09d3
}
