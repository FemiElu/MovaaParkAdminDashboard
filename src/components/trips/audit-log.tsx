"use client";

import { useState } from "react";
import { Trip } from "@/lib/trips-store";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClockIcon, UserIcon } from "@heroicons/react/24/outline";

interface AuditLogProps {
  trip: Trip;
}

export function AuditLog({ trip }: AuditLogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  // Mock audit logs (in real app, these would come from the store)
  const auditLogs = [
    {
      id: "audit_1",
      entityType: "Trip",
      entityId: trip.id,
      action: "booking_created",
      payload: { passengerName: "John Doe", amountPaid: 4000 },
      performedBy: "admin",
      performedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
    {
      id: "audit_2",
      entityType: "Trip",
      entityId: trip.id,
      action: "driver_assigned",
      payload: { driverId: "driver_1" },
      performedBy: "admin",
      performedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: "audit_3",
      entityType: "Trip",
      entityId: trip.id,
      action: "parcels_assigned",
      payload: { parcelIds: ["parcel_1", "parcel_2"], override: false },
      performedBy: "admin",
      performedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    },
    {
      id: "audit_4",
      entityType: "Trip",
      entityId: trip.id,
      action: "readPII",
      payload: { passengerPhone: "+2348012345678" },
      performedBy: "admin",
      performedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    },
  ];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.payload)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      booking_created: "bg-green-100 text-green-800",
      driver_assigned: "bg-blue-100 text-blue-800",
      parcels_assigned: "bg-purple-100 text-purple-800",
      readPII: "bg-yellow-100 text-yellow-800",
      adjustment_added: "bg-orange-100 text-orange-800",
    };

    const defaultColor = "bg-gray-100 text-gray-800";
    const colorClass = colors[action] || defaultColor;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      >
        {action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return "Just now";
    }
  };

  const getPayloadSummary = (payload: Record<string, unknown>) => {
    const keys = Object.keys(payload);
    if (keys.length === 0) return "No details";

    const summary = keys
      .slice(0, 2)
      .map((key) => {
        const value = payload[key];
        if (typeof value === "string" && value.length > 20) {
          return `${key}: ${value.substring(0, 20)}...`;
        }
        return `${key}: ${value}`;
      })
      .join(", ");

    return keys.length > 2 ? `${summary}, ...` : summary;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Audit Log</h3>
        <p className="text-sm text-gray-600">
          Complete activity log for this trip with PII access tracking
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search audit log..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="booking_created">Booking Created</SelectItem>
            <SelectItem value="driver_assigned">Driver Assigned</SelectItem>
            <SelectItem value="parcels_assigned">Parcels Assigned</SelectItem>
            <SelectItem value="readPII">PII Access</SelectItem>
            <SelectItem value="adjustment_added">Adjustment Added</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No audit log entries found
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getActionBadge(log.action)}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <UserIcon className="h-4 w-4" />
                      <span>{log.performedBy}</span>
                      <ClockIcon className="h-4 w-4 ml-2" />
                      <span>{formatTimestamp(log.performedAt)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">
                      {log.action
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className="text-gray-600">
                      {getPayloadSummary(log.payload)}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{new Date(log.performedAt).toLocaleDateString()}</p>
                  <p>{new Date(log.performedAt).toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Show full payload for PII access */}
              {log.action === "readPII" && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-medium text-yellow-800 mb-1">
                    PII Access Logged
                  </p>
                  <p className="text-xs text-yellow-700">
                    Personal information accessed: {JSON.stringify(log.payload)}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
          <p className="text-sm text-gray-600">Total Actions</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {auditLogs.filter((log) => log.action === "readPII").length}
          </p>
          <p className="text-sm text-gray-600">PII Accesses</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {auditLogs.filter((log) => log.action === "booking_created").length}
          </p>
          <p className="text-sm text-gray-600">Bookings</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {auditLogs.filter((log) => log.action === "driver_assigned").length}
          </p>
          <p className="text-sm text-gray-600">Assignments</p>
        </div>
      </div>
    </div>
  );
}
