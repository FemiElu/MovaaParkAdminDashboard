"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AuditLog } from "@/lib/audit-logger";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface AuditLogsViewerProps {
  parkId?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
}

export function AuditLogsViewer({
  parkId,
  userId,
  entityType,
  entityId,
  limit = 50,
}: AuditLogsViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: "",
    entityType: entityType || "",
    userId: userId || "",
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (parkId) params.append("parkId", parkId);
      if (userId) params.append("userId", userId);
      if (entityType) params.append("entityType", entityType);
      if (entityId) params.append("entityId", entityId);
      if (limit) params.append("limit", limit.toString());

      const response = await fetch(`/api/audit-logs?${params}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data);
      } else {
        setError(result.error || "Failed to fetch audit logs");
      }
    } catch (err) {
      setError("Failed to fetch audit logs");
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [parkId, userId, entityType, entityId, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchLogs();
  };

  const getActionColor = (action: string) => {
    if (
      action.includes("checked_in") ||
      action.includes("created") ||
      action.includes("published")
    ) {
      return "bg-green-100 text-green-800";
    }
    if (
      action.includes("failed") ||
      action.includes("cancelled") ||
      action.includes("deleted")
    ) {
      return "bg-red-100 text-red-800";
    }
    if (
      action.includes("updated") ||
      action.includes("assigned") ||
      action.includes("unassigned")
    ) {
      return "bg-blue-100 text-blue-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case "booking":
        return <DocumentTextIcon className="w-4 h-4" />;
      case "trip":
        return <ClockIcon className="w-4 h-4" />;
      case "driver":
        return <UserIcon className="w-4 h-4" />;
      case "route":
        return <BuildingOfficeIcon className="w-4 h-4" />;
      default:
        return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading audit logs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchLogs}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              placeholder="Filter by action..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={filters.entityType}
              onChange={(e) => handleFilterChange("entityType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="booking">Booking</option>
              <option value="trip">Trip</option>
              <option value="driver">Driver</option>
              <option value="route">Route</option>
              <option value="vehicle">Vehicle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              placeholder="Filter by user..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={applyFilters}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Audit Logs ({logs.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No audit logs found</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {getEntityTypeIcon(log.entityType)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {log.entityType} • {log.entityId}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        <p>
                          <strong>User:</strong> {log.userId}
                        </p>
                        <p>
                          <strong>Park:</strong> {log.parkId}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2">
                            <p>
                              <strong>Details:</strong>
                            </p>
                            <div className="bg-gray-50 rounded p-2 mt-1">
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {formatTimestamp(log.timestamp)}
                        </span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
