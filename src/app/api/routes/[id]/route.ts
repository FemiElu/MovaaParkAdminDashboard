import { NextRequest, NextResponse } from "next/server";
import { updateRoute } from "@/lib/routes-store";
import { z } from "zod";

const UpdateRouteSchema = z.object({
  destination: z.string().min(1).optional(),
  destinationPark: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const parsed = UpdateRouteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const { destination, destinationPark, isActive } = parsed.data;
    const resolvedParams = await params;
    const routeId = resolvedParams.id;
    // Update in-memory store
    const updated = updateRoute(routeId, {
      destination,
      destinationPark,
      isActive,
    });
    if (!updated) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE() {
  // For demo purposes, return success message
  return NextResponse.json({
    success: true,
    message:
      "Route delete functionality will be implemented when database is connected",
  });
}
