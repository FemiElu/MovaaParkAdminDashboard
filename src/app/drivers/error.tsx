"use client";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-md">
      Failed to load drivers. {error.message}
    </div>
  );
}





