import { TripDetailsPageClient } from "@/components/trips/trip-details-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return <TripDetailsPageClient tripId={resolvedParams.id} />;
}
