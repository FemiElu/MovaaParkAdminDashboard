import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateDriverForm from "./create-driver-form";
import { BackButton } from "@/components/ui/back-button";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";

export default async function CreateDriverPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const parkId = session.user.parkId;
  if (!parkId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <MobileHeader user={session.user} />
      <div className="lg:pl-64">
        <DashboardHeader user={session.user} />
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
                  <span className="text-gray-900 font-medium">Add Driver</span>
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
                  Create a new driver for{" "}
                  {session.user.park?.name || "your park"}
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
  );
}
