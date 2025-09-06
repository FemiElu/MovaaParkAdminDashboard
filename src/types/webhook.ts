// Webhook types and interfaces
export interface WebhookPayload {
  type:
    | "booking-created"
    | "booking-confirmed"
    | "booking-cancelled"
    | "payment-received";
  timestamp: string;
  version: string;
  parkId: string;
  signature: string;
  data: {
    bookingId: string;
    routeScheduleId: string;
    passenger: {
      name: string;
      phone: string;
      address: string;
      nextOfKin: {
        name: string;
        phone: string;
        address: string;
        relationship?: string;
      };
    };
    slotNumbers: number[];
    totalAmount: number;
    baseAmount: number;
    systemServiceCharge: 500;
    status: "RESERVED" | "CONFIRMED" | "EXPIRED" | "CANCELLED" | "COMPLETED";
    reservedAt?: number;
    expiresAt?: number;
    paymentReference?: string;
    confirmedAt?: number;
    cancelledAt?: number;
    completedAt?: number;
  };
}

export interface WebhookLog {
  id: string;
  type: string;
  parkId: string;
  status: "success" | "error" | "pending";
  timestamp: number;
  payload: WebhookPayload;
  response?: {
    status: number;
    body: unknown;
  };
  error?: string;
  retryCount: number;
  processedAt?: number;
}

export interface WebhookConfig {
  parkId: string;
  webhookUrl: string;
  secretKey: string;
  isActive: boolean;
  events: string[];
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };
}

export interface WebhookTestScenario {
  id: string;
  name: string;
  description: string;
  type: WebhookPayload["type"];
  payload: Partial<WebhookPayload>;
  expectedResponse?: unknown;
}

// API Integration types for sending data TO passenger app
export interface PassengerAppRouteUpdate {
  parkId: string;
  routeId: string;
  destination: string;
  basePrice: number;
  vehicleCapacity: number;
  isActive: boolean;
  updatedAt: string;
}

export interface PassengerAppPricingUpdate {
  parkId: string;
  routeId: string;
  basePrice: number;
  updatedAt: string;
}

export interface PassengerAppCapacityUpdate {
  parkId: string;
  routeId: string;
  vehicleCapacity: number;
  updatedAt: string;
}
