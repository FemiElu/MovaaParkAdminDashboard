"use client";

import React, { useState } from "react";
import { Driver } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = { driver: Driver };

function ExpiryBanner({ expiry }: { expiry?: string }) {
  if (!expiry) return null;
  const msLeft = new Date(expiry).getTime() - Date.now();
  if (msLeft >= 0) return null;
  return (
    <div
      role="alert"
      aria-label="License expired"
      className="mb-3 rounded-md border border-red-200 bg-red-50 text-red-800 px-3 py-2"
    >
      License expired. Please renew and update the records.
    </div>
  );
}

export default function DriverDetail({ driver }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${driver.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/drivers/${driver.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete driver");
      }

      // Redirect to drivers list
      router.push("/drivers");
      router.refresh();
    } catch (error) {
      console.error("Error deleting driver:", error);
      alert(error instanceof Error ? error.message : "Failed to delete driver");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <ExpiryBanner expiry={driver.licenseExpiry} />
      <div className="flex items-center gap-3">
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {driver.name}
          </div>
          <div className="text-sm text-gray-600">{driver.phone}</div>
          <div className="text-sm text-gray-600">{driver.licenseNumber}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-md border p-3">
          <div className="text-sm text-gray-500">Vehicle plate</div>
          <div className="text-gray-900 font-medium">
            {driver.vehiclePlateNumber || "—"}
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-sm text-gray-500">Address</div>
          <div className="text-gray-900 font-medium">
            {driver.address || "—"}
          </div>
        </div>
      </div>
      {driver.documents && driver.documents.length > 0 && (
        <div className="rounded-md border p-3">
          <div className="text-sm text-gray-500 mb-2">Documents</div>
          <ul className="space-y-1">
            {driver.documents.map((doc, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">{doc.type}</span>
                <span className="text-gray-900 font-medium">
                  {doc.number || "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-center gap-2 pt-2">
        <a href={`tel:${driver.phone}`} aria-label="Call">
          <Button variant="outline" size="sm">
            Call
          </Button>
        </a>
        <a
          href={`https://wa.me/${(driver.phone.match(/\d/g) ?? []).join("")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
        >
          <Button size="sm">WhatsApp</Button>
        </a>
      </div>

      {/* Admin Actions */}
      <div className="flex items-center gap-2 pt-4 border-t">
        <Link href={`/drivers/${driver.id}/edit`}>
          <Button variant="outline" size="sm">
            Edit Driver
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 border-red-600 hover:bg-red-50"
        >
          {isDeleting ? "Deleting..." : "Delete Driver"}
        </Button>
      </div>
    </div>
  );
}
