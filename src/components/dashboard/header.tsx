"use client";

import { useAuth } from "@/lib/auth-context";

// interface Park {
//   id: string;
//   name: string;
//   address: string;
// }

export function DashboardHeader() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {/* Prefer terminal/park; else fall back to first_name; else name */}
            {(user.terminal?.name ||
              user.park?.name ||
              user.first_name ||
              user.name ||
              "Park") + " Park Admin"}
          </h1>
          <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role?.toLowerCase().replace("_", " ")}
            </p>
            {/* Show terminal/park name under avatar area too */}
            <p className="text-xs text-gray-500 mt-1">
              {user.terminal?.name ||
                user.park?.name ||
                user.first_name ||
                user.name}
            </p>
          </div>

          <button
            onClick={() => logout()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
