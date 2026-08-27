package com.aseuro.pms.repository;

<<<<<<< HEAD
import com.aseuro.pms.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmail(String email);
=======
import com.aseuro.pms.entity.Employee;
import com.aseuro.pms.entity.RecordStatus;
import com.aseuro.pms.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmailIgnoreCase(String email);
    Optional<Employee> findByEmployeeCodeIgnoreCase(String employeeCode);
    Optional<Employee> findByUserId(Long userId);
    boolean existsByEmployeeCodeIgnoreCase(String employeeCode);
    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT e FROM Employee e JOIN e.user u WHERE u.role = :role AND e.status = :status")
    List<Employee> findByUserRoleAndStatus(UserRole role, RecordStatus status);

    List<Employee> findByManagerId(Long managerId);
>>>>>>> 7e242a5ead40c3cafff0fc936fda8630cb8d09d3
}
