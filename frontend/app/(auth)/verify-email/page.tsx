"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { ShieldCheck, Mail } from "lucide-react";
import api from "@/lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/verify-email", { email, otp });
      toast.success("Email verified! You can now log in.");
      router.push("/login");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-otp", { email });
      toast.info("New verification code sent");
      setCountdown(60);
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-green-700" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="text-gray-500 mt-1">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                Verification Code
              </label>
              <input
                type="text"
                className="input-field text-center text-3xl tracking-widest font-mono"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                placeholder="000000"
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div className="text-center mt-4">
            {countdown > 0 ? (
              <p className="text-sm text-gray-500">
                Resend code in {countdown}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-green-700 hover:underline font-medium"
              >
                {resending ? "Sending..." : "Resend verification code"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
