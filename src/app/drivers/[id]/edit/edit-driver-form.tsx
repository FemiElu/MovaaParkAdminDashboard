"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DriverForm from "@/components/drivers/driver-form";
import { DriverFormData } from "@/lib/driver";
import { Driver } from "@/types";

interface EditDriverFormProps {
  driver: Driver;
  parkId: string;
}

export default function EditDriverForm({
  driver,
  parkId,
}: EditDriverFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: DriverFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/drivers/${driver.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          licenseExpiry: new Date(data.licenseExpiry), // Convert string to Date for API
          parkId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update driver");
      }

      // Redirect to driver detail on success
      router.push(`/drivers/${driver.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating driver:", error);
      alert(error instanceof Error ? error.message : "Failed to update driver");
    } finally {
      setIsLoading(false);
    }
  };

  // Convert driver data to form format
  const initialData: Partial<DriverFormData> = {
    name: driver.name,
    phone: driver.phone,
    licenseNumber: driver.licenseNumber,
    licenseExpiry: driver.licenseExpiry || "",
    qualifiedRoute: driver.qualifiedRoute,
    isActive: driver.isActive,
    rating: driver.rating,
    vehiclePlateNumber: driver.vehiclePlateNumber,
    address: driver.address,
    photo: driver.photo,
  };

  return (
    <DriverForm
      initialData={initialData}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      parkId={parkId}
    />
  );
}
