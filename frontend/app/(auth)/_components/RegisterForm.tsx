"use client";

import { useState, useTransition } from "react";
import { Eye, Check } from "lucide-react";
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
    watch,
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

  const passwordValue = watch("password", "");

  const hasLength = passwordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordValue);
  const hasLower = /[a-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);
  
  const passedChecks = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  let strengthLabel = "Weak";
  let strengthColor = "text-red-500";
  let barColor = "bg-red-500";
  let barWidth = "w-1/3";
  
  if (passwordValue.length === 0) {
    strengthLabel = "";
    barWidth = "w-0";
  } else if (passedChecks === 5) {
    strengthLabel = "Strong";
    strengthColor = "text-green-500";
    barColor = "bg-green-500";
    barWidth = "w-full";
  } else if (passedChecks >= 3) {
    strengthLabel = "Medium";
    strengthColor = "text-yellow-500";
    barColor = "bg-yellow-500";
    barWidth = "w-2/3";
  }

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
            
            {/* Password Strength Meter */}
            {passwordValue.length > 0 && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password Strength</span>
                  <span className={`text-xs font-bold ${strengthColor}`}>{strengthLabel}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} ${barWidth} transition-all duration-300`}></div>
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px]">
                  <div className={`flex items-center gap-1 ${hasLength ? "text-green-600 font-medium" : "text-gray-400"}`}>
                    <Check size={12} className={hasLength ? "opacity-100" : "opacity-0"} /> 8+ characters
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? "text-green-600 font-medium" : "text-gray-400"}`}>
                    <Check size={12} className={hasUpper ? "opacity-100" : "opacity-0"} /> Uppercase
                  </div>
                  <div className={`flex items-center gap-1 ${hasLower ? "text-green-600 font-medium" : "text-gray-400"}`}>
                    <Check size={12} className={hasLower ? "opacity-100" : "opacity-0"} /> Lowercase
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumber ? "text-green-600 font-medium" : "text-gray-400"}`}>
                    <Check size={12} className={hasNumber ? "opacity-100" : "opacity-0"} /> Number
                  </div>
                  <div className={`flex items-center gap-1 col-span-2 ${hasSpecial ? "text-green-600 font-medium" : "text-gray-400"}`}>
                    <Check size={12} className={hasSpecial ? "opacity-100" : "opacity-0"} /> Special character
                  </div>
                </div>
              </div>
            )}
            
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
        <>
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <a
              href="http://localhost:5051/api/auth/google"
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <img
                className="h-5 w-5 mr-2"
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google logo"
              />
              Sign up with Google
            </a>
          </div>

          <p className="mt-8 text-center text-sm font-medium">
            Already have an account?{" "}
            <a href="/login" className="text-[#00a884] font-bold hover:underline">
              Login
            </a>
          </p>
        </>
      )}
    </div>
  );
}
