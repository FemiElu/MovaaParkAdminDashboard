"use client";

import { useState } from "react";
import { authService } from "@/lib/auth-service";
import { formatNigerianPhoneNumber } from "@/lib/phone-utils";

export default function TestLogin() {
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("+2348161165400");
  const [password, setPassword] = useState("");

  const testLogin = async () => {
    setLoading(true);
    try {
      const formattedPhone = formatNigerianPhoneNumber(phoneNumber);
      console.log("Original phone:", phoneNumber);
      console.log("Formatted phone:", formattedPhone);

      const response = await authService.login({
        phone_number: formattedPhone,
        password: password,
      });

      setResult(response);
      console.log("Login response:", response);

      // Also log what's in localStorage after login
      console.log(
        "Auth token in localStorage:",
        localStorage.getItem("auth_token")
      );
      console.log(
        "Refresh token in localStorage:",
        localStorage.getItem("refresh_token")
      );
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Login</h1>

      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Phone Number:
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="+2348161165400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter your password"
          />
        </div>
      </div>

      <button
        onClick={testLogin}
        disabled={loading || !phoneNumber || !password}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Login"}
      </button>

      {!!result && (
        <div className="mt-4 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Current Local Storage:</h2>
        <p>
          <strong>Auth Token:</strong>{" "}
          {typeof window !== "undefined"
            ? localStorage.getItem("auth_token") || "None"
            : "N/A"}
        </p>
        <p>
          <strong>Refresh Token:</strong>{" "}
          {typeof window !== "undefined"
            ? localStorage.getItem("refresh_token") || "None"
            : "N/A"}
        </p>
      </div>
    </div>
  );
}
