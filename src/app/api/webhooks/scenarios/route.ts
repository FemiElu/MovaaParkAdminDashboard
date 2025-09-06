// Webhook test scenarios API endpoint
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { webhookStore } from "@/lib/webhook-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get test scenarios
    const scenarios = webhookStore.getScenarios();

    return NextResponse.json({
      success: true,
      data: scenarios,
    });

  } catch (error) {
    console.error("Error fetching webhook scenarios:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
