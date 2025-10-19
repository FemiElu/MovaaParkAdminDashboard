"use client";

import { useEffect } from "react";
import { DashboardOverview } from "@/components/dashboard/overview";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user, loadUser } = useAuth();

  useEffect(() => {
    // Load user data when the dashboard loads
    if (!user) {
      loadUser();
    }
  }, [user, loadUser]);

  return (
    <AuthGuard>
      <DashboardLayout>
        <DashboardOverview parkId={user?.parkId} />
      </DashboardLayout>
    </AuthGuard>
  );
}
