"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import {
  User,
  Lock,
  Shield,
  Download,
  Upload,
  Mail,
  Phone,
  AlignLeft,
} from "lucide-react";
import Navbar from "@/app/components/navbar/Navbar";
import api from "@/lib/api";
import { handleUpdateProfile } from "@/lib/actions/user-action";
import { setUserData } from "@/lib/cookie";

export default function ProfilePage() {
  const { user, setUser, isAuthenticated, loading, checkAuth } = useAuth();

  // Tab state
  const [tab, setTab] = useState<"profile" | "security" | "mfa">("profile");

  // Profile Form state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Security & MFA state
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [mfaQR, setMfaQR] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
      });

      if (user.imageUrl) {
        setImagePreview(normalizeImageUrl(user.imageUrl));
      } else {
        setImagePreview(null);
      }
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setRemoveImage(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const submitProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setSaving(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("bio", formData.bio);

      if (imageFile) {
        data.append("image", imageFile);
      }
      if (removeImage) {
        data.append("removeImage", "true");
      }

      const result = await handleUpdateProfile(user?._id, data);

      if (result.success) {
        setProfileSuccess("Profile updated successfully!");
        toast.success("Profile updated");
        setIsEditing(false);
        await checkAuth();
      } else {
        setProfileError(result.message || "Failed to update profile");
        toast.error(result.message || "Update failed");
      }
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
      });

      if (user.imageUrl) {
        setImagePreview(normalizeImageUrl(user.imageUrl));
      } else {
        setImagePreview(null);
      }
    }
    setImageFile(null);
    setRemoveImage(false);
    setIsEditing(false);
    setProfileError("");
    setProfileSuccess("");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityLoading(true);
    try {
      await api.put("/profile/change-password", passwords);
      toast.success("Password changed");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSecurityLoading(false);
    }
  };

  const setupMFA = async () => {
    try {
      const { data } = await api.post("/mfa/setup");
      setMfaQR(data.qrCode);
    } catch {
      toast.error("MFA setup failed");
    }
  };

  const verifyMFA = async () => {
    try {
      await api.post("/mfa/verify-setup", { token: mfaToken });

      const updatedUser = { ...user, mfaEnabled: true };
      setUser(updatedUser);
      await setUserData(updatedUser);

      toast.success("MFA enabled!");
      setMfaQR("");
      await checkAuth();
    } catch {
      toast.error("Invalid code");
    }
  };

  const exportData = async () => {
    try {
      const { data } = await api.get("/profile/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-nepalstayhub-data.json";
      a.click();
    } catch {
      toast.error("Export failed");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User size={16} /> },
    { id: "security", label: "Security", icon: <Lock size={16} /> },
    { id: "mfa", label: "2FA", icon: <Shield size={16} /> },
  ] as const;

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="px-6 py-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Account Settings
        </h1>

        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-[#0c7272] text-white"
                  : "text-gray-600 hover:text-[#0c7272]"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#0c7272] text-white rounded-lg hover:bg-[#0a5555] transition"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {profileError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
                {profileSuccess}
              </div>
            )}

            <form onSubmit={submitProfileUpdate}>
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-[#0c7272]"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-[#0c7272] bg-[#0c7272] text-white flex items-center justify-center font-bold text-5xl">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  {isEditing && (
                    <label
                      htmlFor="image-upload"
                      className="absolute bottom-0 right-0 bg-[#0c7272] text-white p-2 rounded-full cursor-pointer hover:bg-[#0a5555] transition"
                    >
                      <Upload size={20} />
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-4 flex flex-col items-center gap-3">
                    <p className="text-sm text-gray-500">
                      Click the icon to upload a new profile picture
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById("image-upload")?.click()
                        }
                        className="px-4 py-2 text-sm font-medium border border-[#0c7272] text-[#0c7272] rounded-lg hover:bg-[#0c7272]/10 transition"
                      >
                        Change Photo
                      </button>
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-4 py-2 text-sm font-medium border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <User size={16} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c7272] disabled:bg-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Mail size={16} />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c7272] disabled:bg-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone size={16} />
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c7272] disabled:bg-gray-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <AlignLeft size={16} />
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c7272] disabled:bg-gray-100"
                  />
                </div>
              </div>

              {isEditing ? (
                <div className="flex gap-4 mt-8">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-[#0c7272] text-white rounded-lg hover:bg-[#0a5555] transition disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={exportData}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 font-medium border"
                  >
                    <Download size={16} /> Export My Data
                  </button>
                </div>
              )}
            </form>

            {!isEditing && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Account Type:</span>
                    <span className="ml-2 font-semibold text-gray-800">
                      {user?.role === "admin" ? "Administrator" : "Traveler"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Member Since:</span>
                    <span className="ml-2 font-semibold text-gray-800">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "security" && (
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Change Password
            </h2>
            <form onSubmit={changePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c7272]"
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c7272]"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full mt-4 px-6 py-3 bg-[#0c7272] text-white rounded-lg hover:bg-[#0a5555] transition disabled:opacity-50"
                disabled={securityLoading}
              >
                {securityLoading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        )}

        {tab === "mfa" && (
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {user?.mfaEnabled
                ? "✅ MFA is enabled on your account."
                : "Add an extra layer of security to your account."}
            </p>
            {!user?.mfaEnabled && !mfaQR && (
              <button
                onClick={setupMFA}
                className="px-6 py-3 bg-[#0c7272] text-white rounded-lg hover:bg-[#0a5555] transition"
              >
                Enable 2FA
              </button>
            )}
            {mfaQR && (
              <div className="space-y-6 max-w-md">
                <p className="text-sm text-gray-600">
                  Scan this QR code with Google Authenticator or Authy:
                </p>
                <img
                  src={mfaQR}
                  alt="MFA QR Code"
                  className="border rounded-lg"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter the 6-digit code to confirm:
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c7272] text-center tracking-widest text-xl"
                    value={mfaToken}
                    onChange={(e) =>
                      setMfaToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength={6}
                    placeholder="000000"
                  />
                </div>
                <button
                  onClick={verifyMFA}
                  className="w-full px-6 py-3 bg-[#0c7272] text-white rounded-lg hover:bg-[#0a5555] transition disabled:opacity-50"
                  disabled={mfaToken.length !== 6}
                >
                  Verify & Enable
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
