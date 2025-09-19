"use client";

import { useState } from "react";
import { AssignDriverModal } from "./assign-driver-modal";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface TripDriverAssignmentProps {
  trip: {
    id: string;
    parkId: string;
    routeId: string;
    date: string;
    unitTime: string;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    rating: number;
    parkId: string;
  }>;
}

export function TripDriverAssignment({
  trip,
  driver,
  drivers,
}: TripDriverAssignmentProps) {
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleDriverAssign = async (driverId: string) => {
    try {
      const response = await fetch(`/api/trips/${trip.id}/assign-driver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driverId }),
      });

      if (response.ok) {
        setShowAssignModal(false);
        // Refresh the page to show updated driver
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to assign driver: ${error.message}`);
      }
    } catch (error) {
      console.error("Error assigning driver:", error);
      alert("Failed to assign driver. Please try again.");
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-sm font-medium text-gray-500">Driver</h3>
      <p className="text-lg font-semibold text-gray-900">
        {driver?.name || "Unassigned"}
      </p>
      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAssignModal(true)}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          {driver ? "Change Driver" : "Assign Driver"}
        </Button>
      </div>

      <AssignDriverModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        trip={trip}
        drivers={drivers}
        onAssign={handleDriverAssign}
      />
    </div>
  );
}
