"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Menu, X } from "lucide-react";

interface HeaderProps {
    onMenuToggle?: () => void;
    sidebarOpen?: boolean;
}

export default function Header({ onMenuToggle, sidebarOpen = false }: HeaderProps) {
    const { logout, user } = useAuth();

    return (
        <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-black/10 dark:border-white/10">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Global">
                <div className="flex h-16 items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            type="button"
                            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-700 shrink-0"
                            onClick={onMenuToggle}
                            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                            aria-expanded={sidebarOpen}
                        >
                            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                        <Link href="/admin" className="flex items-center gap-2 group min-w-0">
                            <img
                                src="/images/logo.png"
                                alt="TripWise Nepal Logo"
                                className="h-9 w-9 sm:h-10 sm:w-10 object-contain shrink-0"
                            />
                            <span className="text-sm sm:text-base font-semibold tracking-tight group-hover:opacity-80 transition-opacity truncate hidden sm:block">
                                Admin Panel
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden sm:flex h-6 items-center justify-center text-xs font-semibold max-w-[140px] truncate">
                            {user?.email || "Admin"}
                        </div>
                        <button
                            onClick={() => logout()}
                            className="border flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-foreground/5 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
}
