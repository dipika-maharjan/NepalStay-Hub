"use client";

import Image from "next/image";
import { Search, Star, MapPin, ChevronRight, Sparkles } from "lucide-react";
import mainImage from "../public/images/main-section.png";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getAllAccommodations,
  searchAccommodations,
  Accommodation,
} from "@/lib/api/accommodation";
import Navbar from "@/app/components/navbar/Navbar";
import Footer from "@/app/components/footer/Footer";
import { normalizeImageUrl } from "@/lib/image";

export default function HomePage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAccommodations = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getAllAccommodations();
        if (Array.isArray(res.data)) {
          setAccommodations(res.data.filter((a) => a.isActive !== false));
        } else {
          setAccommodations([]);
        }
      } catch (err) {
        setAccommodations([]);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load accommodations right now.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadAccommodations();
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    setLoading(true);
    setError(null);

    try {
      const res =
        value.trim() === ""
          ? await getAllAccommodations()
          : await searchAccommodations(value);

      if (Array.isArray(res.data)) {
        setAccommodations(res.data.filter((a) => a.isActive !== false));
      } else {
        setAccommodations([]);
      }
    } catch (err) {
      setAccommodations([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load accommodations right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Scroll to 'For You' section or go to /accommodations if no results
  const handleExploreNow = () => {
    const forYouSection = document.getElementById("for-you-section");
    if (accommodations.length > 0 && forYouSection) {
      forYouSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/accommodations";
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      <Navbar />

      <main className="flex-1 w-full flex flex-col items-center">
        {/* Premium Hero Section */}
        <section className="relative w-full max-w-[1400px] px-4 md:px-8 mt-6">
          <div className="relative h-[600px] w-full rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] ring-1 ring-black/5 group">
            <Image
              src={mainImage}
              alt="Nepal Mountains"
              fill
              className="object-cover scale-105 transition-transform duration-[20s] ease-out group-hover:scale-110"
              priority
            />
            {/* Elegant Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80" />

            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              {/* removed hero micro-phrase per UX request */}

              <h1
                className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight mb-6 drop-shadow-2xl leading-tight max-w-5xl animate-fade-in-up"
                style={{ animationDelay: "100ms" }}
              >
                Find Your Perfect <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-200 to-teal-100">
                  Escape
                </span>
              </h1>

              <p
                className="text-lg md:text-2xl text-white/90 font-light mb-14 max-w-2xl drop-shadow-md animate-fade-in-up"
                style={{ animationDelay: "200ms" }}
              >
                Curated stays and unforgettable experiences in the heart of
                Nepal.
              </p>

              {/* Glassmorphic Search Bar */}
              <div
                className="w-full max-w-3xl bg-white/10 backdrop-blur-xl p-2 rounded-full border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center transition-all duration-300 focus-within:bg-white/20 focus-within:border-white/40 animate-fade-in-up hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
                style={{ animationDelay: "300ms" }}
              >
                <div className="pl-6 pr-3">
                  <Search className="text-white/80" size={24} />
                </div>
                <input
                  type="text"
                  placeholder="Where do you want to go?"
                  className="w-full bg-transparent border-none text-white placeholder-white/70 text-lg py-4 focus:outline-none focus:ring-0 font-medium"
                  value={search}
                  onChange={handleSearch}
                />
                <button
                  onClick={handleExploreNow}
                  className="bg-teal-500 hover:bg-teal-400 text-white px-8 md:px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:scale-105 shrink-0 flex items-center gap-2"
                >
                  Explore <ChevronRight size={20} className="hidden md:block" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section
          id="for-you-section"
          className="w-full max-w-[1400px] px-4 md:px-8 py-24 scroll-mt-10"
        >
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                Curated For You
              </h2>
              <p className="text-slate-500 text-lg md:text-xl font-light">
                Handpicked stays that match your unique style.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col gap-4 animate-pulse">
                  <div className="w-full h-72 bg-slate-200/60 rounded-[2rem]" />
                  <div className="flex justify-between items-center px-2">
                    <div className="w-2/3 h-5 bg-slate-200/60 rounded-full" />
                    <div className="w-1/6 h-5 bg-slate-200/60 rounded-full" />
                  </div>
                  <div className="w-1/2 h-4 bg-slate-200/60 rounded-full mx-2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-32 bg-amber-50 rounded-[3rem] border border-amber-100 shadow-sm">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Search size={40} className="text-amber-500" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-3">
                We couldn&apos;t load accommodations
              </h3>
              <p className="text-slate-500 text-lg max-w-md text-center">
                {error}
              </p>
            </div>
          ) : accommodations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Search size={40} className="text-teal-400" />
              </div>
              <h3 className="text-3xl font-bold text-slate-800 mb-3">
                No matches found
              </h3>
              <p className="text-slate-500 text-lg max-w-md text-center">
                We couldn't find any accommodations matching your search. Try
                adjusting your destination.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                    className="group flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 border border-slate-100 hover:-translate-y-2"
                  >
                    <div className="relative h-72 w-full overflow-hidden p-3 pb-0">
                      <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden bg-slate-100">
                        {(() => {
                          const imgSrc = normalizeImageUrl(acc.images?.[0]);
                          const fallback = "/images/main-section.png";

                          return (
                            <img
                              src={imgSrc}
                              alt={displayTitle}
                              onError={(e) => {
                                const t = e.currentTarget as HTMLImageElement;
                                if (t.src !== fallback) t.src = fallback;
                              }}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                            />
                          );
                        })()}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Price Badge */}
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl font-bold text-slate-800 shadow-sm transition-transform duration-300 group-hover:scale-105">
                          <span className="text-xs text-slate-500 font-medium mr-1">
                            Rs
                          </span>
                          {acc.pricePerNight}
                          <span className="text-xs font-normal text-slate-500 ml-1">
                            / night
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col grow">
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <h4
                          className="font-bold text-xl text-slate-800 leading-tight line-clamp-1 group-hover:text-teal-600 transition-colors duration-300"
                          title={displayTitle}
                        >
                          {displayTitle}
                        </h4>
                        <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg shrink-0 border border-amber-100">
                          <Star
                            size={14}
                            className="fill-amber-400 text-amber-500"
                          />
                          <span className="text-sm font-bold text-amber-700">
                            {acc.totalReviews === 0
                              ? "New"
                              : acc.rating?.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500 mb-4 text-sm font-medium">
                        <MapPin size={16} className="text-teal-500 shrink-0" />
                        <p className="line-clamp-1" title={acc.address}>
                          {acc.address}
                        </p>
                      </div>

                      <p className="text-sm text-slate-500/90 leading-relaxed line-clamp-2 mt-auto font-light">
                        {displayDescription}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
