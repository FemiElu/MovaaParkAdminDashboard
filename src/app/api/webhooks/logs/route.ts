// Webhook logs API endpoint
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { webhookStore } from "@/lib/webhook-store";
import { WebhookPayload } from "@/types/webhook";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const parkId = searchParams.get("parkId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;

    // Verify user has access to this park
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get webhook logs
    const logs = webhookStore.getLogs({
      parkId: parkId || undefined,
      type: type || undefined,
      status: status || undefined,
      limit,
    });

    // Get statistics
    const stats = webhookStore.getStats(parkId || undefined);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        stats,
        total: logs.length,
      },
    });
  } catch (error) {
    console.error("Error fetching webhook logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint for testing webhooks
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, scenarioId, customPayload } = body;

    if (action === "test_scenario") {
      // Test a predefined scenario
      const scenario = webhookStore.getScenario(scenarioId);
      if (!scenario) {
        return NextResponse.json(
          { error: "Test scenario not found" },
          { status: 404 }
        );
      }

      // Ensure payload has required fields for simulation
      if (!scenario.payload.type || !scenario.payload.parkId) {
        return NextResponse.json(
          { error: "Invalid scenario payload: missing required fields" },
          { status: 400 }
        );
      }

      // Simulate webhook call
      const result = await simulateWebhookCall(
        scenario.payload as WebhookPayload
      );

      return NextResponse.json({
        success: true,
        message: "Test scenario executed",
        result,
      });
    }

    if (action === "test_custom") {
      // Test custom payload
      if (!customPayload) {
        return NextResponse.json(
          { error: "Custom payload required" },
          { status: 400 }
        );
      }

      const result = await simulateWebhookCall(customPayload);

      return NextResponse.json({
        success: true,
        message: "Custom webhook test executed",
        result,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error testing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Simulate webhook call for testing
async function simulateWebhookCall(payload: WebhookPayload) {
  // In a real implementation, this would make an HTTP request to the webhook endpoint
  // For demo purposes, we'll just process it directly

  const logId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const webhookLog = {
    id: logId,
    type: payload.type,
    parkId: payload.parkId,
    status: "success" as const,
    timestamp: Date.now(),
    payload,
    response: {
      status: 200,
      body: { success: true, message: "Test webhook processed" },
    },
    retryCount: 0,
    processedAt: Date.now(),
  };

  webhookStore.addLog(webhookLog);

  return {
    logId,
    status: "success",
    message: "Webhook test completed",
  };
}
