"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  authService,
  ForgotPasswordData,
  ResetPasswordData,
} from "@/lib/auth-service";
import { formatNigerianPhoneNumber } from "@/lib/phone-utils";

const forgotPasswordSchema = z.object({
  phone_number: z.string().min(10, "Valid phone number required"),
});

const resetPasswordSchema = z
  .object({
    phone_number: z.string().min(10, "Valid phone number required"),
    otp: z
      .string()
      .min(4, "OTP must be at least 4 digits")
      .max(6, "OTP must be at most 6 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState<"forgot" | "reset">("forgot");
  const [phoneNumber, setPhoneNumber] = useState("");
  const router = useRouter();

  const forgotForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const forgotData: ForgotPasswordData = {
        phone_number: formatNigerianPhoneNumber(data.phone_number),
      };

      const response = await authService.forgotPassword(forgotData);

      if (response.success) {
        setSuccess("OTP sent successfully! Please check your phone.");
        setPhoneNumber(formatNigerianPhoneNumber(data.phone_number));
        setStep("reset");
        resetForm.setValue("phone_number", data.phone_number);
      } else {
        setError(response.error || "Failed to send OTP");
      }
    } catch {
      setError("An error occurred while sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPasswordSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const resetData: ResetPasswordData = {
        phone_number: formatNigerianPhoneNumber(data.phone_number),
        password: data.password,
        otp: data.otp,
      };

      const response = await authService.resetPassword(resetData);

      if (response.success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setError(response.error || "Password reset failed");
      }
    } catch {
      setError("An error occurred while resetting password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === "forgot" ? "Reset Password" : "Enter New Password"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === "forgot"
              ? "Enter your phone number to receive OTP"
              : `Enter OTP sent to ${phoneNumber}`}
          </p>
        </div>

        {step === "forgot" ? (
          <form
            className="mt-8 space-y-6"
            onSubmit={forgotForm.handleSubmit(onForgotPasswordSubmit)}
          >
            {/* Phone Number */}
            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                {...forgotForm.register("phone_number")}
                type="tel"
                autoComplete="tel"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="e.g., 08012345678 or 2348012345678"
              />
              {forgotForm.formState.errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">
                  {forgotForm.formState.errors.phone_number.message}
                </p>
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
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <form
            className="mt-8 space-y-6"
            onSubmit={resetForm.handleSubmit(onResetPasswordSubmit)}
          >
            {/* OTP */}
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700"
              >
                Verification Code
              </label>
              <input
                {...resetForm.register("otp")}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center text-lg tracking-widest"
                placeholder="Enter OTP"
                maxLength={6}
              />
              {resetForm.formState.errors.otp && (
                <p className="mt-1 text-sm text-red-600">
                  {resetForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                {...resetForm.register("password")}
                type="password"
                autoComplete="new-password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Enter new password"
              />
              {resetForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {resetForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <input
                {...resetForm.register("confirmPassword")}
                type="password"
                autoComplete="new-password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Confirm new password"
              />
              {resetForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
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
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </button>
            </div>

            {/* Back to Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("forgot")}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Back to Phone Number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
