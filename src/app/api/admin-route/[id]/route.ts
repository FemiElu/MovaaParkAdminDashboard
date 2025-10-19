import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { routeApiService } from "@/lib/route-api-service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;

    // Forward the request to the backend API
    const response = await routeApiService.deleteRoute(resolvedParams.id);

    if (response.success) {
      return NextResponse.json(response);
    } else {
      return NextResponse.json(
        { error: response.error || "Failed to delete route" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Error deleting route:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

