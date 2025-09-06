"use client";

import { ArrowPathIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

interface WebhookStatsPanelProps {
  stats: {
    total: number;
    success: number;
    error: number;
    pending: number;
    successRate: number;
  } | null;
  loading: boolean;
  onRefresh: () => void;
}

export function WebhookStatsPanel({ stats, loading, onRefresh }: WebhookStatsPanelProps) {
  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">No webhook statistics available</h3>
          <p className="text-sm text-gray-500 mt-1">
            Statistics will appear here after webhook tests are executed
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: "Total Webhooks",
      value: stats.total,
      icon: ArrowPathIcon,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      name: "Successful",
      value: stats.success,
      icon: CheckCircleIcon,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      name: "Failed",
      value: stats.error,
      icon: XCircleIcon,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      name: "Pending",
      value: stats.pending,
      icon: ClockIcon,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Webhook Statistics</h3>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Success Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Success Rate</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Overall Success Rate</span>
            <span className="text-sm font-medium text-gray-900">{stats.successRate.toFixed(1)}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.successRate}%` }}
            />
          </div>
          
          <div className="text-xs text-gray-500">
            {stats.success} successful out of {stats.total} total webhooks
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h4>
        
        <div className="space-y-3">
          {stats.successRate >= 95 && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircleIcon className="h-4 w-4" />
              <span className="text-sm">Excellent webhook performance</span>
            </div>
          )}
          
          {stats.successRate >= 80 && stats.successRate < 95 && (
            <div className="flex items-center space-x-2 text-yellow-600">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm">Good webhook performance with room for improvement</span>
            </div>
          )}
          
          {stats.successRate < 80 && (
            <div className="flex items-center space-x-2 text-red-600">
              <XCircleIcon className="h-4 w-4" />
              <span className="text-sm">Webhook performance needs attention</span>
            </div>
          )}
          
          {stats.error > 0 && (
            <div className="flex items-center space-x-2 text-red-600">
              <XCircleIcon className="h-4 w-4" />
              <span className="text-sm">{stats.error} webhook(s) failed - check logs for details</span>
            </div>
          )}
          
          {stats.pending > 0 && (
            <div className="flex items-center space-x-2 text-yellow-600">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm">{stats.pending} webhook(s) still pending</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
