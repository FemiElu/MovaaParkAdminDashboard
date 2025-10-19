"use client";

import { useState } from "react";

export default function TestBackend() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    try {
      // Test if backend is reachable
      const response = await fetch("http://127.0.0.1/api/v1/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: "+2348161165400",
          password: "test123",
        }),
      });

      const data = await response.json();

      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
        url: response.url,
      });

      console.log("Backend test response:", {
        status: response.status,
        statusText: response.statusText,
        data: data,
        url: response.url,
      });
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
        type: "network_error",
      });
      console.error("Backend test error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Backend Connection</h1>

      <button
        onClick={testBackend}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Backend"}
      </button>

      {result && (
        <div className="mt-4 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 p-4 border rounded bg-yellow-50">
        <h2 className="text-lg font-semibold mb-2">What to Look For:</h2>
        <ul className="text-sm space-y-1">
          <li>
            • <strong>Status 200:</strong> Backend is working
          </li>
          <li>
            • <strong>Status 400:</strong> Invalid credentials (expected)
          </li>
          <li>
            • <strong>Status 401:</strong> Authentication failed (expected)
          </li>
          <li>
            • <strong>Network Error:</strong> Backend not running
          </li>
          <li>
            • <strong>Status 404:</strong> Wrong endpoint URL
          </li>
        </ul>
      </div>
    </div>
  );
}
