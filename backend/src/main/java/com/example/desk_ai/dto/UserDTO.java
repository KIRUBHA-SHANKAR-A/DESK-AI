package com.example.desk_ai.dto;

import com.example.desk_ai.entity.Department;
import java.io.Serializable;

public class UserDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String employeeId;
    private String designation;
    private Boolean active;
    private String roleName;
    private Long departmentId;
    private String departmentName;
    private Department department;

    public UserDTO() {
    }

    public UserDTO(Long userId, String name, String email, String phone, String employeeId,
                   String designation, Boolean active, String roleName, Long departmentId,
                   String departmentName, Department department) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.employeeId = employeeId;
        this.designation = designation;
        this.active = active;
        this.roleName = roleName;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.department = department;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }
}
