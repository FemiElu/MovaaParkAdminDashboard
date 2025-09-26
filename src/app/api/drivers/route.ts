import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { DriverInputSchema } from "@/lib/driver";
import { listDrivers, createDriver } from "@/lib/drivers-store";

const QuerySchema = z.object({
  parkId: z.string().optional(),
  destination: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  minRating: z.coerce.number().optional(),
  license: z.enum(["valid", "expired", "unknown"]).optional(),
  availability: z.enum(["available", "unavailable"]).optional(),
  date: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = QuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const q = parsed.data;
    const parkId = q.parkId || session.user.parkId;
    if (!parkId)
      return NextResponse.json({ error: "Park ID required" }, { status: 400 });
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { page, limit, ...filters } = q;
    const result = listDrivers(
      parkId,
      filters as Record<string, unknown>,
      [] /* assignments wiring later */,
      page,
      limit
    );
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching drivers:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = DriverInputSchema.extend({
      parkId: z.string().optional(),
    }).safeParse(body);
    if (!parsed.success) {
      console.error("Driver validation failed:", parsed.error.issues);
      console.error("Request body:", body);
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const parkId = data.parkId || session.user.parkId;
    if (!parkId)
      return NextResponse.json({ error: "Park ID required" }, { status: 400 });
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create driver in the store
    try {
      const driver = createDriver({
        parkId,
        name: data.name,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseExpiry:
          data.licenseExpiry instanceof Date
            ? data.licenseExpiry.toISOString()
            : data.licenseExpiry,
        qualifiedRoute: data.qualifiedRoute,
        isActive: data.isActive,
        vehiclePlateNumber: data.vehiclePlateNumber,
        address: data.address,
      });

      return NextResponse.json(
        { success: true, data: driver },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        return NextResponse.json(
          {
            error:
              "Driver with this license number already exists in this park",
          },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (err) {
    console.error("Error creating driver:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
