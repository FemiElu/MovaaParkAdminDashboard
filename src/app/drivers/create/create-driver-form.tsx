"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DriverForm from "@/components/drivers/driver-form";
import { DriverFormData } from "@/lib/driver";
import { driverApiService } from "@/lib/driver-api-service";

interface CreateDriverFormProps {
  parkId: string;
}

export default function CreateDriverForm({ parkId }: CreateDriverFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: DriverFormData) => {
    setIsLoading(true);
    try {
      // Extract first and last names from full name
      const [first_name, ...rest] = (data.name || "").trim().split(/\s+/);
      const last_name = rest.join(" ") || "-";

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("first_name", first_name);
      formData.append("last_name", last_name);
      formData.append("phone_number", data.phone);
      formData.append("date_of_birth", data.dob);
      formData.append("address", data.address || "");
      formData.append("nin", data.nin);
      formData.append("plate_number", data.vehiclePlateNumber || "");
      formData.append("route_id", data.route_id);

      // Add the driver's license file if it exists
      if (data.driversLicenseFile) {
        formData.append("drivers_license", data.driversLicenseFile);
      }

      const response = await driverApiService.onboardDriver(formData);

      if (!response.success) {
        console.error("Driver creation failed:", response);
        const errorMessage = response.error || "Failed to create driver";
        throw new Error(errorMessage);
      }

      // Redirect to drivers list on success
      router.push("/drivers");
      router.refresh();
    } catch (error) {
      console.error("Error creating driver:", error);
      alert(error instanceof Error ? error.message : "Failed to create driver");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DriverForm onSubmit={handleSubmit} isLoading={isLoading} parkId={parkId} />
  );
}
