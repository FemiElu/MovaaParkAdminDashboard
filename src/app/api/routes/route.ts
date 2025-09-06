import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// import { prisma } from "@/lib/db"; // Temporarily disabled for demo
import { z } from "zod";

const routeSchema = z.object({
  destination: z.string().min(1),
  basePrice: z.number().min(1000),
  vehicleCapacity: z.number().min(10).max(50),
  isActive: z.boolean(),
  parkId: z.string().optional(),
});

// Demo data for development
type DemoRoute = {
  id: string;
  parkId: string;
  destination: string;
  basePrice: number;
  vehicleCapacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
const demoRoutes: Record<string, DemoRoute[]> = {
  "lekki-phase-1-motor-park": [
    {
      id: "route1",
      parkId: "lekki-phase-1-motor-park",
      destination: "Ibadan",
      basePrice: 4000,
      vehicleCapacity: 18,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "route2",
      parkId: "lekki-phase-1-motor-park",
      destination: "Abuja",
      basePrice: 6000,
      vehicleCapacity: 18,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "route3",
      parkId: "lekki-phase-1-motor-park",
      destination: "Port Harcourt",
      basePrice: 5500,
      vehicleCapacity: 18,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
  "ikeja-motor-park": [
    {
      id: "route4",
      parkId: "ikeja-motor-park",
      destination: "Ibadan",
      basePrice: 3800,
      vehicleCapacity: 18,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "route5",
      parkId: "ikeja-motor-park",
      destination: "Kano",
      basePrice: 7000,
      vehicleCapacity: 18,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parkId = searchParams.get("parkId") || session.user.parkId;

    if (!parkId) {
      return NextResponse.json({ error: "Park ID required" }, { status: 400 });
    }

    // Verify user has access to this park
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Return demo data for the specific park
    const routes = demoRoutes[parkId] || [];

    return NextResponse.json({ success: true, data: routes });
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = routeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const parkId = data.parkId || session.user.parkId;

    if (!parkId) {
      return NextResponse.json({ error: "Park ID required" }, { status: 400 });
    }

    // Verify user has access to this park
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if route already exists for this park
    const existingRoutes = demoRoutes[parkId] || [];
    const existingRoute = existingRoutes.find(
      (r) => r.destination === data.destination
    );

    if (existingRoute) {
      return NextResponse.json(
        {
          error: "Route to this destination already exists",
        },
        { status: 409 }
      );
    }

    // Create new route in demo data
    const newRoute = {
      id: `route_${Date.now()}`,
      parkId,
      destination: data.destination,
      basePrice: data.basePrice,
      vehicleCapacity: data.vehicleCapacity,
      isActive: data.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to demo data
    if (!demoRoutes[parkId]) {
      demoRoutes[parkId] = [];
    }
    demoRoutes[parkId].push(newRoute);

    // TODO: Notify passenger app about new route
    // await notifyPassengerApp('route-created', route)

    return NextResponse.json(
      { success: true, data: newRoute },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
