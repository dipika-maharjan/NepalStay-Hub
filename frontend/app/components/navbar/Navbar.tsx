"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "../../../public/images/logo.png";
import { normalizeImageUrl } from "@/lib/image";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="bg-white border-b border-gray-50 sticky top-0 z-50">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-center h-16">
          <button
            className="bg-transparent border-none p-0 m-0 flex items-center shrink-0"
            onClick={() => router.push(isAuthenticated ? "/user/dashboard" : "/")}
            aria-label="Home"
          >
            <Image src={logo} alt="Logo" width={48} height={48} />
          </button>

          {/* Desktop nav */}
          <div className="ml-auto hidden md:flex items-center gap-6 text-sm font-medium text-[#0c7272]">
            <button
              className="hover:text-black bg-transparent border-none p-0 m-0 text-inherit"
              onClick={() =>
                router.push(isAuthenticated ? "/user/dashboard" : "/")
              }
            >
              Home
            </button>
            <Link href="/accommodations" className="hover:text-black">
              Accommodations
            </Link>
            {!loading && mounted && isAuthenticated && (
              <Link href="/bookings" className="hover:text-black">
                My Bookings
              </Link>
            )}
            {!loading && mounted && isAuthenticated ? (
              <div className="relative ml-4" ref={dropdownRef}>
                {user?.imageUrl ? (
                  <img
                    src={normalizeImageUrl(user.imageUrl)}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#0c7272] cursor-pointer transition-shadow shadow-sm hover:shadow-lg"
                    onClick={() => setDropdownOpen((open) => !open)}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full border-2 border-[#0c7272] bg-[#0c7272] text-white flex items-center justify-center cursor-pointer font-bold text-xs"
                    onClick={() => setDropdownOpen((open) => !open)}
                  >
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-[#0c7272]"
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push("/profile");
                      }}
                    >
                      Go to Profile
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-[#0c7272] border-t border-gray-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <button className="border border-[#0c7272] px-4 py-2 rounded-full hover:bg-[#0c7272] hover:text-white transition">
                    Login
                  </button>
                </Link>
                <Link href="/register">
                  <button className="border border-[#0c7272] px-4 py-2 rounded-full hover:bg-[#0c7272] hover:text-white transition">
                    Register
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-auto p-2 text-[#0c7272]"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-3 text-sm font-medium text-[#0c7272]">
            <button
              className="text-left hover:text-black bg-transparent border-none p-0"
              onClick={() => {
                closeMobile();
                router.push(isAuthenticated ? "/user/dashboard" : "/");
              }}
            >
              Home
            </button>
            <Link
              href="/accommodations"
              className="hover:text-black"
              onClick={closeMobile}
            >
              Accommodations
            </Link>
            {!loading && mounted && isAuthenticated && (
              <>
                <Link
                  href="/bookings"
                  className="hover:text-black"
                  onClick={closeMobile}
                >
                  My Bookings
                </Link>
                <Link
                  href="/profile"
                  className="hover:text-black"
                  onClick={closeMobile}
                >
                  Profile
                </Link>
                <button
                  className="text-left text-red-600 hover:text-red-700 bg-transparent border-none p-0"
                  onClick={() => {
                    closeMobile();
                    logout();
                  }}
                >
                  Logout
                </button>
              </>
            )}
            {!loading && mounted && !isAuthenticated && (
              <div className="flex flex-col gap-3 pt-1">
                <Link href="/login" onClick={closeMobile}>
                  <button className="w-full border border-[#0c7272] px-4 py-2 rounded-full hover:bg-[#0c7272] hover:text-white transition">
                    Login
                  </button>
                </Link>
                <Link href="/register" onClick={closeMobile}>
                  <button className="w-full border border-[#0c7272] px-4 py-2 rounded-full hover:bg-[#0c7272] hover:text-white transition">
                    Register
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
