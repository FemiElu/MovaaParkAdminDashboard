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

      console.log("=== DRIVER CREATION RESPONSE ===");
      console.log("Full response:", response);
      console.log("response.success:", response.success);
      console.log("response.data:", response.data);
      console.log("response.data?.user:", response.data?.user);
      console.log("response.data?.user?.id:", response.data?.user?.id);

      if (!response.success) {
        console.error("Driver creation failed:", response);
        const errorMessage = response.error || "Failed to create driver";
        throw new Error(errorMessage);
      }

      // Store driver route information in localStorage
      console.log("Checking if we can store route info...");
      console.log("response.data?.user?.id exists?", !!response.data?.user?.id);

      if (response.data?.user?.id) {
        const routeInfo = {
          routeId: data.route_id,
          timestamp: Date.now(), // Store timestamp for debugging
        };

        // Get existing driver routes from localStorage
        const existingData = localStorage.getItem("driver_routes") || "{}";
        const driverRoutes = JSON.parse(existingData);
        driverRoutes[response.data.user.id] = routeInfo;
        localStorage.setItem("driver_routes", JSON.stringify(driverRoutes));

        console.log("=== STORING DRIVER ROUTE INFO ===");
        console.log("Driver ID:", response.data.user.id);
        console.log("Route ID stored:", data.route_id);
        console.log("Route info object:", routeInfo);
        console.log(
          "localStorage driver_routes:",
          localStorage.getItem("driver_routes")
        );

        // Force a small delay to ensure localStorage is persisted
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        console.warn(
          "⚠️ Cannot store driver route info - response.data?.user?.id is missing"
        );
        console.warn("Response structure:", JSON.stringify(response, null, 2));

        // Fallback: store by phone number so we can resolve after first list fetch
        try {
          const phone = data.phone;
          if (phone) {
            const pendingRaw =
              localStorage.getItem("driver_routes_by_phone") || "{}";
            const pending: Record<
              string,
              { routeId: string; timestamp: number }
            > = JSON.parse(pendingRaw);
            pending[phone] = { routeId: data.route_id, timestamp: Date.now() };
            localStorage.setItem(
              "driver_routes_by_phone",
              JSON.stringify(pending)
            );
            console.log(
              "Stored pending route mapping by phone:",
              phone,
              pending[phone]
            );
          }
        } catch (e) {
          console.warn("Failed to persist pending driver route by phone:", e);
        }
      }

      // Redirect to drivers list on success
      console.log("Redirecting to drivers list...");
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
