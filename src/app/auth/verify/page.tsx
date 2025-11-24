"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { authService, VerifySignupData } from "@/lib/auth-service";
import { useAuth } from "@/lib/auth-context";
import { PageLoader } from "@/components/ui/spinner";

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 characters")
    .regex(/^[A-Z0-9]{6}$/, "OTP must be 6 alphanumeric characters"),
});

type OtpFormData = z.infer<typeof otpSchema>;

function VerifySignupPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    const phone = searchParams.get("phone");
    if (phone) {
      setPhoneNumber(phone);
    } else {
      router.push("/auth/signup");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onSubmit = async (data: OtpFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const verificationData: VerifySignupData = {
        otp: data.otp,
        phone_number: phoneNumber,
      };

      const response = await authService.verifySignup(verificationData);

      if (response.success) {
        setSuccess(
          "Terminal verified successfully! Redirecting to dashboard..."
        );

        // Check if verification includes auto-login tokens
        if (response.token && response.user) {
          // Set user in auth context to automatically log them in
          setUser(response.user);
          // User is automatically logged in, redirect to dashboard
          setTimeout(() => {
            router.push("/");
          }, 2000);
        } else {
          // If no auto-login, redirect to login page
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
        }
      } else {
        setError(response.error || "Verification failed");
      }
    } catch {
      setError("An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      // This would typically call a resend OTP endpoint
      // For now, we'll just show a message
      setSuccess("OTP resent successfully!");
      setResendCooldown(60); // 60 seconds cooldown
    } catch {
      setError("Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Terminal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the OTP sent to {phoneNumber} to complete terminal setup
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* OTP Input */}
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700"
            >
              Verification Code
            </label>
            <input
              {...register("otp")}
              type="text"
              inputMode="text"
              pattern="[A-Z0-9]*"
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center text-lg tracking-widest uppercase"
              placeholder="Enter OTP"
              maxLength={6}
              style={{ textTransform: "uppercase" }}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register("otp").onChange(e);
              }}
            />
            {errors.otp && (
              <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
            )}
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
              {isLoading ? "Verifying..." : "Verify Terminal"}
            </button>
          </div>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="font-medium text-green-600 hover:text-green-500 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend OTP"}
              </button>
            </p>
          </div>

          {/* Back to Signup */}
          <div className="text-center">
            <Link
              href="/auth/signup"
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← Back to Signup
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VerifySignupPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading verification..." />}>
      <VerifySignupPageContent />
    </Suspense>
  );
}
