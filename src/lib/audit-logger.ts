// Audit logging system for tracking check-in actions and other operations

export interface AuditLog {
  id: string;
  action: string;
  entityType: "booking" | "trip" | "driver" | "route" | "vehicle";
  entityId: string;
  userId: string;
  parkId: string;
  details: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogInput {
  action: string;
  entityType: "booking" | "trip" | "driver" | "route" | "vehicle";
  entityId: string;
  userId: string;
  parkId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private static logs: AuditLog[] = [];

  /**
   * Create a new audit log entry
   */
  static async log(input: AuditLogInput): Promise<AuditLog> {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId,
      parkId: input.parkId,
      details: input.details,
      timestamp: new Date().toISOString(),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    };

    // Store in memory (in a real app, this would be stored in a database)
    this.logs.push(log);

    // In a real application, you would also send this to your backend
    try {
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(log),
      });
    } catch (error) {
      console.error("Failed to send audit log to server:", error);
      // Don't throw - we still want the operation to succeed even if logging fails
    }

    return log;
  }

  /**
   * Get audit logs for a specific entity
   */
  static getLogsForEntity(entityType: string, entityId: string): AuditLog[] {
    return this.logs.filter(
      (log) => log.entityType === entityType && log.entityId === entityId
    );
  }

  /**
   * Get audit logs for a specific park
   */
  static getLogsForPark(parkId: string, limit?: number): AuditLog[] {
    const logs = this.logs
      .filter((log) => log.parkId === parkId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Get audit logs for a specific user
   */
  static getLogsForUser(userId: string, limit?: number): AuditLog[] {
    const logs = this.logs
      .filter((log) => log.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Get all audit logs (for admin purposes)
   */
  static getAllLogs(limit?: number): AuditLog[] {
    const logs = this.logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Clear all logs (for testing purposes)
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get logs count
   */
  static getLogsCount(): number {
    return this.logs.length;
  }
}

// Convenience functions for common audit actions
export const auditActions = {
  // Booking actions
  BOOKING_CHECKED_IN: "booking_checked_in",
  BOOKING_CHECKED_OUT: "booking_checked_out",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_CREATED: "booking_created",
  BOOKING_UPDATED: "booking_updated",

  // Trip actions
  TRIP_CREATED: "trip_created",
  TRIP_UPDATED: "trip_updated",
  TRIP_PUBLISHED: "trip_published",
  TRIP_CANCELLED: "trip_cancelled",
  TRIP_COMPLETED: "trip_completed",

  // Driver actions
  DRIVER_ASSIGNED: "driver_assigned",
  DRIVER_UNASSIGNED: "driver_unassigned",
  DRIVER_CREATED: "driver_created",
  DRIVER_UPDATED: "driver_updated",
  DRIVER_DEACTIVATED: "driver_deactivated",

  // Route actions
  ROUTE_CREATED: "route_created",
  ROUTE_UPDATED: "route_updated",
  ROUTE_DELETED: "route_deleted",

  // Vehicle actions
  VEHICLE_ASSIGNED: "vehicle_assigned",
  VEHICLE_UNASSIGNED: "vehicle_unassigned",
  VEHICLE_CREATED: "vehicle_created",
  VEHICLE_UPDATED: "vehicle_updated",

  // System actions
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",
  SYSTEM_ERROR: "system_error",
  DATA_EXPORT: "data_export",
  DATA_IMPORT: "data_import",
};

// Helper function to get user info from browser context
export function getUserContext(): { ipAddress?: string; userAgent?: string } {
  if (typeof window === "undefined") {
    return {};
  }

  return {
    userAgent: navigator.userAgent,
    // Note: IP address would typically be obtained from the server-side request
    // For client-side logging, we can't reliably get the IP address
  };
}
