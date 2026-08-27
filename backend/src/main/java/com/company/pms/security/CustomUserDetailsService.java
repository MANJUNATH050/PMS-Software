package com.company.pms.security;

import com.company.pms.repository.UserRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository users;

    public CustomUserDetailsService(UserRepository users) {
        this.users = users;
    }

    public UserDetails loadUserByUsername(String id) {
        var u = users.findByIdentifier(id).orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return User.withUsername(u.getEmail()).password(u.getPasswordHash()).roles(u.getRole().name())
                .disabled(u.getStatus() != com.company.pms.entity.RecordStatus.ACTIVE).build();
    }
}
