"use client";

import { useState, useEffect, useCallback } from "react";
import { WebhookConfig } from "@/types/webhook";

interface WebhookConfigPanelProps {
  parkId?: string;
  onConfigUpdated: () => void;
}

export function WebhookConfigPanel({
  parkId,
  onConfigUpdated,
}: WebhookConfigPanelProps) {
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/webhooks/config?parkId=${parkId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConfig(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching webhook config:", error);
    } finally {
      setLoading(false);
    }
  }, [parkId]);

  useEffect(() => {
    if (parkId) {
      fetchConfig();
    }
  }, [parkId, fetchConfig]);

  const saveConfig = async () => {
    if (!config || !parkId) return;

    setSaving(true);
    try {
      const response = await fetch("/api/webhooks/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parkId, config }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          onConfigUpdated();
          alert("Webhook configuration updated successfully");
        }
      }
    } catch (error) {
      console.error("Error saving webhook config:", error);
      alert("Failed to save webhook configuration");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<WebhookConfig>) => {
    if (config) {
      setConfig({ ...config, ...updates });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">
            Loading webhook configuration...
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">
            No webhook configuration found
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Webhook configuration will be created automatically when needed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Webhook Configuration
        </h3>

        <div className="space-y-4">
          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={config.webhookUrl}
              onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://your-passenger-app.com/api/webhooks"
            />
            <p className="text-xs text-gray-500 mt-1">
              The URL where webhook events will be sent
            </p>
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret Key
            </label>
            <input
              type="password"
              value={config.secretKey}
              onChange={(e) => updateConfig({ secretKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter secret key for HMAC verification"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for HMAC signature verification of webhook payloads
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={config.isActive}
              onChange={(e) => updateConfig({ isActive: e.target.checked })}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isActive"
              className="ml-2 block text-sm text-gray-900"
            >
              Enable webhook notifications
            </label>
          </div>

          {/* Events */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Events
            </label>
            <div className="space-y-2">
              {[
                { value: "booking-created", label: "Booking Created" },
                { value: "booking-confirmed", label: "Booking Confirmed" },
                { value: "booking-cancelled", label: "Booking Cancelled" },
                { value: "payment-received", label: "Payment Received" },
              ].map((event) => (
                <label key={event.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.events.includes(event.value)}
                    onChange={(e) => {
                      const events = e.target.checked
                        ? [...config.events, event.value]
                        : config.events.filter((ev) => ev !== event.value);
                      updateConfig({ events });
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">
                    {event.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Retry Policy */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Retries
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={config.retryPolicy.maxRetries}
                onChange={(e) =>
                  updateConfig({
                    retryPolicy: {
                      ...config.retryPolicy,
                      maxRetries: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retry Delay (ms)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={config.retryPolicy.retryDelay}
                onChange={(e) =>
                  updateConfig({
                    retryPolicy: {
                      ...config.retryPolicy,
                      retryDelay: parseInt(e.target.value) || 5000,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Configuration Information
        </h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Webhook URL: {config.webhookUrl}</p>
          <p>• Active: {config.isActive ? "Yes" : "No"}</p>
          <p>• Events: {config.events.join(", ")}</p>
          <p>• Max Retries: {config.retryPolicy.maxRetries}</p>
          <p>• Retry Delay: {config.retryPolicy.retryDelay}ms</p>
        </div>
      </div>
    </div>
  );
}
