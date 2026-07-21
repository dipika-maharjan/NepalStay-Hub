"use client";

import { useState, useTransition } from "react";
import { Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterData, registerSchema } from "../schema";
import { useRouter } from "next/navigation";
import {
  handleRegister,
  handleVerifyEmail,
  handleResendOTP,
} from "@/lib/actions/auth-action";

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [pending, startTransition] = useTransition();

  // OTP Verification State
  const [step, setStep] = useState<"register" | "verify">("register");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterData) => {
    setError("");
    setSuccessMsg("");
    try {
      const res = await handleRegister(data);
      if (!res.success) {
        throw new Error(res.message || "Registration failed");
      }
      setSuccessMsg(
        res.message || "Please check your email for the verification code.",
      );

      startTransition(() => {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      });
    } catch (err: Error | any) {
      setError(err.message || "Registration failed");
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!otp || otp.length < 4) {
      setError("Please enter a valid verification code");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await handleVerifyEmail(registeredEmail, otp);
      if (!res.success) {
        throw new Error(res.message || "Verification failed");
      }
      startTransition(() => {
        router.push("/login?verified=true");
      });
    } catch (err: Error | any) {
      setError(err.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const onResendOTP = async () => {
    setError("");
    setSuccessMsg("");
    setIsResending(true);
    try {
      const res = await handleResendOTP(registeredEmail);
      if (!res.success) {
        throw new Error(res.message || "Failed to resend code");
      }
      setSuccessMsg("A new verification code has been sent to your email.");
    } catch (err: Error | any) {
      setError(err.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-[#134e4a] text-xl font-semibold py-5 text-center">
        {step === "register" ? "Create a new account" : "Verify your email"}
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      {step === "register" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700"> Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-green-50/30 focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 transition-all text-sm"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-green-50/30 focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 transition-all text-sm"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-green-50/30 focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 transition-all text-sm"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Eye size={18} />
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              Use 8+ characters with uppercase, lowercase, a number, and a
              symbol.
            </p>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-green-50/30 focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 transition-all text-sm"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Eye size={18} />
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#134e4a] text-white py-3 rounded-xl font-semibold hover:bg-[#0e3a38] transition disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Register"}
          </button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={onVerify} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Verification Code
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-green-50/30 focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 transition-all text-center tracking-[0.2em] text-lg font-bold"
              maxLength={6}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Sent to <span className="font-semibold">{registeredEmail}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={isVerifying || pending}
            className="w-full bg-[#134e4a] text-white py-3 rounded-xl font-semibold hover:bg-[#0e3a38] transition disabled:opacity-70"
          >
            {isVerifying || pending ? "Verifying..." : "Verify Code"}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onResendOTP}
              disabled={isResending}
              className="text-sm text-[#00a884] font-semibold hover:underline disabled:opacity-70"
            >
              {isResending ? "Sending..." : "Didn't receive a code? Resend"}
            </button>
          </div>
        </form>
      )}

      {step === "register" && (
        <p className="mt-8 text-center text-sm font-medium">
          Already have an account?{" "}
          <a href="/login" className="text-[#00a884] font-bold hover:underline">
            Login
          </a>
        </p>
      )}
    </div>
  );
}
