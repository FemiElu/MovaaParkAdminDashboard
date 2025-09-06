// Webhook endpoint for receiving data from passenger app
import { NextRequest, NextResponse } from "next/server";
import { webhookStore } from "@/lib/webhook-store";
import {
  verifyWebhookSignature,
  validateWebhookPayload,
} from "@/lib/webhook-utils";
import { WebhookPayload } from "@/types/webhook";
import { liveBookingsStore } from "@/lib/live-bookings";

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.text();
    const payload: WebhookPayload = JSON.parse(body);

    // Get webhook signature from headers
    const signature = request.headers.get("x-webhook-signature");
    const parkId = request.headers.get("x-park-id");
    const apiVersion = request.headers.get("x-api-version");

    // Validate required headers
    if (!signature || !parkId || !apiVersion) {
      return NextResponse.json(
        {
          error:
            "Missing required headers: x-webhook-signature, x-park-id, x-api-version",
        },
        { status: 400 }
      );
    }

    // Get webhook configuration
    const config = webhookStore.getConfig(parkId);
    if (!config) {
      return NextResponse.json(
        { error: "Webhook configuration not found for park" },
        { status: 404 }
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, config.secretKey)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Validate payload structure
    const validation = validateWebhookPayload(payload);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Invalid payload: ${validation.errors.join(", ")}` },
        { status: 400 }
      );
    }

    // Create webhook log entry
    const logId = `webhook_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const webhookLog = {
      id: logId,
      type: payload.type,
      parkId: payload.parkId,
      status: "pending" as const,
      timestamp: Date.now(),
      payload,
      retryCount: 0,
    };

    webhookStore.addLog(webhookLog);

    // Process webhook based on type
    let processingResult;
    try {
      processingResult = await processWebhookPayload(payload);
      webhookStore.updateLogStatus(logId, "success", {
        status: 200,
        body: processingResult,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      webhookStore.updateLogStatus(logId, "error", undefined, errorMessage);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      logId,
      result: processingResult,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Process webhook payload and update live bookings
async function processWebhookPayload(payload: WebhookPayload) {
  const { type, data } = payload;

  switch (type) {
    case "booking-created":
      return await handleBookingCreated(data);

    case "booking-confirmed":
      return await handleBookingConfirmed(data);

    case "booking-cancelled":
      return await handleBookingCancelled(data);

    case "payment-received":
      return await handlePaymentReceived(data);

    default:
      throw new Error(`Unknown webhook type: ${type}`);
  }
}

// Handle booking created webhook
async function handleBookingCreated(data: WebhookPayload["data"]) {
  // Convert webhook data to LiveBooking format
  const liveBooking = {
    id: data.bookingId,
    passenger: {
      name: data.passenger.name,
      phone: data.passenger.phone,
      address: data.passenger.address,
      nextOfKin: {
        name: data.passenger.nextOfKin.name,
        phone: data.passenger.nextOfKin.phone,
        address: data.passenger.nextOfKin.address,
        relationship: data.passenger.nextOfKin.relationship ?? "Unknown",
      },
    },
    destination: data.routeScheduleId.split("_")[1], // Extract destination from routeScheduleId
    slotNumbers: data.slotNumbers,
    totalAmount: data.totalAmount,
    baseAmount: data.baseAmount,
    systemServiceCharge: data.systemServiceCharge,
    status: data.status as
      | "RESERVED"
      | "CONFIRMED"
      | "EXPIRED"
      | "CANCELLED"
      | "COMPLETED",
    reservedAt: data.reservedAt || Date.now(),
    expiresAt: data.expiresAt,
    paymentReference: data.paymentReference,
    routeScheduleId: data.routeScheduleId,
    parkId: data.routeScheduleId.split("_")[0], // Extract parkId from routeScheduleId
    tripDate: data.routeScheduleId.split("_")[2], // Extract date from routeScheduleId
    tripTime: "06:00",
    departureDate: data.routeScheduleId.split("_")[2],
    departureTime: "06:00",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Add to live bookings store
  liveBookingsStore.addBooking(liveBooking);

  return {
    action: "booking_created",
    bookingId: data.bookingId,
    status: "added_to_live_bookings",
  };
}

// Handle booking confirmed webhook
async function handleBookingConfirmed(data: WebhookPayload["data"]) {
  const updatedBooking = liveBookingsStore.updateBookingStatus(
    data.bookingId,
    "CONFIRMED",
    {
      paymentReference: data.paymentReference,
      confirmedAt: data.confirmedAt,
    }
  );

  if (!updatedBooking) {
    throw new Error(`Booking not found: ${data.bookingId}`);
  }

  return {
    action: "booking_confirmed",
    bookingId: data.bookingId,
    status: "updated_in_live_bookings",
  };
}

// Handle booking cancelled webhook
async function handleBookingCancelled(data: WebhookPayload["data"]) {
  const updatedBooking = liveBookingsStore.updateBookingStatus(
    data.bookingId,
    "CANCELLED",
    {}
  );

  if (!updatedBooking) {
    throw new Error(`Booking not found: ${data.bookingId}`);
  }

  return {
    action: "booking_cancelled",
    bookingId: data.bookingId,
    status: "updated_in_live_bookings",
  };
}

// Handle payment received webhook
async function handlePaymentReceived(data: WebhookPayload["data"]) {
  // This is similar to booking confirmed, but specifically for payment events
  const updatedBooking = liveBookingsStore.updateBookingStatus(
    data.bookingId,
    "CONFIRMED",
    {
      paymentReference: data.paymentReference,
      confirmedAt: data.confirmedAt,
    }
  );

  if (!updatedBooking) {
    throw new Error(`Booking not found: ${data.bookingId}`);
  }

  return {
    action: "payment_received",
    bookingId: data.bookingId,
    status: "updated_in_live_bookings",
  };
}

// GET endpoint for webhook health check
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    message: "Webhook endpoint is operational",
    timestamp: new Date().toISOString(),
  });
}
