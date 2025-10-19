"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

export default function DebugAuth() {
  const { user: customAuthUser, isAuthenticated: customAuthIsAuthenticated } =
    useAuth();
  const [backendAuthStatus, setBackendAuthStatus] = useState<{
    isAuthenticated: boolean;
    user: unknown;
    error?: string;
  }>({ isAuthenticated: false, user: null });

  useEffect(() => {
    // Test backend authentication directly
    async function testBackendAuth() {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setBackendAuthStatus({
            isAuthenticated: false,
            user: null,
            error: "No token",
          });
          return;
        }

        const response = await fetch("http://127.0.0.1/api/v1/user/profile/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setBackendAuthStatus({ isAuthenticated: true, user: userData });
        } else {
          setBackendAuthStatus({
            isAuthenticated: false,
            user: null,
            error: `HTTP ${response.status}`,
          });
        }
      } catch (error) {
        setBackendAuthStatus({
          isAuthenticated: false,
          user: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    testBackendAuth();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Custom Auth Context</h2>
          <p>
            <strong>Is Authenticated:</strong>{" "}
            {customAuthIsAuthenticated ? "✅ Yes" : "❌ No"}
          </p>
          <p>
            <strong>User:</strong> {customAuthUser ? "✅ Exists" : "❌ Null"}
          </p>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(customAuthUser, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Backend API Test</h2>
          <p>
            <strong>Is Authenticated:</strong>{" "}
            {backendAuthStatus.isAuthenticated ? "✅ Yes" : "❌ No"}
          </p>
          <p>
            <strong>User:</strong>{" "}
            {backendAuthStatus.user ? "✅ Exists" : "❌ Null"}
          </p>
          {backendAuthStatus.error && (
            <p>
              <strong>Error:</strong> {backendAuthStatus.error}
            </p>
          )}
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(backendAuthStatus.user, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Local Storage</h2>
          <p>
            <strong>Auth Token:</strong>{" "}
            {typeof window !== "undefined"
              ? localStorage.getItem("auth_token")
                ? "✅ Exists"
                : "❌ Missing"
              : "N/A"}
          </p>
          <p>
            <strong>Refresh Token:</strong>{" "}
            {typeof window !== "undefined"
              ? localStorage.getItem("refresh_token")
                ? "✅ Exists"
                : "❌ Missing"
              : "N/A"}
          </p>
          <div className="mt-2">
            <strong>Auth Token Preview:</strong>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
              {typeof window !== "undefined" &&
              localStorage.getItem("auth_token")
                ? localStorage.getItem("auth_token")?.substring(0, 50) + "..."
                : "N/A"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
