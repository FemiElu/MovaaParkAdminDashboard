import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { DriverInputSchema } from "@/lib/driver";
import { getDriver, updateDriver, deleteDriver } from "@/lib/drivers-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const driver = getDriver(resolvedParams.id);
    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Check if user has access to this driver's park
    if (
      session.user.role !== "SUPER_ADMIN" &&
      session.user.parkId !== driver.parkId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: driver });
  } catch (err) {
    console.error("Error fetching driver:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = DriverInputSchema.extend({
      parkId: z.string().optional(),
    }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const parkId = data.parkId || session.user.parkId;
    if (!parkId)
      return NextResponse.json({ error: "Park ID required" }, { status: 400 });

    // Check if user has access to this park
    if (session.user.role !== "SUPER_ADMIN" && session.user.parkId !== parkId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const resolvedParams = await params;
    // Check if driver exists and user has access
    const existingDriver = getDriver(resolvedParams.id);
    if (!existingDriver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (
      session.user.role !== "SUPER_ADMIN" &&
      session.user.parkId !== existingDriver.parkId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update driver
    const updatedDriver = updateDriver(resolvedParams.id, {
      name: data.name,
      phone: data.phone,
      licenseNumber: data.licenseNumber,
      licenseExpiry: data.licenseExpiry.toISOString(),
      qualifiedRoute: data.qualifiedRoute,
      isActive: data.isActive,
      rating: data.rating,
      vehiclePlateNumber: data.vehiclePlateNumber,
      address: data.address,
      photo: data.photo,
    });

    return NextResponse.json({ success: true, data: updatedDriver });
  } catch (err) {
    console.error("Error updating driver:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    // Check if driver exists and user has access
    const driver = getDriver(resolvedParams.id);
    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (
      session.user.role !== "SUPER_ADMIN" &&
      session.user.parkId !== driver.parkId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete driver
    deleteDriver(resolvedParams.id);

    return NextResponse.json({
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting driver:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
