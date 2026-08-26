package com.aseuro.pms.security;

import com.aseuro.pms.model.Employee;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UserPrincipal implements UserDetails {

    private final Employee employee;

    public UserPrincipal(Employee employee) {
        this.employee = employee;
    }

    public Employee getEmployee() {
        return employee;
    }

    public Long getId() {
        return employee.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return java.util.Arrays.asList(
            new SimpleGrantedAuthority(employee.getRole().name()),
            new SimpleGrantedAuthority("ROLE_" + employee.getRole().name())
        );
    }

    @Override
    public String getPassword() {
        return employee.getPassword();
    }

    @Override
    public String getUsername() {
        return employee.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return "ACTIVE".equalsIgnoreCase(employee.getAccountStatus());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "ACTIVE".equalsIgnoreCase(employee.getAccountStatus());
    }
}
