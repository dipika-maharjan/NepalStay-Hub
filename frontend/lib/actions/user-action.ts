import { updateUserProfile } from "../api/user";
import { setUserData } from "../cookie";

export const handleUpdateProfile = async (userId: string, formData: FormData) => {
    try {
        // updateUserProfile throws if it fails
        const result = await updateUserProfile(userId, formData);
        
        // Update user data in cookies after successful profile update
        // The backend returns { message, user }
        if (result.user) {
            await setUserData(result.user);
        }
        
        return {
            success: true,
            message: result.message || "Profile updated successfully",
            data: result.user
        };
    } catch (err: Error | any) {
        return {
            success: false,
            message: err.message || "Profile update failed"
        };
    }
}
