"use client";

import { useState } from "react";
import { WebhookLog } from "@/types/webhook";
import { formatWebhookPayload } from "@/lib/webhook-utils";
import { ArrowPathIcon, EyeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface WebhookLogsPanelProps {
  logs: WebhookLog[];
  loading: boolean;
  onRefresh: () => void;
}

export function WebhookLogsPanel({ logs, loading, onRefresh }: WebhookLogsPanelProps) {
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [filter, setFilter] = useState<"all" | "success" | "error" | "pending">("all");

  const filteredLogs = logs.filter(log => {
    if (filter === "all") return true;
    return log.status === filter;
  });

  const getStatusColor = (status: WebhookLog["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "booking-created":
        return "📝";
      case "booking-confirmed":
        return "✅";
      case "booking-cancelled":
        return "❌";
      case "payment-received":
        return "💳";
      default:
        return "📋";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Webhook Logs</h3>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          {(["all", "success", "error", "pending"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === status
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg shadow">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900">No webhook logs found</h3>
            <p className="text-sm text-gray-500 mt-1">
              {filter === "all" 
                ? "Webhook logs will appear here when tests are executed"
                : `No ${filter} webhook logs found`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getTypeIcon(log.type)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {log.type.replace("-", " ").toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()} • {log.parkId}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {log.error && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                    )}
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      <EyeIcon className="h-3 w-3" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
                
                {log.error && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    {log.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedLog(null)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Webhook Log Details
                  </h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Log Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">ID:</span>
                      <p className="text-sm text-gray-900">{selectedLog.id}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Type:</span>
                      <p className="text-sm text-gray-900">{selectedLog.type}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedLog.status)}`}>
                        {selectedLog.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Park ID:</span>
                      <p className="text-sm text-gray-900">{selectedLog.parkId}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Timestamp:</span>
                      <p className="text-sm text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Retry Count:</span>
                      <p className="text-sm text-gray-900">{selectedLog.retryCount}</p>
                    </div>
                  </div>

                  {/* Payload */}
                  <div>
                    <span className="text-sm font-medium text-gray-600">Payload:</span>
                    <pre className="mt-1 text-xs bg-gray-50 p-3 rounded-md overflow-x-auto">
                      {formatWebhookPayload(selectedLog.payload)}
                    </pre>
                  </div>

                  {/* Response */}
                  {selectedLog.response && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Response:</span>
                      <pre className="mt-1 text-xs bg-gray-50 p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(selectedLog.response, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error */}
                  {selectedLog.error && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Error:</span>
                      <p className="mt-1 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {selectedLog.error}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
