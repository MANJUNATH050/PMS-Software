package com.aseuro.pms.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {
    private String email;
    private String password;
    private String role;

    @JsonIgnore
    public String email() {
        return this.email;
    }

    @JsonIgnore
    public String password() {
        return this.password;
    }

    @JsonIgnore
    public String role() {
        return this.role;
    }
}
