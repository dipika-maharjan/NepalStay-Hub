"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { ShieldCheck } from "lucide-react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("If your email is registered, a reset link has been sent.");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-green-800 mb-4"
          >
            <ShieldCheck size={32} />
            <span className="text-2xl font-bold">NepalStay-Hub</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Reset your password
          </h1>
          <p className="text-gray-500 mt-1">
            Enter your email to receive a reset link
          </p>
        </div>

        <div className="card">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-700 mb-4">
                Check your email for the reset link. It expires in 15 minutes.
              </p>
              <Link href="/login" className="btn-primary inline-block">
                Back to Login
              </Link>
            </div>
          )}
          {!sent && (
            <p className="text-center text-sm text-gray-500 mt-4">
              <Link href="/login" className="text-green-700 hover:underline">
                Back to login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
