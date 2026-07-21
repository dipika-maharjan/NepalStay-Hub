"use client";

import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyBookings } from "@/lib/api/booking";
import {
  getAllAccommodations,
  searchAccommodations,
  Accommodation,
} from "../../../lib/api/accommodation";
import Image from "next/image";
import { normalizeImageUrl } from "@/lib/image";
import { Search, Star } from "lucide-react";

interface Booking {
  _id: string;
  accommodationId: { _id: string; name: string };
  roomTypeId: { _id: string; name: string };
  checkIn: string;
  checkOut: string;
  guests: number;
  roomsBooked: number;
  nights: number;
  totalPrice: number;
  bookingStatus: string;
}

// Accommodation type imported from API

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcoming, setUpcoming] = useState<Booking | null>(null);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      getMyBookings().then((res) => {
        if (res.success) {
          const bookingsData: Booking[] = res.data;
          setBookings(bookingsData);
          setUpcoming(
            bookingsData.find((b) => new Date(b.checkIn) > new Date()) || null,
          );
        }
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setLoading(true);
    getAllAccommodations()
      .then((res: any) => {
        if (Array.isArray(res.data)) {
          setAccommodations(
            res.data.filter((a: Accommodation) => a.isActive !== false),
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim() === "") {
      setLoading(true);
      getAllAccommodations()
        .then((res: any) => {
          if (Array.isArray(res.data)) {
            setAccommodations(
              res.data.filter((a: Accommodation) => a.isActive !== false),
            );
          }
        })
        .finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    searchAccommodations(value)
      .then((res: any) => {
        if (Array.isArray(res.data)) {
          setAccommodations(
            res.data.filter((a: Accommodation) => a.isActive !== false),
          );
        }
      })
      .finally(() => setLoading(false));
  };

  // Scroll to 'For You' section or go to /accommodations if no results
  const handleExploreNow = () => {
    const forYouSection = document.getElementById("for-you-section");
    if (accommodations.length > 0 && forYouSection) {
      forYouSection.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/accommodations");
    }
  };

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-white text-[#134e4a]">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Personalized Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0c7272]">
            Welcome, {user?.name || "Traveler"}!
          </h1>
          <p className="text-gray-600 text-base sm:text-lg break-all">{user?.email}</p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center mb-10">
          <div className="relative w-full max-w-xl">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search destinations, places"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0c7272]/20"
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative h-56 sm:h-72 md:h-87 rounded-2xl sm:rounded-3xl overflow-hidden mb-10 sm:mb-12 shadow-xl">
          <Image
            src="/images/main-section.png"
            alt="Nepal Mountains"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 px-4">Discover Your Nepal</h2>
            <p className="mb-4 sm:mb-6 opacity-90 px-4 text-sm sm:text-base">
              Personalized trips to breathtaking destinations.
            </p>
            <button
              className="bg-[#ff9f1c] hover:bg-[#f39200] text-white px-8 py-3 rounded-full font-bold transition-transform hover:scale-105"
              onClick={handleExploreNow}
              disabled={accommodations.length === 0}
            >
              Explore Now
            </button>
          </div>
        </section>

        {/* For You Section */}
        <section id="for-you-section" className="mb-12 scroll-mt-24">
          <h3 className="text-2xl font-bold mb-6">For You</h3>
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : accommodations.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No accommodations found. Try searching or check back later!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accommodations.map((acc) => {
                const displayTitle = acc.title || acc.name || "Accommodation";
                const displayDescription =
                  acc.description ||
                  acc.overview ||
                  "Experience an unforgettable stay with premium amenities.";

                return (
                  <Link
                    key={acc._id}
                    href={`/accommodations/${acc._id}`}
                    className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow"
                    title={displayTitle}
                  >
                    <div className="h-48 relative">
                      {(() => {
                        const imgSrc = normalizeImageUrl(acc.images?.[0]);
                        const isLocal =
                          imgSrc.startsWith("/images/") ||
                          imgSrc.startsWith("/_next/");
                        if (isLocal) {
                          return (
                            <Image
                              src={imgSrc}
                              alt={displayTitle}
                              fill
                              className="object-cover"
                            />
                          );
                        } else {
                          return (
                            <img
                              src={imgSrc}
                              alt={displayTitle}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          );
                        }
                      })()}
                    </div>
                    <div className="p-4 flex flex-col grow">
                      <div className="flex justify-between items-start mb-1">
                        <h4
                          className="font-bold text-lg leading-tight line-clamp-1"
                          title={displayTitle}
                        >
                          {displayTitle}
                        </h4>
                        <span className="flex items-center text-xs font-bold gap-1 shrink-0">
                          <Star
                            size={14}
                            className="fill-yellow-400 text-yellow-400"
                          />
                          {acc.rating?.toFixed(1) ?? "-"}
                        </span>
                      </div>
                      <p
                        className="text-xs text-[#0c7272] mb-2 font-medium line-clamp-1"
                        title={acc.address}
                      >
                        {acc.address}
                      </p>
                      <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-3">
                        {displayDescription}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Booking Card */}
        {upcoming && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[#0c7272] mb-2">
              Your Next Booking
            </h2>
            <div className="bg-white rounded-xl shadow-lg border p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <div className="font-bold text-lg text-[#0c7272]">
                  {upcoming.accommodationId.name}
                </div>
                <div className="text-gray-600">
                  Room: {upcoming.roomTypeId.name}
                </div>
                <div className="text-gray-500">
                  Check-in: {formatDate(upcoming.checkIn)}
                </div>
                <div className="text-gray-500">
                  Check-out: {formatDate(upcoming.checkOut)}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-2xl font-bold text-[#0c7272]">
                  Rs. {upcoming.totalPrice.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  {upcoming.bookingStatus}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent Bookings Section */}
        <section>
          <h2 className="text-xl font-semibold text-[#0c7272] mb-2">
            Recent Bookings
          </h2>
          <div className="grid gap-4">
            {bookings.slice(0, 3).map((b: Booking) => (
              <div
                key={b._id}
                className="bg-white rounded-xl shadow border p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
              >
                <div>
                  <div className="font-bold text-[#0c7272]">
                    {b.accommodationId.name}
                  </div>
                  <div className="text-gray-600">Room: {b.roomTypeId.name}</div>
                  <div className="text-gray-500">
                    Check-in: {formatDate(b.checkIn)}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm text-gray-500">{b.bookingStatus}</div>
                  <Link
                    href={`/bookings/${b._id}`}
                    className="text-[#0c7272] underline font-semibold"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/accommodations"
            className="px-6 sm:px-8 py-3 bg-[#0c7272] text-white rounded-xl text-base sm:text-lg font-semibold shadow hover:bg-[#095959] transition text-center"
          >
            Book Accommodation
          </Link>
          <Link
            href="/bookings"
            className="px-6 sm:px-8 py-3 border border-[#0c7272] text-[#0c7272] rounded-xl text-base sm:text-lg font-semibold shadow hover:bg-[#0c7272] hover:text-white transition text-center"
          >
            My Bookings
          </Link>
        </div>
      </main>
    </div>
  );
}
// ...existing code...
