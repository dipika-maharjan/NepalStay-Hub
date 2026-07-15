"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { User, Lock, Shield, Download } from "lucide-react";
import Navbar from "@/app/_components/Navbar";
import api from "@/lib/api";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", bio: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [mfaQR, setMfaQR] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"profile" | "security" | "mfa">("profile");

  useEffect(() => {
    if (user)
      setForm({
        name: user.name,
        phone: user.phone || "",
        bio: user.bio || "",
      });
  }, [user]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/profile", form);
      await refresh();
      toast.success("Profile updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/profile/change-password", passwords);
      toast.success("Password changed");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
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
      toast.success("MFA enabled!");
      setMfaQR("");
      await refresh();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
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
                  ? "bg-green-800 text-white"
                  : "text-gray-600 hover:text-green-800"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="card">
            <form onSubmit={updateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  className="input-field"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  maxLength={500}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={exportData}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download size={16} /> Export My Data
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === "security" && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="input-field"
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
                  className="input-field"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        )}

        {tab === "mfa" && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {user?.mfaEnabled
                ? "✅ MFA is enabled on your account."
                : "Add an extra layer of security to your account."}
            </p>
            {!user?.mfaEnabled && !mfaQR && (
              <button onClick={setupMFA} className="btn-primary">
                Enable 2FA
              </button>
            )}
            {mfaQR && (
              <div className="space-y-4">
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
                    className="input-field text-center tracking-widest text-xl"
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
                  className="btn-primary"
                  disabled={mfaToken.length !== 6}
                >
                  Verify & Enable
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
