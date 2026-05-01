package com.smartexpense.smartexpensebackend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddGroupMemberRequest {

    @NotBlank(message = "Member email is required")
    @Email(message = "Member email must be valid")
    private String email;
}
