"use client";

import { useState } from "react";
import { PlayIcon, StopIcon, PlusIcon } from "@heroicons/react/24/outline";

interface SimulationPanelProps {
  parkId?: string;
  onBookingSimulated: () => void;
}

export function SimulationPanel({
  parkId,
  onBookingSimulated,
}: SimulationPanelProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(false);

  const startSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bookings/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_simulation" }),
      });

      if (response.ok) {
        setIsSimulating(true);
        console.log("🎬 Auto-simulation started");
      }
    } catch (error) {
      console.error("Failed to start simulation:", error);
    } finally {
      setLoading(false);
    }
  };

  const stopSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/bookings/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop_simulation" }),
      });

      if (response.ok) {
        setIsSimulating(false);
        console.log("🛑 Auto-simulation stopped");
      }
    } catch (error) {
      console.error("Failed to stop simulation:", error);
    } finally {
      setLoading(false);
    }
  };

  const simulateBooking = async (status: string = "RESERVED") => {
    setLoading(true);
    try {
      const response = await fetch("/api/bookings/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate",
          parkId,
          status,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("🎯 Manual booking simulated:", result.data);
        onBookingSimulated();
      }
    } catch (error) {
      console.error("Failed to simulate booking:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-amber-800">
            Demo Simulation
          </h3>
          <p className="text-xs text-amber-700">
            Test live bookings functionality
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isSimulating ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
              Auto-simulation active
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Auto-simulation stopped
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Auto Simulation Toggle */}
        {!isSimulating ? (
          <button
            onClick={startSimulation}
            disabled={loading}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors disabled:opacity-50"
          >
            <PlayIcon className="h-3 w-3" />
            <span>Start Auto-Simulation</span>
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            disabled={loading}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
          >
            <StopIcon className="h-3 w-3" />
            <span>Stop Auto-Simulation</span>
          </button>
        )}

        {/* Manual Simulation Buttons */}
        <button
          onClick={() => simulateBooking("RESERVED")}
          disabled={loading}
          className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors disabled:opacity-50"
        >
          <PlusIcon className="h-3 w-3" />
          <span>New Booking</span>
        </button>

        <button
          onClick={() => simulateBooking("CONFIRMED")}
          disabled={loading}
          className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors disabled:opacity-50"
        >
          <PlusIcon className="h-3 w-3" />
          <span>Confirmed</span>
        </button>

        <button
          onClick={() => simulateBooking("CANCELLED")}
          disabled={loading}
          className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
        >
          <PlusIcon className="h-3 w-3" />
          <span>Cancelled</span>
        </button>
      </div>

      <div className="mt-3 text-xs text-amber-700">
        <p>
          • Auto-simulation generates bookings every 45-60 seconds with
          realistic patterns
        </p>
        <p>
          • Manual buttons create instant test bookings for specific scenarios
        </p>
        <p>
          • All simulated data uses realistic Nigerian passenger information
        </p>
      </div>
    </div>
  );
}



