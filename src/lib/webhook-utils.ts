// Webhook utility functions
import crypto from "crypto";
import { WebhookPayload } from "@/types/webhook";

// HMAC signature verification
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");

    const providedSignature = signature.replace("sha256=", "");
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(providedSignature, "hex")
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

// Generate HMAC signature
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  return `sha256=${signature}`;
}

// Validate webhook payload structure
export function validateWebhookPayload(payload: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const obj = payload as Record<string, unknown>;

  // Required fields
  const requiredFields = [
    "type",
    "timestamp",
    "version",
    "parkId",
    "signature",
    "data",
  ] as const;
  requiredFields.forEach((field) => {
    if (!(field in obj)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate type
  const validTypes = [
    "booking-created",
    "booking-confirmed",
    "booking-cancelled",
    "payment-received",
  ] as const;
  if (
    typeof obj.type === "string" &&
    !validTypes.includes(obj.type as unknown as (typeof validTypes)[number])
  ) {
    errors.push(`Invalid webhook type: ${String(obj.type)}`);
  }

  // Validate data structure
  if (obj.data && typeof obj.data === "object") {
    const data = obj.data as Record<string, unknown>;
    const requiredDataFields = [
      "bookingId",
      "routeScheduleId",
      "passenger",
      "slotNumbers",
      "totalAmount",
      "status",
    ] as const;
    requiredDataFields.forEach((field) => {
      if (!(field in data)) {
        errors.push(`Missing required data field: ${field}`);
      }
    });

    // Validate passenger structure
    if (data.passenger && typeof data.passenger === "object") {
      const passenger = data.passenger as Record<string, unknown>;
      const requiredPassengerFields = [
        "name",
        "phone",
        "address",
        "nextOfKin",
      ] as const;
      requiredPassengerFields.forEach((field) => {
        if (!(field in passenger)) {
          errors.push(`Missing required passenger field: ${field}`);
        }
      });

      // Validate nextOfKin structure
      if (passenger.nextOfKin && typeof passenger.nextOfKin === "object") {
        const nextOfKin = passenger.nextOfKin as Record<string, unknown>;
        const requiredNOKFields = ["name", "phone", "address"] as const;
        requiredNOKFields.forEach((field) => {
          if (!(field in nextOfKin)) {
            errors.push(`Missing required nextOfKin field: ${field}`);
          }
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Generate demo webhook payload
export function generateDemoWebhookPayload(
  type: WebhookPayload["type"],
  parkId: string,
  overrides: Partial<WebhookPayload["data"]> = {}
): WebhookPayload {
  const now = Date.now();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const departureDate = tomorrow.toISOString().split("T")[0];

  const basePayload: WebhookPayload = {
    type,
    timestamp: new Date().toISOString(),
    version: "v1",
    parkId,
    signature: "demo-signature",
    data: {
      bookingId: `b_demo_${now}`,
      routeScheduleId: `${parkId}_Ibadan_${departureDate}_06:00`,
      passenger: {
        name: "Demo Passenger",
        phone: "+2348012345678",
        address: "Demo Address, Lagos",
        nextOfKin: {
          name: "Demo NOK",
          phone: "+2348012345679",
          address: "Demo NOK Address, Lagos",
          relationship: "Spouse",
        },
      },
      slotNumbers: [1],
      totalAmount: 4500,
      baseAmount: 4000,
      systemServiceCharge: 500,
      status:
        type === "booking-created"
          ? "RESERVED"
          : type === "booking-confirmed"
          ? "CONFIRMED"
          : type === "booking-cancelled"
          ? "CANCELLED"
          : "RESERVED",
      reservedAt: type === "booking-created" ? now : undefined,
      expiresAt: type === "booking-created" ? now + 15 * 60 * 1000 : undefined,
      paymentReference:
        type === "booking-confirmed" ? `pay_demo_${now}` : undefined,
      confirmedAt: type === "booking-confirmed" ? now : undefined,
      cancelledAt: type === "booking-cancelled" ? now : undefined,
    },
  };

  // Apply overrides
  return {
    ...basePayload,
    data: {
      ...basePayload.data,
      ...overrides,
    },
  };
}

// Format webhook payload for display
export function formatWebhookPayload(payload: WebhookPayload): string {
  return JSON.stringify(payload, null, 2);
}

// Parse webhook payload from string
export function parseWebhookPayload(payloadString: string): {
  success: boolean;
  payload?: WebhookPayload;
  error?: string;
} {
  try {
    const payload = JSON.parse(payloadString);
    const validation = validateWebhookPayload(payload);

    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid payload: ${validation.errors.join(", ")}`,
      };
    }

    return {
      success: true,
      payload: payload as WebhookPayload,
    };
  } catch (error) {
    return {
      success: false,
      error: `Invalid JSON: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isRateLimited(
  _parkId: string,
  _windowMs: number = 60000, // 1 minute
  _maxRequests: number = 100
): boolean {
  // In a real implementation, this would use Redis or similar
  // For demo purposes, we'll always return false (no rate limiting)
  return false;
}

// Retry logic helper
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number = 1000
): number {
  // Exponential backoff with jitter
  const delay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * delay;
  return Math.min(delay + jitter, 30000); // Max 30 seconds
}
