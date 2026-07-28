"use client";

import { useEffect, useState } from "react";
import { getSecurityStatus } from "@/lib/api/security";
import { 
  ShieldCheck, Mail, Smartphone, Key, Monitor, Lock, AlertTriangle, 
  Clock, ShieldBan, Bot, ArrowRight, CheckCircle2
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "@/app/components/navbar/Navbar";

interface SecurityStatus {
  securityScore: number;
  emailVerified: boolean;
  mfaEnabled: boolean;
  passwordChanged: boolean;
  accountLocked: boolean;
  failedLoginsToday: number;
  lastLogin: {
    timestamp: string;
    ip: string;
    browser: string;
  } | null;
  recentActivity: {
    action: string;
    timestamp: string;
  }[];
  recommendations: string[];
}

export default function SecurityCenter() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const data = await getSecurityStatus();
      setStatus(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load security status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-[#0c7272] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Unable to Load Data</h2>
          <p className="text-gray-600 mt-2">There was a problem fetching your security status.</p>
        </div>
      </div>
    );
  }

  const getScoreData = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-600", border: "border-green-600", bg: "bg-green-100" };
    if (score >= 75) return { label: "Good", color: "text-yellow-600", border: "border-yellow-600", bg: "bg-yellow-100" };
    if (score >= 50) return { label: "Fair", color: "text-orange-500", border: "border-orange-500", bg: "bg-orange-100" };
    return { label: "Needs Attention", color: "text-red-600", border: "border-red-600", bg: "bg-red-100" };
  };

  const scoreData = getScoreData(status.securityScore);

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="px-6 py-8 max-w-5xl mx-auto space-y-6">
        
        {/* Header Area */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
            <p className="text-gray-500 mt-1">Review and manage your account security.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-500 mb-1">Security Score</p>
              <div className="flex flex-col items-end">
                <div className="text-4xl font-bold text-gray-900">
                  {status.securityScore} <span className="text-2xl text-gray-400 font-medium">/ 100</span>
                </div>
                <span className={`mt-1 font-bold ${scoreData.color}`}>{scoreData.label}</span>
              </div>
            </div>
            
            {/* Score Legend Card */}
            <div className="hidden md:block bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-600 space-y-2 font-mono">
              <div className="flex justify-between gap-8"><span>Needs Attention</span><span className="font-semibold text-red-600">&lt; 50</span></div>
              <div className="flex justify-between gap-8"><span>Fair</span><span className="font-semibold text-orange-500">50–74</span></div>
              <div className="flex justify-between gap-8"><span>Good</span><span className="font-semibold text-yellow-600">75–89</span></div>
              <div className="flex justify-between gap-8"><span>Excellent</span><span className="font-semibold text-green-600">90–100</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Security Checks */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Email Verification */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
                <div className="text-gray-600 mt-1">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Email Verification</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {status.emailVerified ? "Your email address has been successfully verified." : "Your email address is pending verification."}
                  </p>
                  <div className="mt-4">
                    {status.emailVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md border border-green-200">
                        <CheckCircle2 size={14} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-md border border-red-200">
                        Action Required
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-Factor Authentication */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
                <div className="text-gray-600 mt-1">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Multi-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {status.mfaEnabled ? "Your account is protected with Time-based One-Time Password (TOTP)." : "MFA is disabled. Enable it for extra security."}
                  </p>
                  <div className="mt-4">
                    {status.mfaEnabled ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md border border-green-200">
                        <CheckCircle2 size={14} /> Enabled
                      </span>
                    ) : (
                      <a href="/profile" className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-[#0c7272] hover:bg-[#0c7272] hover:text-white rounded-md border border-[#0c7272] transition-colors">
                        Setup MFA <ArrowRight size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Cloudflare Turnstile */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
                <div className="text-gray-600 mt-1">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Bot Protection</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Cloudflare Turnstile is enabled during login.
                  </p>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md border border-blue-200">
                      <CheckCircle2 size={14} /> Protected
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Protection */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
                <div className="text-gray-600 mt-1">
                  <Key size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Password Protection</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Your password meets the required security policy.
                  </p>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md border border-green-200">
                      <CheckCircle2 size={14} /> Strong Policy Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Lock Protection */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
                <div className="text-gray-600 mt-1">
                  <ShieldBan size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Account Lock Protection</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {!status.accountLocked ? "No account lock detected." : "Your account is currently locked."}
                  </p>
                  <div className="mt-4">
                    {!status.accountLocked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md border border-green-200">
                        <CheckCircle2 size={14} /> Protected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-md border border-red-200">
                        <AlertTriangle size={14} /> Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Failed Login Attempts */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
                <div className="text-gray-600 mt-1">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Failed Login Attempts Today</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {status.failedLoginsToday === 0 ? "None detected." : `${status.failedLoginsToday} failed attempt(s).`}
                  </p>
                  <div className="mt-4">
                    {status.failedLoginsToday === 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md border border-green-200">
                        <CheckCircle2 size={14} /> Normal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-md border border-yellow-200">
                        Warning
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommendations Block */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <ShieldCheck size={22} className="text-[#0c7272]" />
                Security Recommendations
              </h3>
              {status.recommendations && status.recommendations.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                  {status.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="w-2 h-2 rounded-full bg-[#0c7272] mt-2"></span>
                      <span className="font-medium">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No immediate security recommendations.</p>
              )}
            </div>
          </div>

          {/* Right Column - Logs & Activity */}
          <div className="space-y-6">
            
            {/* Last Successful Login */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-6 border-b pb-4">
                <Monitor size={20} className="text-gray-500" />
                Last Successful Login
              </h3>
              
              {status.lastLogin ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Date & Time</p>
                    <p className="text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-lg inline-block border border-gray-100">
                      {new Date(status.lastLogin.timestamp).toLocaleString("en-GB", {
                        day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "numeric", hour12: true
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">IP Address</p>
                    <p className="text-gray-900 font-medium">{status.lastLogin.ip || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Session Source</p>
                    <p className="text-gray-900 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0c7272]"></span>
                      {status.lastLogin.ip === "::1" || status.lastLogin.ip === "127.0.0.1" ? "Local Development" : "Web Application"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Monitor className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  No login history available.
                </div>
              )}
            </div>

            {/* Score Breakdown */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-6 border-b pb-4">
                <ShieldCheck size={20} className="text-gray-500" />
                Score Breakdown
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Email Verified</span>
                  <span className={`font-semibold ${status.emailVerified ? "text-green-600" : "text-gray-400"}`}>
                    {status.emailVerified ? "+20" : "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">MFA Enabled</span>
                  <span className={`font-semibold ${status.mfaEnabled ? "text-green-600" : "text-gray-400"}`}>
                    {status.mfaEnabled ? "+25" : "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Password Changed</span>
                  <span className={`font-semibold ${status.passwordChanged ? "text-green-600" : "text-gray-400"}`}>
                    {status.passwordChanged ? "+15" : "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Strong Password Policy</span>
                  <span className="font-semibold text-green-600">+10</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">No Failed Logins Today</span>
                  <span className={`font-semibold ${status.failedLoginsToday === 0 ? "text-green-600" : "text-gray-400"}`}>
                    {status.failedLoginsToday === 0 ? "+10" : "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Account Not Locked</span>
                  <span className={`font-semibold ${!status.accountLocked ? "text-green-600" : "text-gray-400"}`}>
                    {!status.accountLocked ? "+20" : "0"}
                  </span>
                </div>
                
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>{status.securityScore} / 100</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
