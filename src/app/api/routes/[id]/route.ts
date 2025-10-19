import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { routesApiService } from "@/lib/routes-api-service";
import { z } from "zod";

const UpdateRouteSchema = z.object({
  destination: z.string().min(1).optional(),
  destinationPark: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateRouteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // const resolvedParams = await params;
    // const routeId = resolvedParams.id; // Unused but kept for future implementation

    // Note: The backend API doesn't have an update endpoint based on your specification
    // For now, we'll return an error indicating this functionality isn't available
    return NextResponse.json(
      {
        error: "Route update functionality not available in backend API",
        message: "Please delete and recreate the route instead",
      },
      { status: 501 }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const routeId = resolvedParams.id;

    // Delete route via backend API
    const response = await routesApiService.deleteRoute(routeId);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to delete route" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
