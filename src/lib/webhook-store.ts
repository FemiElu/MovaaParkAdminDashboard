// In-memory webhook store for demo purposes
import {
  WebhookLog,
  WebhookConfig,
  WebhookTestScenario,
} from "@/types/webhook";

class WebhookStore {
  private logs: Map<string, WebhookLog> = new Map();
  private configs: Map<string, WebhookConfig> = new Map();
  private scenarios: WebhookTestScenario[] = [];

  constructor() {
    this.initializeDemoData();
  }

  // Initialize demo webhook configurations
  private initializeDemoData() {
    // Demo webhook configs for each park
    const demoConfigs: WebhookConfig[] = [
      {
        parkId: "lekki-phase-1-motor-park",
        webhookUrl: "http://localhost:3000/api/webhooks/passenger-app",
        secretKey: "demo-secret-key-lekki-123",
        isActive: true,
        events: [
          "booking-created",
          "booking-confirmed",
          "booking-cancelled",
          "payment-received",
        ],
        retryPolicy: {
          maxRetries: 3,
          retryDelay: 5000,
        },
      },
      {
        parkId: "ikeja-motor-park",
        webhookUrl: "http://localhost:3000/api/webhooks/passenger-app",
        secretKey: "demo-secret-key-ikeja-456",
        isActive: true,
        events: [
          "booking-created",
          "booking-confirmed",
          "booking-cancelled",
          "payment-received",
        ],
        retryPolicy: {
          maxRetries: 3,
          retryDelay: 5000,
        },
      },
    ];

    demoConfigs.forEach((config) => {
      this.configs.set(config.parkId, config);
    });

    // Demo test scenarios
    this.scenarios = [
      {
        id: "booking-created-1",
        name: "New Booking - Ibadan Route",
        description: "Simulate a new booking for Ibadan route with 2 slots",
        type: "booking-created",
        payload: {
          type: "booking-created",
          timestamp: new Date().toISOString(),
          version: "v1",
          parkId: "lekki-phase-1-motor-park",
          signature: "demo-signature",
          data: {
            bookingId: "b_demo_123",
            routeScheduleId: "lekki-phase-1-motor-park_Ibadan_2024-01-16_06:00",
            passenger: {
              name: "Adebayo Johnson",
              phone: "+2348012345678",
              address: "15 Victoria Island, Lagos",
              nextOfKin: {
                name: "Chioma Johnson",
                phone: "+2348012345679",
                address: "15 Victoria Island, Lagos",
                relationship: "Spouse",
              },
            },
            slotNumbers: [1, 2],
            totalAmount: 8500,
            baseAmount: 8000,
            systemServiceCharge: 500,
            status: "RESERVED",
            reservedAt: Date.now(),
            expiresAt: Date.now() + 15 * 60 * 1000,
          },
        },
      },
      {
        id: "booking-confirmed-1",
        name: "Payment Confirmed",
        description: "Simulate payment confirmation for a reserved booking",
        type: "booking-confirmed",
        payload: {
          type: "booking-confirmed",
          timestamp: new Date().toISOString(),
          version: "v1",
          parkId: "lekki-phase-1-motor-park",
          signature: "demo-signature",
          data: {
            bookingId: "b_demo_123",
            routeScheduleId: "lekki-phase-1-motor-park_Ibadan_2024-01-16_06:00",
            passenger: {
              name: "Adebayo Johnson",
              phone: "+2348012345678",
              address: "15 Victoria Island, Lagos",
              nextOfKin: {
                name: "Chioma Johnson",
                phone: "+2348012345679",
                address: "15 Victoria Island, Lagos",
                relationship: "Spouse",
              },
            },
            slotNumbers: [1, 2],
            totalAmount: 8500,
            baseAmount: 8000,
            systemServiceCharge: 500,
            status: "CONFIRMED",
            paymentReference: "pay_demo_123456",
            confirmedAt: Date.now(),
          },
        },
      },
      {
        id: "booking-cancelled-1",
        name: "Booking Cancelled",
        description: "Simulate a booking cancellation",
        type: "booking-cancelled",
        payload: {
          type: "booking-cancelled",
          timestamp: new Date().toISOString(),
          version: "v1",
          parkId: "lekki-phase-1-motor-park",
          signature: "demo-signature",
          data: {
            bookingId: "b_demo_123",
            routeScheduleId: "lekki-phase-1-motor-park_Ibadan_2024-01-16_06:00",
            passenger: {
              name: "Adebayo Johnson",
              phone: "+2348012345678",
              address: "15 Victoria Island, Lagos",
              nextOfKin: {
                name: "Chioma Johnson",
                phone: "+2348012345679",
                address: "15 Victoria Island, Lagos",
                relationship: "Spouse",
              },
            },
            slotNumbers: [1, 2],
            totalAmount: 8500,
            baseAmount: 8000,
            systemServiceCharge: 500,
            status: "CANCELLED",
            cancelledAt: Date.now(),
          },
        },
      },
    ];
  }

  // Webhook Log Management
  addLog(log: WebhookLog): void {
    this.logs.set(log.id, log);
  }

  getLogs(
    filters: {
      parkId?: string;
      type?: string;
      status?: string;
      limit?: number;
    } = {}
  ): WebhookLog[] {
    let logs = Array.from(this.logs.values());

    if (filters.parkId) {
      logs = logs.filter((log) => log.parkId === filters.parkId);
    }
    if (filters.type) {
      logs = logs.filter((log) => log.type === filters.type);
    }
    if (filters.status) {
      logs = logs.filter((log) => log.status === filters.status);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    if (filters.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  getLog(id: string): WebhookLog | undefined {
    return this.logs.get(id);
  }

  updateLogStatus(
    id: string,
    status: WebhookLog["status"],
    response?: { status: number; body: unknown },
    error?: string
  ): void {
    const log = this.logs.get(id);
    if (log) {
      log.status = status;
      log.response = response;
      log.error = error;
      log.processedAt = Date.now();
      this.logs.set(id, log);
    }
  }

  // Webhook Configuration Management
  getConfig(parkId: string): WebhookConfig | undefined {
    return this.configs.get(parkId);
  }

  updateConfig(parkId: string, config: Partial<WebhookConfig>): void {
    const existing = this.configs.get(parkId);
    if (existing) {
      this.configs.set(parkId, { ...existing, ...config });
    }
  }

  // Test Scenarios
  getScenarios(): WebhookTestScenario[] {
    return this.scenarios;
  }

  getScenario(id: string): WebhookTestScenario | undefined {
    return this.scenarios.find((s) => s.id === id);
  }

  // Statistics
  getStats(parkId?: string): {
    total: number;
    success: number;
    error: number;
    pending: number;
    successRate: number;
  } {
    const logs = this.getLogs({ parkId });
    const total = logs.length;
    const success = logs.filter((l) => l.status === "success").length;
    const error = logs.filter((l) => l.status === "error").length;
    const pending = logs.filter((l) => l.status === "pending").length;
    const successRate = total > 0 ? (success / total) * 100 : 0;

    return { total, success, error, pending, successRate };
  }

  // Clear old logs (keep last 1000)
  cleanup(): void {
    const logs = Array.from(this.logs.values());
    if (logs.length > 1000) {
      logs.sort((a, b) => b.timestamp - a.timestamp);
      const toKeep = logs.slice(0, 1000);
      this.logs.clear();
      toKeep.forEach((log) => this.logs.set(log.id, log));
    }
  }
}

// Global webhook store instance
export const webhookStore = new WebhookStore();
