import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MessagingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Please log in to view this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <MobileHeader user={session.user} />
      <div className="lg:pl-64">
        <DashboardHeader user={session.user} />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Messaging Center
            </h1>
            <p className="text-gray-600">
              Communicate with drivers, passengers, and manage notifications
            </p>
          </div>

          {/* Coming Soon Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-8 lg:p-12 text-center">
              <div className="mx-auto h-24 w-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-purple-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Messaging Center Coming Soon
              </h2>

              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                We&apos;re developing a comprehensive messaging system to help
                you communicate effectively with drivers, passengers, and manage
                all your park communications in one centralized location.
              </p>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">
                  Communication Features
                </h3>
                <ul className="text-left text-purple-800 space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                    SMS and WhatsApp integration for passenger notifications
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                    Driver communication and dispatch messaging
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                    Automated trip reminders and updates
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                    Emergency alerts and safety notifications
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                    Broadcast messaging to all passengers
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                    Message templates and scheduling
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <p className="text-sm text-gray-500">
                  This feature is in active development. Stay tuned for updates!
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
