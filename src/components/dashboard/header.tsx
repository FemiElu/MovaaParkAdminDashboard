"use client";

import { signOut } from "next-auth/react";
import { User } from "next-auth";

interface Park {
  id: string;
  name: string;
  address: string;
}

interface DashboardHeaderProps {
  user: User & { parkId?: string; role?: string; park?: Park };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.park?.name || "Park Admin"} Dashboard
          </h1>
          <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role?.toLowerCase().replace("_", " ")}
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
