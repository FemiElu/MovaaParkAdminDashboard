"use client";

import { DashboardHeader } from "./header";
import { DashboardSidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";
import { MobileBottomNav } from "./mobile-bottom-nav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Desktop Header */}
        <DashboardHeader />

        {/* Content with mobile bottom padding */}
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
