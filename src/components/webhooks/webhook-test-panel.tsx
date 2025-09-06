"use client";

import { useState, useEffect } from "react";
import { WebhookTestScenario } from "@/types/webhook";
import {
  generateDemoWebhookPayload,
  formatWebhookPayload,
  parseWebhookPayload,
} from "@/lib/webhook-utils";

type TestResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
} | null;

interface WebhookTestPanelProps {
  parkId?: string;
  onTestExecuted: () => void;
}

export function WebhookTestPanel({
  parkId,
  onTestExecuted,
}: WebhookTestPanelProps) {
  const [scenarios, setScenarios] = useState<WebhookTestScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [customPayload, setCustomPayload] = useState<string>("");
  const [testMode, setTestMode] = useState<"scenario" | "custom">("scenario");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult>(null);

  // Fetch test scenarios
  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await fetch("/api/webhooks/scenarios");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setScenarios(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching scenarios:", error);
    }
  };

  const executeTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      let payload;

      if (testMode === "scenario") {
        const scenario = scenarios.find((s) => s.id === selectedScenario);
        if (!scenario) {
          throw new Error("Selected scenario not found");
        }
        payload = scenario.payload;
      } else {
        const parsed = parseWebhookPayload(customPayload);
        if (!parsed.success) {
          throw new Error(parsed.error);
        }
        payload = parsed.payload;
      }

      const response = await fetch("/api/webhooks/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: testMode === "scenario" ? "test_scenario" : "test_custom",
          scenarioId: selectedScenario,
          customPayload: payload,
        }),
      });

      const result = await response.json();
      setResult(result);

      if (result.success) {
        onTestExecuted();
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDemoPayload = (
    type: "booking-created" | "booking-confirmed" | "booking-cancelled"
  ) => {
    if (!parkId) return;

    const payload = generateDemoWebhookPayload(type, parkId);
    setCustomPayload(formatWebhookPayload(payload));
    setTestMode("custom");
  };

  return (
    <div className="space-y-6">
      {/* Test Mode Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Test Mode</h3>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="scenario"
              checked={testMode === "scenario"}
              onChange={(e) =>
                setTestMode(e.target.value as "scenario" | "custom")
              }
              className="mr-2"
            />
            Predefined Scenarios
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="custom"
              checked={testMode === "custom"}
              onChange={(e) =>
                setTestMode(e.target.value as "scenario" | "custom")
              }
              className="mr-2"
            />
            Custom Payload
          </label>
        </div>
      </div>

      {/* Scenario Testing */}
      {testMode === "scenario" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Test Scenarios
          </h3>

          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="scenario-select"
              >
                Select Scenario
              </label>
              <select
                id="scenario-select"
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Select Scenario"
              >
                <option value="">Choose a scenario...</option>
                {Array.isArray(scenarios) &&
                  scenarios.map((scenario) =>
                    typeof scenario === "object" &&
                    scenario !== null &&
                    "id" in scenario &&
                    "name" in scenario ? (
                      <option
                        key={String(scenario.id)}
                        value={String(scenario.id)}
                      >
                        {String(scenario.name)}
                      </option>
                    ) : null
                  )}
              </select>
            </div>

            {selectedScenario && (
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="scenario-description"
                >
                  Scenario Description
                </label>
                <p
                  id="scenario-description"
                  className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md"
                >
                  {
                    scenarios.find(
                      (s: { id: string }) =>
                        String(s.id) === String(selectedScenario)
                    )?.description as React.ReactNode
                  }
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={executeTest}
              disabled={!selectedScenario || loading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-disabled={!selectedScenario || loading}
            >
              {loading ? "Testing..." : "Execute Test Scenario"}
            </button>
          </div>
        </div>
      )}

      {/* Custom Payload Testing */}
      {testMode === "custom" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Custom Payload
          </h3>

          <div className="space-y-4">
            {/* Quick Generate Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Generate
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => generateDemoPayload("booking-created")}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  New Booking
                </button>
                <button
                  onClick={() => generateDemoPayload("booking-confirmed")}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                >
                  Payment Confirmed
                </button>
                <button
                  onClick={() => generateDemoPayload("booking-cancelled")}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                >
                  Booking Cancelled
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JSON Payload
              </label>
              <textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder="Enter webhook payload JSON..."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
              />
            </div>

            <button
              onClick={executeTest}
              disabled={!customPayload.trim() || loading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Testing..." : "Execute Custom Test"}
            </button>
          </div>
        </div>
      )}

      {/* Test Results */}
      {result &&
        typeof result === "object" &&
        result !== null &&
        "success" in result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Test Results
            </h3>

            <div
              className={`p-4 rounded-md ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <span
                  className={`text-sm font-medium ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.success ? "✅ Test Successful" : "❌ Test Failed"}
                </span>
              </div>

              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
    </div>
  );
}
