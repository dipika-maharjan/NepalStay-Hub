"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleVerifyMFA } from "@/lib/actions/auth-action";
import { useAuth } from "@/context/AuthContext";

export default function MfaPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tempUserId = params.get("tempUserId") || "";
  const email = params.get("email") || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh, setIsAuthenticated, setUser } = useAuth();

  useEffect(() => {
    if (!tempUserId || !email) {
      setError("MFA session not found. Please login again.");
    }
  }, [tempUserId, email]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!code || code.length !== 6) {
      setError("Enter a valid 6-digit code.");
      return;
    }
    if (!tempUserId) {
      setError("MFA login session expired. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const res = await handleVerifyMFA(code, tempUserId);
      if (!res.success) {
        throw new Error(res.message || "MFA verification failed");
      }

      const tokenToSet = res.token || res.data?.token;
      if (tokenToSet) {
        localStorage.setItem("token", tokenToSet);
        try {
          const { setAuthToken } = await import("@/lib/cookie");
          await setAuthToken(tokenToSet);
        } catch (err) {
          console.error("Failed to set auth token", err);
        }
      }
      if (res.data) {
        localStorage.setItem("user_data", JSON.stringify(res.data));
        setUser(res.data);
      }
      setIsAuthenticated(true);

      await refresh();
      const target =
        res.data?.role === "admin" ? "/admin/users" : "/user/dashboard";
      if (typeof window !== "undefined") {
        window.location.replace(target);
        return;
      }
      router.replace(target);
    } catch (err: Error | any) {
      setError(err.message || "MFA verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          MFA verification required
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Enter the 6-digit code from your authenticator app for{" "}
          <strong>{email}</strong>.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Authentication Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg tracking-[0.3em] text-center outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-2xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500 text-center">
          No code? Open your authenticator app and enter the code for this
          account.
        </p>
      </div>
    </div>
  );
}
