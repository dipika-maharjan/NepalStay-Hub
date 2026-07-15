"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Menu, X, ShieldCheck, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="text-green-800" size={28} />
            <span className="font-bold text-xl text-green-900">
              NepalStay-Hub
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/accommodations"
              className="text-gray-600 hover:text-green-800 font-medium"
            >
              Stays
            </Link>
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-green-800 font-medium"
                >
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-gray-600 hover:text-green-800 font-medium"
                  >
                    Admin
                  </Link>
                )}
                {user.role === "host" && (
                  <Link
                    href="/host"
                    className="text-gray-600 hover:text-green-800 font-medium"
                  >
                    My Listings
                  </Link>
                )}
                <Link
                  href="/bookings"
                  className="text-gray-600 hover:text-green-800 font-medium"
                >
                  Bookings
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-gray-700 hover:text-green-800"
                >
                  <User size={18} />
                  <span className="font-medium">{user.name.split(" ")[0]}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-red-600 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-3">
            <Link
              href="/accommodations"
              className="text-gray-700 font-medium"
              onClick={() => setOpen(false)}
            >
              Stays
            </Link>
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 font-medium"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm text-center"
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/profile"
                  className="text-gray-700 font-medium"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/bookings"
                  className="text-gray-700 font-medium"
                  onClick={() => setOpen(false)}
                >
                  Bookings
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-gray-700 font-medium"
                    onClick={() => setOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="text-red-600 font-medium text-left"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
