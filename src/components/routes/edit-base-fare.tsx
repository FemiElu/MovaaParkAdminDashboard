"use client";
import React, { useState, useTransition } from "react";
import { RouteConfig } from "@/types";

export function EditBaseFare({ route }: { route: RouteConfig }) {
  const [baseFare, setBaseFare] = useState(route.basePrice);
  const [saving, startSaving] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    setSuccess(false);
    startSaving(async () => {
      try {
        const res = await fetch(`/api/routes/${route.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ basePrice: baseFare }),
        });
        if (!res.ok) throw new Error("Failed to update base fare");
        setSuccess(true);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <section className="bg-white border rounded-lg p-4 max-w-md mb-8">
      <div className="flex items-center gap-4">
        <label
          htmlFor="baseFare"
          className="block text-sm font-medium text-gray-700"
        >
          Base Fare (₦)
        </label>
        <input
          id="baseFare"
          type="number"
          min={0}
          value={baseFare}
          onChange={(e) => setBaseFare(Number(e.target.value))}
          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-right"
        />
        <button
          onClick={handleSave}
          disabled={saving || baseFare === route.basePrice}
          className="ml-2 px-4 py-2 rounded-md bg-[var(--primary)] text-white text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {success && (
        <div className="text-green-700 text-xs mt-2">Base fare updated!</div>
      )}
      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
    </section>
  );
}






