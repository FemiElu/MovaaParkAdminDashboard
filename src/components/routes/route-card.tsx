"use client";

import { useState } from "react";
import { RouteConfig } from "@/types";
import { PencilIcon, TrashIcon, TruckIcon } from "@heroicons/react/24/outline";

interface RouteCardProps {
  route: RouteConfig;
  onEdit: (route: RouteConfig) => void;
  onDelete: (routeId: string) => void;
}

export function RouteCard({ route, onEdit, onDelete }: RouteCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the route to ${route.destination}?`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/routes/${route.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(route.id);
      } else {
        alert("Failed to delete route");
      }
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("Failed to delete route");
    } finally {
      setDeleting(false);
    }
  };

  const totalPrice = route.basePrice + 500; // Adding system service charge

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TruckIcon className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              {route.destination}
            </h3>
            <p className="text-sm text-gray-500">
              {route.isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(route)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit route"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete route"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Base Price:</span>
          <span className="font-medium text-gray-900">
            ₦{route.basePrice.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Service Charge:</span>
          <span className="font-medium text-gray-900">₦500</span>
        </div>

        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">
              Total Price:
            </span>
            <span className="font-bold text-green-600">
              ₦{totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Vehicle Capacity:</span>
          <span className="font-medium text-gray-900">
            {route.vehicleCapacity} seats
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created: {new Date(route.createdAt).toLocaleDateString()}</span>
          {route.updatedAt !== route.createdAt && (
            <span>
              Updated: {new Date(route.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}



