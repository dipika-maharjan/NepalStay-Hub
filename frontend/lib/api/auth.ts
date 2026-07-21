//backend api call only
import axios from "./axios"; //import axios instance -> important
import { API } from "./endpoints";

//registerData: any-> can be schema object
export const registerUser = async (registerData: any) => {
  try {
    const response = await axios.post(
      API.AUTH.REGISTER, //backend route path
      registerData, //data to be sent to backend(req.body)
    );
    return response.data; //response ko body
    //what is returned from backend-controller
  } catch (err: Error | any) {
    //if 4xx or 5xx as error
    throw new Error(
      err.response?.data?.message || //from backend
        err.message || //general error msg
        "Registration failed", //fallback msg
    );
  }
};

export const verifyEmailUser = async (email: string, otp: string) => {
  try {
    const response = await axios.post(API.AUTH.VERIFY_EMAIL, { email, otp });
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "Email verification failed",
    );
  }
};

export const resendOTPCode = async (email: string) => {
  try {
    const response = await axios.post(API.AUTH.RESEND_OTP, { email });
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "Resend OTP failed",
    );
  }
};

export const loginUser = async (loginData: any) => {
  try {
    const response = await axios.post(
      API.AUTH.LOGIN, //backend route path
      loginData, //data to be sent to backend(req.body)
    );
    return response.data; //response ko body
    //what is returned from backend-controller
  } catch (err: Error | any) {
    //if 4xx or 5xx as error
    throw new Error(
      err.response?.data?.message || //from backend
        err.message || //general error msg
        "Login failed", //fallback msg
    );
  }
};

export const validateMFA = async (token: string, tempUserId: string) => {
  try {
    const response = await axios.post(API.MFA.VALIDATE, { token, tempUserId });
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "MFA validation failed",
    );
  }
};

export const updateProfile = async (profileData: any) => {
  try {
    const response = await axios.put(API.AUTH.UPDATE_PROFILE, profileData, {
      headers: {
        "Content-Type": "multipart/form-data", // for file upload/multer
      },
    });
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message || error.message || "Update profile failed",
    );
  }
};

export const requestPasswordReset = async (email: string) => {
  try {
    const response = await axios.post(API.AUTH.REQUEST_PASSWORD_RESET, {
      email,
    });
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Request password reset failed",
    );
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const response = await axios.post(API.AUTH.RESET_PASSWORD(token), {
      newPassword: newPassword,
    });
    return response.data;
  } catch (error: Error | any) {
    throw new Error(
      error.response?.data?.message || error.message || "Reset password failed",
    );
  }
};
