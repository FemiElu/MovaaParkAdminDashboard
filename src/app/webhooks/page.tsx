// Webhook testing and management page
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WebhookTestingManager } from "@/components/webhooks/webhook-testing-manager";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function WebhooksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <DashboardLayout user={session.user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Webhook Integration
          </h1>
          <p className="text-gray-600 mt-1">
            Test and monitor webhook communication with the passenger app
          </p>
        </div>

        <WebhookTestingManager parkId={session.user.parkId} />
      </div>
    </DashboardLayout>
  );
}
