package com.example.desk_ai.dto;

import java.io.Serializable;

public class OtpVerificationRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    private String email;
    private String otp;

    public OtpVerificationRequest() {
    }

    public OtpVerificationRequest(String email, String otp) {
        this.email = email;
        this.otp = otp;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
