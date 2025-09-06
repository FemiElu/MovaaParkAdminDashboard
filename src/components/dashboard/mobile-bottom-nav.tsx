"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  TruckIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

// Core navigation items for mobile (reduced set for better UX)
const mobileNavigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  { name: "Routes", href: "/routes", icon: TruckIcon },
  { name: "Drivers", href: "/drivers", icon: UserGroupIcon },
  { name: "Trips", href: "/trips", icon: CalendarDaysIcon },
  { name: "Bookings", href: "/bookings", icon: BellIcon },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
      <nav className="flex justify-around">
        {mobileNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-colors ${
                isActive
                  ? "text-green-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <item.icon
                className={`h-6 w-6 mb-1 ${
                  isActive ? "text-green-600" : "text-gray-500"
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-xs font-medium truncate ${
                  isActive ? "text-green-600" : "text-gray-500"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}



