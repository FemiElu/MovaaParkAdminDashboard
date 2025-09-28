import { NextRequest, NextResponse } from "next/server";
import { AuditLog } from "@/lib/audit-logger";

// In-memory storage for demo purposes
// In a real application, this would be stored in a database
const auditLogs: AuditLog[] = [];

export async function POST(request: NextRequest) {
  try {
    const auditLog: AuditLog = await request.json();

    // Add server-side information
    const enhancedLog: AuditLog = {
      ...auditLog,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    };

    // Store the audit log
    auditLogs.push(enhancedLog);

    // In a real application, you would save this to a database
    console.log("Audit log created:", {
      id: enhancedLog.id,
      action: enhancedLog.action,
      entityType: enhancedLog.entityType,
      entityId: enhancedLog.entityId,
      userId: enhancedLog.userId,
      parkId: enhancedLog.parkId,
      timestamp: enhancedLog.timestamp,
    });

    return NextResponse.json({ success: true, data: enhancedLog });
  } catch (error) {
    console.error("Error creating audit log:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create audit log" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parkId = searchParams.get("parkId");
    const userId = searchParams.get("userId");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const limit = searchParams.get("limit");
    const action = searchParams.get("action");

    let filteredLogs = [...auditLogs];

    // Apply filters
    if (parkId) {
      filteredLogs = filteredLogs.filter((log) => log.parkId === parkId);
    }

    if (userId) {
      filteredLogs = filteredLogs.filter((log) => log.userId === userId);
    }

    if (entityType) {
      filteredLogs = filteredLogs.filter(
        (log) => log.entityType === entityType
      );
    }

    if (entityId) {
      filteredLogs = filteredLogs.filter((log) => log.entityId === entityId);
    }

    if (action) {
      filteredLogs = filteredLogs.filter((log) => log.action === action);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        filteredLogs = filteredLogs.slice(0, limitNum);
      }
    }

    return NextResponse.json({
      success: true,
      data: filteredLogs,
      count: filteredLogs.length,
      total: auditLogs.length,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
