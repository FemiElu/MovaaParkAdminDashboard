"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { authService, SignupData } from "@/lib/auth-service";
import { formatNigerianPhoneNumber } from "@/lib/phone-utils";
import { AuthGuard } from "@/components/auth/auth-guard";
import LocationPicker, { LocationData } from "@/components/location/location-picker";

const signupSchema = z
  .object({
    email: z.string().email("Valid email required"),
    phone_number: z.string().min(10, "Valid phone number required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    terminal_name: z.string().min(2, "Terminal name is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate that location has been selected and confirmed
      if (!locationData) {
        setError("Please select and confirm your terminal location on the map");
        setIsLoading(false);
        return;
      }

      const signupData: SignupData = {
        email: data.email,
        phone_number: formatNigerianPhoneNumber(data.phone_number),
        password: data.password,
        terminal_name: data.terminal_name,
        terminal_address: locationData.address,
        terminal_city: locationData.city,
        terminal_state: locationData.state,
        terminal_latitude: locationData.latitude,
        terminal_longitude: locationData.longitude,
      };

      // Store terminal data in localStorage as temporary fallback
      localStorage.setItem(
        "movaa_terminal_data",
        JSON.stringify({
          terminal_name: data.terminal_name,
          terminal_address: locationData.address,
          terminal_city: locationData.city,
          terminal_state: locationData.state,
          terminal_latitude: locationData.latitude,
          terminal_longitude: locationData.longitude,
        })
      );

      setSuccess("Creating your account...");
      const response = await authService.signup(signupData);

      console.log("Signup response:", response);

      if (response.success) {
        console.log("Signup successful, redirecting to verify page...");
        setSuccess(
          "Account created successfully! Please check your phone for OTP verification."
        );
        // Redirect to OTP verification page
        setTimeout(() => {
          router.push(
            `/auth/verify?phone=${encodeURIComponent(
              formatNigerianPhoneNumber(data.phone_number)
            )}`
          );
        }, 2000);
      } else {
        console.error("Signup failed:", response.error);
        setError(response.error || "Registration failed");
      }
    } catch (error) {
      setError("An error occurred during registration");
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Park Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            The Movaa Park Admin Dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Account Information
              </h3>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address *
                </label>
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone_number"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number *
                </label>
                <input
                  {...register("phone_number")}
                  type="tel"
                  autoComplete="tel"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="e.g., 08012345678"
                />
                {errors.phone_number && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phone_number.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password *
                </label>
                <input
                  {...register("password")}
                  type="password"
                  autoComplete="new-password"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Create a password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password *
                </label>
                <input
                  {...register("confirmPassword")}
                  type="password"
                  autoComplete="new-password"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  Terminal Location
                </span>
              </div>
            </div>

            {/* Terminal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Terminal Information
              </h3>

              {/* Terminal Name */}
              <div>
                <label
                  htmlFor="terminal_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Terminal Name *
                </label>
                <input
                  {...register("terminal_name")}
                  type="text"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="e.g., Oshodi Motor Park"
                />
                {errors.terminal_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.terminal_name.message}
                  </p>
                )}
              </div>

              {/* Location Picker */}
              <div>
                <LocationPicker
                  onLocationSelect={(location) => setLocationData(location)}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <AuthGuard requireAuth={false}>
      <SignupForm />
    </AuthGuard>
  );
}
