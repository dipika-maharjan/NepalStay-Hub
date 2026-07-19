"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
  UserCircle2,
} from "lucide-react";
import Navbar from "@/app/components/navbar/Navbar";
import api from "@/lib/api";
import { normalizeImageUrl } from "@/lib/image";
import { useAuth } from "@/context/AuthContext";

const Map = dynamic(() => import("@/app/_components/Map"), { ssr: false });

interface HostSummary {
  _id?: string;
  name?: string;
  profileImage?: string;
  bio?: string;
}

interface AccommodationDetail {
  _id: string;
  title: string;
  description: string;
  type: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  pricePerNight: number;
  maxGuests: number;
  images: string[];
  rating: number;
  totalReviews: number;
  amenities: string[];
  hostId: HostSummary;
}

interface RoomTypeDetail {
  _id: string;
  name: string;
  description?: string;
  pricePerNight: number;
  maxGuests: number;
}

interface ExtraDetail {
  _id: string;
  name: string;
  price: number;
  priceType: "per_person" | "per_booking";
}

interface ReviewItem {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    _id?: string;
    name?: string;
  };
  userId?: {
    _id?: string;
    name?: string;
  };
}

interface AccommodationPageData {
  accommodation: AccommodationDetail;
  roomTypes: RoomTypeDetail[];
  extras: ExtraDetail[];
}

interface SelectedExtra extends ExtraDetail {
  quantity: number;
}

export default function AccommodationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const id = params?.id;

  const [data, setData] = useState<AccommodationPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(
    null,
  );
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [specialRequest, setSpecialRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPageData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/accommodations/${id}`);
        setData(response.data);
      } catch {
        setError("We couldn’t load this accommodation right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const response = await api.get(`/reviews/${id}`);
        setReviews(response.data?.reviews || response.data?.data || []);
      } catch {
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (data?.roomTypes?.length) {
      setSelectedRoomTypeId(data.roomTypes[0]._id);
    }
  }, [data]);

  useEffect(() => {
    if (data?.extras?.length) {
      setSelectedExtras(
        data.extras.map((extra) => ({ ...extra, quantity: 0 })),
      );
    }
  }, [data]);

  const selectedRoomType = useMemo(
    () =>
      data?.roomTypes.find((roomType) => roomType._id === selectedRoomTypeId) ||
      null,
    [data, selectedRoomTypeId],
  );

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const difference = Math.round((end.getTime() - start.getTime()) / 86400000);
    return difference > 0 ? difference : 0;
  }, [checkIn, checkOut]);

  const extrasTotal = useMemo(() => {
    return selectedExtras.reduce((sum, extra) => {
      if (extra.quantity > 0) {
        const unitPrice =
          extra.priceType === "per_person" ? extra.price * guests : extra.price;
        return sum + unitPrice * extra.quantity;
      }
      return sum;
    }, 0);
  }, [selectedExtras, guests]);

  const roomPrice = selectedRoomType?.pricePerNight
    ? selectedRoomType.pricePerNight * nights
    : 0;
  const totalPrice = roomPrice + extrasTotal;

  const handleImageChange = (direction: "prev" | "next") => {
    if (!data?.accommodation.images?.length) return;
    if (direction === "prev") {
      setCurrentImageIndex(
        (prev) =>
          (prev - 1 + data.accommodation.images.length) %
          data.accommodation.images.length,
      );
    } else {
      setCurrentImageIndex(
        (prev) => (prev + 1) % data.accommodation.images.length,
      );
    }
  };

  const handleExtraQuantity = (extraId: string, delta: number) => {
    setSelectedExtras((prev) =>
      prev.map((extra) =>
        extra._id === extraId
          ? { ...extra, quantity: Math.max(0, extra.quantity + delta) }
          : extra,
      ),
    );
  };

  const handleBookNow = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please log in to book this stay.");
      router.push("/login");
      return;
    }

    if (!selectedRoomType || !checkIn || !checkOut || !guests) {
      toast.error("Please select your stay details before booking.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/bookings", {
        accommodationId: id,
        roomTypeId: selectedRoomType._id,
        checkIn,
        checkOut,
        guests,
        specialRequest,
        extrasTotal,
      });

      toast.success("Booking request created successfully!");
      router.push("/bookings");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to create booking right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="h-10 w-32 rounded bg-gray-200 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.9fr] gap-8">
            <div className="space-y-4">
              <div className="h-80 rounded-2xl bg-gray-200 animate-pulse" />
              <div className="h-6 w-1/2 rounded bg-gray-200 animate-pulse" />
              <div className="h-20 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="h-96 rounded-2xl bg-gray-200 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !data?.accommodation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            Unable to load this stay
          </h1>
          <p className="mt-3 text-gray-600">
            {error || "The requested accommodation could not be found."}
          </p>
          <Link href="/accommodations" className="btn-primary inline-flex mt-6">
            Browse accommodations
          </Link>
        </main>
      </div>
    );
  }

  const accommodation = data.accommodation;
  const images = accommodation.images?.length
    ? accommodation.images
    : ["/images/placeholder.jpg"];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/accommodations"
          className="inline-flex items-center gap-2 text-green-800 hover:text-green-900 mb-6"
        >
          <ArrowLeft size={18} />
          Back to accommodations
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.8fr] gap-8">
          <section className="space-y-6">
            <div className="rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              <div className="relative h-[320px] sm:h-[420px] bg-gray-100">
                <img
                  src={normalizeImageUrl(images[currentImageIndex])}
                  alt={accommodation.title}
                  className="h-full w-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleImageChange("prev")}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImageChange("next")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto p-3">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-20 w-24 shrink-0 overflow-hidden rounded-lg border ${index === currentImageIndex ? "border-green-800" : "border-gray-200"}`}
                  >
                    <img
                      src={normalizeImageUrl(image)}
                      alt={`${accommodation.title} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-green-900">
                  {accommodation.title}
                </h1>
                <span className="badge-verified">{accommodation.type}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{accommodation.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span>{accommodation.rating.toFixed(1)}</span>
                  <span>({accommodation.totalReviews} reviews)</span>
                </div>
              </div>

              <p className="mt-5 text-gray-700 leading-7">
                {accommodation.description}
              </p>

              <div className="mt-6">
                <h2 className="text-lg font-semibold text-green-900">
                  Amenities
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {accommodation.amenities?.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-800"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  {accommodation.hostId?.profileImage ? (
                    <img
                      src={normalizeImageUrl(accommodation.hostId.profileImage)}
                      alt={accommodation.hostId.name || "Host"}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle2 size={40} className="text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold text-green-900">
                      Hosted by {accommodation.hostId?.name || "Host"}
                    </p>
                    {accommodation.hostId?.bio ? (
                      <p className="text-sm text-gray-600">
                        {accommodation.hostId.bio}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-green-900">
                <ShieldCheck size={18} />
                <h2 className="text-xl font-semibold">Location</h2>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
                <Map
                  lat={accommodation.location.lat}
                  lng={accommodation.location.lng}
                  title={accommodation.title}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-green-900">
                Choose your room type
              </h2>
              <div className="mt-4 grid gap-3">
                {data.roomTypes.map((roomType) => (
                  <button
                    key={roomType._id}
                    type="button"
                    onClick={() => setSelectedRoomTypeId(roomType._id)}
                    className={`rounded-2xl border p-4 text-left transition ${selectedRoomTypeId === roomType._id ? "border-green-800 bg-green-50" : "border-gray-200 hover:border-green-300"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-green-900">
                          {roomType.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          {roomType.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-900">
                          Rs. {roomType.pricePerNight}
                        </p>
                        <p className="text-sm text-gray-500">
                          Up to {roomType.maxGuests} guests
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-green-900">
                Optional extras
              </h2>
              <div className="mt-4 space-y-3">
                {data.extras.map((extra) => {
                  const selectedExtra = selectedExtras.find(
                    (item) => item._id === extra._id,
                  );
                  return (
                    <div
                      key={extra._id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {extra.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Rs. {extra.price}{" "}
                          {extra.priceType === "per_person"
                            ? "per person"
                            : "per booking"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExtraQuantity(extra._id, -1)}
                          className="h-8 w-8 rounded-full border border-gray-300 text-lg"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {selectedExtra?.quantity || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleExtraQuantity(extra._id, 1)}
                          className="h-8 w-8 rounded-full border border-gray-300 text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-green-900">Reviews</h2>
              {reviewsLoading ? (
                <div className="mt-4 space-y-3">
                  <div className="h-16 rounded bg-gray-100" />
                  <div className="h-16 rounded bg-gray-100" />
                </div>
              ) : reviews.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">
                  No reviews yet for this stay.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review._id}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-green-900">
                          {review.user?.name || review.userId?.name || "Guest"}
                        </p>
                        <div className="flex items-center gap-1 text-yellow-500">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={`${review._id}-${index}`}
                              size={14}
                              className={
                                index < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">
                        {review.comment}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="lg:sticky lg:top-24 h-fit">
            <form
              onSubmit={handleBookNow}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-4"
            >
              <div>
                <h2 className="text-xl font-semibold text-green-900">
                  Book your stay
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Reserve your dates and add any extras you need.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  <span>Check-in</span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="input-field"
                    required
                  />
                </label>
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  <span>Check-out</span>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="input-field"
                    required
                  />
                </label>
              </div>

              <label className="space-y-1 text-sm font-medium text-gray-700 block">
                <span>Guests</span>
                <input
                  type="number"
                  min="1"
                  max={accommodation.maxGuests}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="input-field"
                  required
                />
              </label>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Selected room</span>
                  <span className="font-semibold text-green-900">
                    {selectedRoomType?.name || "Choose a room"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span>Stay</span>
                  <span>Rs. {roomPrice}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>Extras</span>
                  <span>Rs. {extrasTotal}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 font-semibold text-green-900">
                  <span>Total</span>
                  <span>Rs. {totalPrice}</span>
                </div>
              </div>

              <label className="space-y-1 text-sm font-medium text-gray-700 block">
                <span>Special requests</span>
                <textarea
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  className="input-field min-h-[96px]"
                  placeholder="Anything we should know?"
                />
              </label>

              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CalendarDays size={18} />
                )}
                {submitting ? "Booking..." : "Book Now"}
              </button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
}
