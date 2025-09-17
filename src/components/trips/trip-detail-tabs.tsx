"use client";

import { useState } from "react";
import { Trip, Vehicle, Booking, Parcel } from "@/lib/trips-store";
import { PassengerManifestTable } from "./passenger-manifest-table";
import { ParcelsTable } from "./parcels-table";
import { TripFinanceSummary } from "./trip-finance-summary";
import { AuditLog } from "./audit-log";

interface TripDetailTabsProps {
  trip: Trip;
  vehicle?: Vehicle;
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    parkId: string;
  };
  bookings: Booking[];
  parcels: Parcel[];
}

export function TripDetailTabs({
  trip,
  vehicle,
  driver,
  bookings,
  parcels,
}: TripDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("passengers");

  const tabs = [
    { id: "passengers", label: "Passengers", count: bookings.length },
    { id: "parcels", label: "Parcels", count: parcels.length },
    { id: "finances", label: "Finances", count: null },
    { id: "audit", label: "Audit Log", count: null },
  ];

  return (
    <div className="bg-white rounded-lg border">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "passengers" && (
          <PassengerManifestTable
            trip={trip}
            bookings={bookings}
            vehicle={vehicle}
          />
        )}
        {activeTab === "parcels" && (
          <ParcelsTable trip={trip} parcels={parcels} vehicle={vehicle} />
        )}
        {activeTab === "finances" && (
          <TripFinanceSummary
            trip={trip}
            bookings={bookings}
            parcels={parcels}
          />
        )}
        {activeTab === "audit" && <AuditLog trip={trip} />}
      </div>
    </div>
  );
}
