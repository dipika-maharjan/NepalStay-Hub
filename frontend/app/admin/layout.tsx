"use client";

import { useAuth } from "../../context/AuthContext";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "./_components/Header";
import Sidebar from "./_components/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && (!isAuthenticated || user?.role !== "admin")) {
            router.push("/login");
        }
    }, [isAuthenticated, loading, user, router]);

    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [sidebarOpen]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!isAuthenticated || user?.role !== "admin") {
        return null;
    }

    return (
        <div className="flex w-full min-h-screen">
            <Sidebar
                mobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />
            <div className="flex-1 min-w-0 w-full bg-background">
                <Header
                    onMenuToggle={() => setSidebarOpen((open) => !open)}
                    sidebarOpen={sidebarOpen}
                />
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
