package com.aseuro.pms.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    @JsonProperty("currentPassword")
    @JsonAlias({"oldPassword", "current_password", "old_password", "temporaryPassword", "tempPassword"})
    private String currentPassword;

    @JsonProperty("newPassword")
    @JsonAlias({"new_password", "password"})
    private String newPassword;

    @JsonProperty("confirmPassword")
    @JsonAlias({"confirm_password", "confirmNewPassword", "confirm_new_password"})
    private String confirmPassword;
}
