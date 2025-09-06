// Webhook configuration API endpoint
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { webhookStore } from "@/lib/webhook-store";
import { WebhookConfig } from "@/types/webhook";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parkId = searchParams.get("parkId");

    if (!parkId) {
      return NextResponse.json(
        { error: "Park ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this park
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get webhook configuration
    const config = webhookStore.getConfig(parkId);

    return NextResponse.json({
      success: true,
      data: config,
    });

  } catch (error) {
    console.error("Error fetching webhook config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { parkId, config } = body;

    if (!parkId || !config) {
      return NextResponse.json(
        { error: "Park ID and configuration are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this park
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate configuration
    const validation = validateWebhookConfig(config);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Invalid configuration: ${validation.errors.join(", ")}` },
        { status: 400 }
      );
    }

    // Update webhook configuration
    webhookStore.updateConfig(parkId, config);

    return NextResponse.json({
      success: true,
      message: "Webhook configuration updated successfully",
    });

  } catch (error) {
    console.error("Error updating webhook config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Validate webhook configuration
function validateWebhookConfig(config: Partial<WebhookConfig>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.webhookUrl) {
    errors.push("Webhook URL is required");
  } else if (!isValidUrl(config.webhookUrl)) {
    errors.push("Invalid webhook URL format");
  }

  if (!config.secretKey) {
    errors.push("Secret key is required");
  } else if (config.secretKey.length < 8) {
    errors.push("Secret key must be at least 8 characters long");
  }

  if (!config.events || config.events.length === 0) {
    errors.push("At least one event type must be selected");
  }

  if (config.retryPolicy) {
    if (config.retryPolicy.maxRetries < 0 || config.retryPolicy.maxRetries > 10) {
      errors.push("Max retries must be between 0 and 10");
    }
    if (config.retryPolicy.retryDelay < 1000 || config.retryPolicy.retryDelay > 60000) {
      errors.push("Retry delay must be between 1000ms and 60000ms");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Simple URL validation
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
