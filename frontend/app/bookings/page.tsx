"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Navbar from "@/app/_components/Navbar";
import api from "@/lib/api";
import useAuth from "@/context/AuthContext";

interface BookingItem {
  _id: string;
  accommodationId: {
    title?: string;
    images?: string[];
    address?: string;
  };
  roomTypeId: {
    name?: string;
    pricePerNight?: number;
  };
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    if (!loading && user) {
      fetchBookings();
    }
  }, [loading, user, router]);

  const fetchBookings = async () => {
    try {
      setFetching(true);
      const response = await api.get("/bookings/my");
      setBookings(response.data?.bookings || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load bookings",
      );
    } finally {
      setFetching(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    const booking = bookings.find((item) => item._id === bookingId);
    const accommodationTitle =
      booking?.accommodationId?.title || "this booking";

    if (
      !window.confirm(`Are you sure you want to cancel ${accommodationTitle}?`)
    ) {
      return;
    }

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success("Booking cancelled successfully");
      await fetchBookings();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to cancel booking",
      );
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusBadgeClasses = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "badge-pending";
      case "confirmed":
        return "badge-verified";
      case "cancelled":
        return "bg-red-100 text-red-700 border border-red-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getPaymentBadgeClasses = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "badge-verified";
      case "pending":
        return "badge-pending";
      case "refunded":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const buildImageUrl = (images?: string[]) => {
    if (!images?.length) {
      return "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80";
    }

    const firstImage = images[0];
    return firstImage.startsWith("http")
      ? firstImage
      : `http://localhost:5050${firstImage}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My bookings</h1>
            <p className="text-sm text-gray-600">
              Manage your upcoming stays and cancellation requests.
            </p>
          </div>
          <Link
            href="/accommodations"
            className="btn-primary inline-flex w-fit items-center justify-center"
          >
            Browse stays
          </Link>
        </div>

        {fetching && bookings.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="card animate-pulse p-0 overflow-hidden"
              >
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="h-48 w-full bg-gray-200 md:h-auto md:w-72" />
                  <div className="flex-1 space-y-3 p-5">
                    <div className="h-5 w-40 rounded bg-gray-200" />
                    <div className="h-4 w-64 rounded bg-gray-200" />
                    <div className="h-4 w-32 rounded bg-gray-200" />
                    <div className="h-4 w-24 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="card flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-full bg-green-50 p-4 text-green-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                No bookings yet
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your reserved stays will appear here once you book one.
              </p>
            </div>
            <Link href="/accommodations" className="btn-primary">
              Explore accommodations
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const canCancel =
                booking.status === "pending" || booking.status === "confirmed";

              return (
                <article key={booking._id} className="card overflow-hidden p-0">
                  <div className="flex flex-col md:flex-row">
                    <img
                      src={buildImageUrl(booking.accommodationId?.images)}
                      alt={booking.accommodationId?.title || "Accommodation"}
                      className="h-56 w-full object-cover md:h-auto md:w-72"
                    />

                    <div className="flex-1 p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            {booking.accommodationId?.title || "Accommodation"}
                          </h2>
                          <p className="mt-1 text-sm text-gray-600">
                            {booking.accommodationId?.address ||
                              "Address not listed"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(booking.status)}`}
                          >
                            {booking.status}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClasses(booking.paymentStatus)}`}
                          >
                            {booking.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 text-sm text-gray-700 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Room
                          </p>
                          <p className="font-medium">
                            {booking.roomTypeId?.name || "Standard room"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Check-in
                          </p>
                          <p className="font-medium">
                            {formatDate(booking.checkIn)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Check-out
                          </p>
                          <p className="font-medium">
                            {formatDate(booking.checkOut)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Stay
                          </p>
                          <p className="font-medium">
                            {booking.nights} night
                            {booking.nights > 1 ? "s" : ""} • {booking.guests}{" "}
                            guest{booking.guests > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Total price
                          </p>
                          <p className="text-xl font-semibold text-gray-900">
                            Rs. {booking.totalPrice.toLocaleString()}
                          </p>
                        </div>

                        {canCancel && (
                          <button
                            onClick={() => handleCancel(booking._id)}
                            className="btn-danger"
                          >
                            Cancel booking
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
