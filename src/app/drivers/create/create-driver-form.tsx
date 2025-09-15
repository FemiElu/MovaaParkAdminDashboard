"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DriverForm from "@/components/drivers/driver-form";
import { DriverFormData } from "@/lib/driver";

interface CreateDriverFormProps {
  parkId: string;
}

export default function CreateDriverForm({ parkId }: CreateDriverFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: DriverFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/drivers", {
        method: "POST",
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
        console.error("Driver creation failed:", result);
        const errorMessage = result.details
          ? `Validation failed: ${result.details
              .map((d: { message: string }) => d.message)
              .join(", ")}`
          : result.error || "Failed to create driver";
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
