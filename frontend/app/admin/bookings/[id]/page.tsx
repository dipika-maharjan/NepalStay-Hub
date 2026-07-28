"use client";

import { useEffect, useState, use, useCallback } from "react";
import { getBookingById } from "@/lib/api/booking";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Booking {
  _id?: string;
  createdAt?: string;
  userId?: {
    name?: string;
    email?: string;
  } | null;
  accommodationId?: {
    name?: string;
    title?: string;
  } | null;
  roomTypeId?: {
    name?: string;
  } | null;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  guests?: number;
  roomsBooked?: number;
  specialRequest?: string;
  basePriceTotal?: number;
  extrasTotal?: number;
  tax?: number;
  serviceFee?: number;
  totalPrice?: number;
  bookingStatus?: string;
  paymentStatus?: string;
}

interface BookingDetails {
  booking: Booking;
  extras: {
    name: string;
    quantity: number;
    total: number;
  }[];
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AdminBookingDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [bookingData, setBookingData] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const normalizeBookingDetails = useCallback(
    (payload: unknown): BookingDetails => {
      const isBookingLike = (value: unknown): value is Booking => {
        if (!value || typeof value !== "object") return false;
        const candidate = value as Record<string, unknown>;
        return [
          "_id",
          "createdAt",
          "checkIn",
          "checkOut",
          "bookingStatus",
          "paymentStatus",
          "userId",
          "accommodationId",
          "roomTypeId",
        ].some((key) => key in candidate);
      };

      const extractBooking = (value: unknown): Booking => {
        if (!value) return {};

        if (isBookingLike(value)) {
          return value as Booking;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            const nestedBooking = extractBooking(item);
            if (Object.keys(nestedBooking).length > 0) {
              return nestedBooking;
            }
          }
          return {};
        }

        if (typeof value !== "object") {
          return {};
        }

        for (const child of Object.values(value as Record<string, unknown>)) {
          const nestedBooking = extractBooking(child);
          if (Object.keys(nestedBooking).length > 0) {
            return nestedBooking;
          }
        }

        return {};
      };

      const extractExtras = (value: unknown): BookingDetails["extras"] => {
        if (!value) return [];

        if (Array.isArray(value)) {
          return value as BookingDetails["extras"];
        }

        if (typeof value === "object") {
          for (const child of Object.values(value as Record<string, unknown>)) {
            const extras = extractExtras(child);
            if (extras.length > 0) {
              return extras;
            }
          }
        }

        return [];
      };

      const booking = extractBooking(payload);
      const extras = extractExtras(payload);

      return {
        booking: booking ?? {},
        extras,
      };
    },
    [],
  );

  const fetchBookingDetails = useCallback(async () => {
    try {
      const response = await getBookingById(resolvedParams.id);
      console.log("booking response", response);
      if (response.success) {
        const normalized = normalizeBookingDetails(response.data ?? response);
        console.log("normalized booking data", normalized);
        setBookingData(normalized);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load booking details";
      toast.error(message);
      router.push("/admin/bookings");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, router, normalizeBookingDetails]);

  useEffect(() => {
    if (resolvedParams.id && resolvedParams.id !== "undefined") {
      fetchBookingDetails();
    } else {
      toast.error("Invalid booking ID");
      router.push("/admin/bookings");
    }
  }, [fetchBookingDetails, resolvedParams.id, router]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return "N/A";
    return parsedDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="text-center py-10">Loading booking details...</div>;
  }

  if (!bookingData) {
    return <div className="text-center py-10">Booking not found</div>;
  }

  const { booking, extras } = bookingData;
  const guest =
    typeof booking?.userId === "object" && booking.userId
      ? booking.userId
      : null;
  const accommodation =
    typeof booking?.accommodationId === "object" && booking.accommodationId
      ? booking.accommodationId
      : null;
  const roomType =
    typeof booking?.roomTypeId === "object" && booking.roomTypeId
      ? booking.roomTypeId
      : null;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 text-[#0c7272] hover:text-[#0a5555]"
      >
        <ArrowLeft size={20} />
        Back to Bookings
      </Link>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
          Booking Details
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Guest Information</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{guest?.name || "N/A"}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <span className="ml-2 font-medium break-all">
                  {guest?.email || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Booking Information</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Booking ID:</span>
                <span className="ml-2 font-mono text-sm break-all">
                  #{booking?._id ? booking._id.slice(-8) : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Created:</span>
                <span className="ml-2">{formatDate(booking?.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-6" />

        <div>
          <h2 className="text-lg font-semibold mb-4">Accommodation Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Accommodation:</span>
              <span className="ml-2 font-medium">
                {accommodation?.name || accommodation?.title || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Room Type:</span>
              <span className="ml-2 font-medium">
                {roomType?.name || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Check-in:</span>
              <span className="ml-2">{formatDate(booking?.checkIn)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Check-out:</span>
              <span className="ml-2">{formatDate(booking?.checkOut)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Nights:</span>
              <span className="ml-2 font-medium">
                {booking?.nights ?? "N/A"}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Guests:</span>
              <span className="ml-2 font-medium">
                {booking?.guests ?? "N/A"}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Rooms Booked:</span>
              <span className="ml-2 font-medium">
                {booking?.roomsBooked ?? "N/A"}
              </span>
            </div>
            {booking?.specialRequest && (
              <div className="sm:col-span-2">
                <span className="text-sm text-gray-600">Special Request:</span>
                <p className="mt-1 text-sm">{booking.specialRequest}</p>
              </div>
            )}
          </div>
        </div>

        <hr className="my-6" />

        <div>
          <h2 className="text-lg font-semibold mb-4">Price Breakdown</h2>
          <div className="space-y-2 max-w-md">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">
                Base Price ({booking?.nights ?? 0} nights ×{" "}
                {booking?.roomsBooked ?? 0} room
                {(booking?.roomsBooked ?? 0) > 1 ? "s" : ""}):
              </span>
              <span className="font-medium text-sm">
                Rs. {booking?.basePriceTotal?.toFixed(2) ?? "N/A"}
              </span>
            </div>

            {extras && extras.length > 0 && (
              <>
                <div className="text-sm font-semibold text-gray-700 mt-3">
                  Optional Extras:
                </div>
                {extras.map((extra, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {extra.name} (×{extra.quantity})
                    </span>
                    <span>Rs. {extra.total?.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 text-sm">Extras Total:</span>
                  <span className="font-medium text-sm">
                    Rs. {booking?.extrasTotal?.toFixed(2) ?? "N/A"}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (13%):</span>
              <span>Rs. {booking?.tax?.toFixed(2) ?? "N/A"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Fee:</span>
              <span>Rs. {booking?.serviceFee?.toFixed(2) ?? "N/A"}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>TOTAL:</span>
              <span className="text-[#0c7272]">
                Rs. {booking?.totalPrice?.toFixed(2) ?? "N/A"}
              </span>
            </div>
          </div>
        </div>

        <hr className="my-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Booking Status:</span>
            <span
              className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${
                booking?.bookingStatus === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : booking?.bookingStatus === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : booking?.bookingStatus === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
              }`}
            >
              {booking?.bookingStatus || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Payment Status:</span>
            <span
              className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${
                booking?.paymentStatus === "paid"
                  ? "bg-green-100 text-green-800"
                  : booking?.paymentStatus === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {booking?.paymentStatus || "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
