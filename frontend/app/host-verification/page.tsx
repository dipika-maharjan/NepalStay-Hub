"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Navbar from "@/app/_components/Navbar";
import api from "@/lib/api";
import useAuth from "@/context/AuthContext";

interface VerificationStatusResponse {
  verification?: {
    status?: string;
    rejectionReason?: string | null;
  };
}

export default function HostVerificationPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<string>("not_submitted");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [documentType, setDocumentType] = useState("citizenship");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    if (!loading && user) {
      fetchStatus();
    }
  }, [loading, user, router]);

  const fetchStatus = async () => {
    try {
      setFetching(true);
      const response = await api.get<VerificationStatusResponse>(
        "/host-verification/status",
      );
      const verification = response.data?.verification;
      setStatus(verification?.status || "not_submitted");
      setRejectionReason(verification?.rejectionReason || "");
    } catch (error: any) {
      if (error.response?.status === 404) {
        setStatus("not_submitted");
        setRejectionReason("");
      } else {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Unable to load verification status",
        );
      }
    } finally {
      setFetching(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (
      !allowedTypes.includes(file.type) &&
      !file.name.match(/\.(jpg|jpeg|png|webp)$/i)
    ) {
      toast.error(
        "Please upload a valid image file (.jpg, .jpeg, .png, .webp)",
      );
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be 5MB or less");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      toast.error("Please choose a document file");
      return;
    }

    const formData = new FormData();
    formData.append("documentType", documentType);
    formData.append("document", selectedFile);

    try {
      setSubmitting(true);
      await api.post("/host-verification/submit", formData);
      toast.success("Submitted for review");
      setSelectedFile(null);
      await fetchStatus();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit verification",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getBadgeClasses = (value: string) => {
    switch (value) {
      case "approved":
        return "bg-green-100 text-green-700 border border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="card p-6">Loading verification details...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Host verification
          </h1>
          <p className="mt-2 text-gray-600">
            We verify hosts to build trust and keep stays safe for everyone.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Current verification status
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Your submission is reviewed by our team.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${getBadgeClasses(status)}`}
              >
                {status === "approved" ? "Verified Host ✓" : status}
              </span>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              {status === "approved" ? (
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Your host account is verified.
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    You can now manage your listings and accept bookings with
                    confidence.
                  </p>
                  <Link href="/host" className="btn-primary mt-4 inline-flex">
                    Go to host dashboard
                  </Link>
                </div>
              ) : status === "rejected" ? (
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Your submission was rejected.
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {rejectionReason ||
                      "Please upload a clearer document and try again."}
                  </p>
                </div>
              ) : status === "pending" ? (
                <div>
                  <p className="text-sm font-medium text-yellow-700">
                    Your documents are under review.
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    We will notify you once a decision has been made.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    No verification has been submitted yet.
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Submit your identity document to unlock host features.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Why verification is needed
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>• Builds trust with guests and hosts.</li>
              <li>• Helps us protect the community from fraud and misuse.</li>
              <li>• Enables verified hosts to manage listings confidently.</li>
            </ul>

            {status !== "approved" && (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Document type
                  </label>
                  <select
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    className="input-field"
                  >
                    <option value="citizenship">Citizenship</option>
                    <option value="passport">Passport</option>
                    <option value="license">Driver&apos;s License</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Upload document
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="input-field cursor-pointer"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Accepted formats: JPG, JPEG, PNG, WEBP. Maximum size: 5MB.
                  </p>
                </div>

                {selectedFile && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                    <p className="font-medium">Selected file</p>
                    <p className="mt-1">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit for review"}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
