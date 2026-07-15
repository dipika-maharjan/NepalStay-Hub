"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Navbar from "@/app/_components/Navbar";
import api from "@/lib/api";
import useAuth from "@/context/AuthContext";

interface AccommodationItem {
  _id: string;
  title: string;
  type: string;
  pricePerNight: number;
  isApprovedByAdmin: boolean;
  isActive: boolean;
}

interface BookingItem {
  _id: string;
  userId?: {
    name?: string;
    email?: string;
  };
  accommodationId?: {
    title?: string;
  };
  roomTypeId?: {
    name?: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  bookingStatus: string;
}

export default function HostPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"listings" | "bookings" | "add">(
    "listings",
  );
  const [listings, setListings] = useState<AccommodationItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("homestay");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [amenityInput, setAmenityInput] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);

  const isHost = useMemo(() => user?.role === "host", [user]);
  const isHostVerified = useMemo(() => !!user?.isHostVerified, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
      return;
    }

    if (!loading && user && user.role !== "host") {
      router.replace("/");
      return;
    }

    if (!loading && user && user.role === "host") {
      fetchHostData();
    }
  }, [loading, user, router]);

  const fetchHostData = async () => {
    try {
      setLoadingListings(true);
      setLoadingBookings(true);
      const [listingsResponse, bookingsResponse] = await Promise.all([
        api.get("/accommodations/my"),
        api.get("/bookings/host"),
      ]);
      setListings(listingsResponse.data?.accommodations || []);
      setBookings(bookingsResponse.data?.bookings || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to load host dashboard",
      );
    } finally {
      setLoadingListings(false);
      setLoadingBookings(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;

    try {
      await api.delete(`/accommodations/${id}`);
      toast.success("Listing deleted");
      await fetchHostData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete listing",
      );
    }
  };

  const toggleActive = async (listing: AccommodationItem) => {
    try {
      await api.put(`/accommodations/${listing._id}`, {
        isActive: !listing.isActive,
      });
      toast.success("Listing updated");
      await fetchHostData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update listing",
      );
    }
  };

  const handleAmenityKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const value = amenityInput.trim();
      if (value && !amenities.includes(value)) {
        setAmenities([...amenities, value]);
      }
      setAmenityInput("");
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      toast.error("You can upload up to 10 images");
      return;
    }
    setImages(files);
  };

  const removeAmenity = (value: string) => {
    setAmenities(amenities.filter((item) => item !== value));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (
      !title ||
      !description ||
      !address ||
      !lat ||
      !lng ||
      !pricePerNight ||
      !maxGuests
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", type);
    formData.append("address", address);
    formData.append(
      "location",
      JSON.stringify({ lat: Number(lat), lng: Number(lng) }),
    );
    formData.append("pricePerNight", pricePerNight);
    formData.append("maxGuests", maxGuests);
    if (bedrooms) formData.append("bedrooms", bedrooms);
    if (bathrooms) formData.append("bathrooms", bathrooms);
    formData.append("amenities", JSON.stringify(amenities));

    images.forEach((image) => formData.append("images", image));

    try {
      setSubmitting(true);
      await api.post("/accommodations", formData);
      toast.success("Listing created successfully");
      setActiveTab("listings");
      setTitle("");
      setDescription("");
      setAddress("");
      setLat("");
      setLng("");
      setPricePerNight("");
      setMaxGuests("");
      setBedrooms("");
      setBathrooms("");
      setAmenities([]);
      setImages([]);
      await fetchHostData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create listing",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          Loading...
        </main>
      </div>
    );
  }

  if (!isHost) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!isHostVerified && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Your host account is not verified yet. Please verify your identity
            before creating listings.
            <Link
              href="/host-verification"
              className="ml-2 font-semibold text-yellow-900 underline"
            >
              Verify now
            </Link>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: "listings", label: "My Listings" },
            { key: "bookings", label: "Incoming Bookings" },
            { key: "add", label: "Add Listing" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                setActiveTab(tab.key as "listings" | "bookings" | "add")
              }
              className={`rounded-full px-4 py-2 text-sm font-medium ${activeTab === tab.key ? "btn-primary" : "btn-secondary"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "listings" && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                My Listings
              </h2>
            </div>

            {loadingListings ? (
              <div className="card p-6">Loading your listings...</div>
            ) : listings.length === 0 ? (
              <div className="card p-8 text-center text-gray-600">
                You have not created any listings yet.
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <article key={listing._id} className="card p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {listing.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Type: {listing.type}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">
                          Price: Rs. {listing.pricePerNight.toLocaleString()} /
                          night
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${listing.isApprovedByAdmin ? "badge-verified" : "badge-pending"}`}
                        >
                          {listing.isApprovedByAdmin
                            ? "Approved"
                            : "Pending review"}
                        </span>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={listing.isActive}
                            onChange={() => toggleActive(listing)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          Active
                        </label>
                        <button
                          onClick={() => handleDeleteListing(listing._id)}
                          className="btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "bookings" && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Incoming Bookings
              </h2>
            </div>

            {loadingBookings ? (
              <div className="card p-6">Loading incoming bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="card p-8 text-center text-gray-600">
                No bookings yet for your listings.
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <article key={booking._id} className="card p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {booking.userId?.name || "Traveler"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.userId?.email || "No email provided"}
                        </p>
                        <p className="mt-2 text-sm text-gray-700">
                          Accommodation:{" "}
                          {booking.accommodationId?.title || "Listing"}
                        </p>
                        <p className="text-sm text-gray-700">
                          Stay: {new Date(booking.checkIn).toLocaleDateString()}{" "}
                          - {new Date(booking.checkOut).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-700">
                          Guests: {booking.guests}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          Rs. {booking.totalPrice.toLocaleString()}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${booking.bookingStatus === "confirmed" ? "badge-verified" : booking.bookingStatus === "pending" ? "badge-pending" : "bg-red-100 text-red-700 border border-red-200"}`}
                        >
                          {booking.bookingStatus}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "add" && (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Listing
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Create a new stay and make it available for bookings.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="homestay">Homestay</option>
                    <option value="guesthouse">Guesthouse</option>
                    <option value="lodge">Lodge</option>
                    <option value="farmstay">Farmstay</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field min-h-28"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Latitude
                  </label>
                  <input
                    type="number"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Longitude
                  </label>
                  <input
                    type="number"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Price / night
                  </label>
                  <input
                    type="number"
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Max guests
                  </label>
                  <input
                    type="number"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Amenities
                </label>
                <input
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={handleAmenityKeyDown}
                  className="input-field"
                  placeholder="Type an amenity and press Enter"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => removeAmenity(amenity)}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {amenity} ×
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Images (up to 10)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="input-field cursor-pointer"
                />
                {images.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {images.length} image{images.length > 1 ? "s" : ""} selected
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? "Creating listing..." : "Create listing"}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
