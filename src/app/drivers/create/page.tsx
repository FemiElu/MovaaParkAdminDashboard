"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import CreateDriverForm from "./create-driver-form";
import { BackButton } from "@/components/ui/back-button";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function CreateDriverPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const parkId = user?.parkId ?? "lekki-phase-1-motor-park";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar />
        <MobileHeader />
        <div className="lg:pl-64">
          <DashboardHeader />
          <main className="p-4 lg:p-6 pb-20 lg:pb-6">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumb Navigation */}
              <nav className="mb-4">
                <ol className="flex items-center space-x-2 text-sm text-gray-600">
                  <li>
                    <Link
                      href="/"
                      className="hover:text-[var(--primary)] transition-colors"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mx-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <Link
                      href="/drivers"
                      className="hover:text-[var(--primary)] transition-colors"
                    >
                      Drivers
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-4 h-4 mx-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-900 font-medium">
                      Add Driver
                    </span>
                  </li>
                </ol>
              </nav>

              <div className="flex items-center gap-4 mb-6">
                <BackButton href="/drivers" />
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Add New Driver
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Create a new driver for {user?.park?.name || "your park"}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <CreateDriverForm parkId={parkId} />
              </div>
            </div>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </AuthGuard>
  );
}
