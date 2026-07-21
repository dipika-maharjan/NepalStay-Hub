"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

export const ADMIN_LINKS = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/accommodations", label: "Accommodations" },
    { href: "/admin/room-types", label: "Room Types" },
    { href: "/admin/optional-extras", label: "Optional Extras" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/reviews", label: "Reviews" },
];

interface SidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

function NavContent({ onLinkClick }: { onLinkClick?: () => void }) {
    const pathname = usePathname();
    const isActive = (href: string) =>
        href === "/admin" ? pathname === href : pathname?.startsWith(href);

    return (
        <nav className="p-2 space-y-1">
            {ADMIN_LINKS.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    onClick={onLinkClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive(link.href)
                            ? "bg-[#0c7272] text-white"
                            : "text-gray-700 hover:bg-[#0c7272]/10 hover:text-[#0c7272]"
                    }`}
                >
                    <span>{link.label}</span>
                </Link>
            ))}
        </nav>
    );
}

function SidebarHeader({ onClose }: { onClose?: () => void }) {
    return (
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
                <img
                    src="/images/logo.png"
                    alt="TripWise Nepal Logo"
                    className="h-8 w-8 object-contain"
                />
                <span className="font-semibold">Admin Panel</span>
            </Link>
            {onClose && (
                <button
                    onClick={onClose}
                    className="lg:hidden p-1 rounded-md hover:bg-gray-100 text-gray-600"
                    aria-label="Close menu"
                >
                    <X size={20} />
                </button>
            )}
        </div>
    );
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex lg:flex-col h-screen w-64 shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
                <SidebarHeader />
                <NavContent />
            </aside>

            {/* Mobile drawer */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={onMobileClose}
                        aria-hidden="true"
                    />
                    <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-50 overflow-y-auto lg:hidden">
                        <SidebarHeader onClose={onMobileClose} />
                        <NavContent onLinkClick={onMobileClose} />
                    </aside>
                </>
            )}
        </>
    );
}
