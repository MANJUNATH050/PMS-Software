package com.aseuro.pms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    @JsonProperty("token")
    private String token;

    @JsonProperty("tokenType")
    private String tokenType;

    @JsonProperty("id")
    private Long id;

    @JsonProperty("email")
    private String email;

    @JsonProperty("name")
    private String name;

    @JsonProperty("role")
    private String role;

    @JsonProperty("mustChangePassword")
    private Boolean mustChangePassword;

    public LoginResponse(String token, String tokenType, String email, String name, String role) {
        this.token = token;
        this.tokenType = tokenType;
        this.email = email;
        this.name = name;
        this.role = role;
        this.mustChangePassword = false;
    }

    public LoginResponse(String token, String tokenType, String email, String name, String role, Boolean mustChangePassword) {
        this.token = token;
        this.tokenType = tokenType;
        this.email = email;
        this.name = name;
        this.role = role;
        this.mustChangePassword = mustChangePassword;
    }
}
