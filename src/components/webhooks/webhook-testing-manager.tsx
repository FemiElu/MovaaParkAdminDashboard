"use client";

import { useState, useEffect, useCallback } from "react";
import { WebhookLog } from "@/types/webhook";
import { WebhookTestPanel } from "./webhook-test-panel";
import { WebhookLogsPanel } from "./webhook-logs-panel";
import { WebhookStatsPanel } from "./webhook-stats-panel";
import { WebhookConfigPanel } from "./webhook-config-panel";

interface WebhookTestingManagerProps {
  parkId?: string;
}

export function WebhookTestingManager({ parkId }: WebhookTestingManagerProps) {
  const [activeTab, setActiveTab] = useState<
    "test" | "logs" | "stats" | "config"
  >("test");
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  interface WebhookStats {
    total: number;
    success: number;
    error: number;
    pending: number;
    successRate: number;
  }
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch webhook logs and stats
  const fetchWebhookData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (parkId) params.append("parkId", parkId);
      params.append("limit", "100");

      const response = await fetch(`/api/webhooks/logs?${params}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLogs(result.data.logs);
          setStats(result.data.stats);
        }
      }
    } catch (error) {
      console.error("Error fetching webhook data:", error);
    } finally {
      setLoading(false);
    }
  }, [parkId]);

  useEffect(() => {
    fetchWebhookData();
  }, [parkId, fetchWebhookData]);

  const tabs = [
    { id: "test", name: "Test Webhooks", icon: "🧪" },
    { id: "logs", name: "Webhook Logs", icon: "📋" },
    { id: "stats", name: "Statistics", icon: "📊" },
    { id: "config", name: "Configuration", icon: "⚙️" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as "test" | "logs" | "stats" | "config")
              }
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "test" && (
          <WebhookTestPanel parkId={parkId} onTestExecuted={fetchWebhookData} />
        )}

        {activeTab === "logs" && (
          <WebhookLogsPanel
            logs={logs}
            loading={loading}
            onRefresh={fetchWebhookData}
          />
        )}

        {activeTab === "stats" && (
          <WebhookStatsPanel
            stats={stats}
            loading={loading}
            onRefresh={fetchWebhookData}
          />
        )}

        {activeTab === "config" && (
          <WebhookConfigPanel
            parkId={parkId}
            onConfigUpdated={fetchWebhookData}
          />
        )}
      </div>
    </div>
  );
}
