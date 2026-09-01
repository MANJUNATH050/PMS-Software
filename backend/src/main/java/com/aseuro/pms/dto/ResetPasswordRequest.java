package com.aseuro.pms.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {
    private String token;
    private String newPassword;
    private String confirmPassword;

    // Legacy field kept for backward compatibility
    private String email;

    @JsonIgnore
    public String token() { return this.token; }

    @JsonIgnore
    public String newPassword() { return this.newPassword; }

    @JsonIgnore
    public String confirmPassword() { return this.confirmPassword; }

    @JsonIgnore
    public String email() { return this.email; }
}
