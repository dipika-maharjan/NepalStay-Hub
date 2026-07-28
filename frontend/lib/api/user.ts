//backend api call for user operations
import axios from "./axios";
import { API } from "./endpoints";
import { getAuthToken } from "../cookie";

// Update user profile with image upload support
export const updateUserProfile = async (userId: string, formData: FormData) => {
  try {
    const token = await getAuthToken();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5051";
    
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: "PUT",
      body: formData,
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Profile update failed");
    }
    
    return data;
  } catch (err: Error | any) {
    throw new Error(err.message || "Profile update failed");
  }
};

// Get user by ID (for admin)
export const getUserById = async (userId: string) => {
  try {
    const token = await getAuthToken();
    const response = await axios.get(`${API.ADMIN.USER.GET_BY_ID}/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch user",
    );
  }
};
