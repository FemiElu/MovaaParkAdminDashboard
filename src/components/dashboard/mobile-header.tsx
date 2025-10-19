"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Additional navigation items for mobile menu overlay
const additionalNavigation = [
  { name: "Webhooks", href: "/webhooks", icon: ChatBubbleLeftRightIcon },
  { name: "Revenue", href: "/revenue", icon: CurrencyDollarIcon },
  { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
  { name: "Messaging", href: "/messaging", icon: ChatBubbleLeftRightIcon },
];

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {(user.terminal?.name ||
                user.park?.name ||
                user.first_name ||
                user.name ||
                "Park") + " Park"}
            </h1>
          </div>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Content */}
          <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                  <p className="text-sm text-gray-600">{user.name}</p>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-md"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Additional Features
                  </p>
                  {additionalNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-x-3 rounded-md p-3 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-green-50 text-green-700 border-l-4 border-green-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <item.icon className="h-5 w-5" aria-hidden="true" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              {/* User Info & Sign Out */}
              <div className="border-t border-gray-200 p-4">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role?.toLowerCase().replace("_", " ")}
                  </p>
                  {(user.terminal ||
                    user.park ||
                    user.name ||
                    user.first_name) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {user.terminal?.name ||
                        user.park?.name ||
                        user.first_name ||
                        user.name}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => logout()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
