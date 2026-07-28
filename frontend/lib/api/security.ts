import axios from "./axios";
import { API } from "./endpoints";

export const getSecurityStatus = async () => {
  try {
    const response = await axios.get(API.SECURITY.STATUS);
    return response.data;
  } catch (err: Error | any) {
    throw new Error(
      err.response?.data?.message || err.message || "Failed to fetch security status",
    );
  }
};
