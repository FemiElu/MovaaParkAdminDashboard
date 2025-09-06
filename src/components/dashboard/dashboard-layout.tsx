"use client";

import { User } from "next-auth";
import { DashboardHeader } from "./header";
import { DashboardSidebar } from "./sidebar";
import { MobileHeader } from "./mobile-header";
import { MobileBottomNav } from "./mobile-bottom-nav";

interface Park {
  id: string;
  name: string;
  address: string;
}

interface DashboardLayoutProps {
  user: User & { parkId?: string; role?: string; park?: Park };
  children: React.ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Mobile Header */}
      <MobileHeader user={user} />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Desktop Header */}
        <DashboardHeader user={user} />

        {/* Content with mobile bottom padding */}
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}



