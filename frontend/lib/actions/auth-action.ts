//server side processing
"use server";

import { LoginData, RegisterData } from "@/app/(auth)/schema";
import {
  registerUser,
  loginUser,
  validateMFA,
  updateProfile,
  resetPassword,
  requestPasswordReset,
  verifyEmailUser,
  resendOTPCode,
} from "../api/auth";
import { clearAuthCookies, setAuthToken, setUserData } from "../cookie";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const handleRegister = async (data: RegisterData) => {
  try {
    const response = await registerUser(data);
    // If registerUser resolves, it means the backend returned a 2xx success status
    return {
      success: true,
      message:
        response.message ||
        "Registration successful. Please verify your email.",
      data: response,
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Registration action failed",
    };
  }
};

export const handleVerifyEmail = async (email: string, otp: string) => {
  try {
    const response = await verifyEmailUser(email, otp);
    if (response.message) {
      return {
        success: true,
        message: response.message,
      };
    }
    return { success: false, message: "Verification failed" };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Verification action failed",
    };
  }
};

export const handleResendOTP = async (email: string) => {
  try {
    const response = await resendOTPCode(email);
    if (response.message) {
      return {
        success: true,
        message: response.message,
      };
    }
    return { success: false, message: "Failed to resend OTP" };
  } catch (error: Error | any) {
    return { success: false, message: error.message || "Resend action failed" };
  }
};

export const handleLogin = async (data: LoginData) => {
  try {
    const response = await loginUser(data);
    console.log("loginUser response:", response);
    if (response.requiresMFA) {
      return {
        success: false,
        message: response.message || "MFA verification required",
        requiresMFA: true,
        tempUserId: response.tempUserId,
        email: data.email,
      };
    }
    if (
      response.user ||
      response.message === "Login successful" ||
      response.success
    ) {
      if (response.token) await setAuthToken(response.token);
      await setUserData(response.user || response.data);
      return {
        success: true,
        message: response.message || "Login successful",
        data: response.user || response.data,
        token: response.token,
      };
    }
    return {
      success: false,
      message: response.message || "Login failed",
    };
  } catch (error: Error | any) {
    console.error("handleLogin catch error:", error);
    return { success: false, message: error.message || "Login action failed" };
  }
};

export const handleVerifyMFA = async (token: string, tempUserId: string) => {
  try {
    const response = await validateMFA(token, tempUserId);
    if (
      response.user ||
      response.message === "MFA verified. Login successful" ||
      response.success
    ) {
      if (response.token) await setAuthToken(response.token);
      await setUserData(response.user || response.data);
      return {
        success: true,
        message: response.message || "MFA verified. Login successful",
        data: response.user || response.data,
        token: response.token,
      };
    }
    return {
      success: false,
      message: response.message || "MFA verification failed",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "MFA verification action failed",
    };
  }
};

export const handleLogout = async () => {
  await clearAuthCookies();
  return redirect("/login");
};

export async function handleUpdateProfile(profileData: FormData) {
  try {
    const result = await updateProfile(profileData);
    if (result.success) {
      await setUserData(result.data); // update cookie
      revalidatePath("/user/profile"); // revalidate profile page/ refresh new data
      return {
        success: true,
        message: "Profile updated successfully",
        data: result.data,
      };
    }
    return {
      success: false,
      message: result.message || "Failed to update profile",
    };
  } catch (error: Error | any) {
    return { success: false, message: error.message };
  }
}

export const handleRequestPasswordReset = async (email: string) => {
  try {
    const response = await requestPasswordReset(email);
    if (response.success) {
      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    }
    return {
      success: false,
      message: response.message || "Request password reset failed",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Request password reset action failed",
    };
  }
};

export const handleResetPassword = async (
  token: string,
  newPassword: string,
) => {
  try {
    const response = await resetPassword(token, newPassword);
    if (response.success) {
      return {
        success: true,
        message: "Password has been reset successfully",
      };
    }
    return {
      success: false,
      message: response.message || "Reset password failed",
    };
  } catch (error: Error | any) {
    return {
      success: false,
      message: error.message || "Reset password action failed",
    };
  }
};
