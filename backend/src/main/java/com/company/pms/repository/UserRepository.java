package com.company.pms.repository;

import com.company.pms.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    @Query("select u from User u where lower(u.email)=lower(:identifier) or lower(u.username)=lower(:identifier)")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);

    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
}
