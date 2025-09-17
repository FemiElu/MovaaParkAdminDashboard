"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AssignParcelsModalProps {
  parkId: string;
  tripId: string;
  maxParcels: number;
  trigger?: React.ReactNode;
}

export function AssignParcelsModal({
  parkId,
  tripId,
  maxParcels,
  trigger,
}: AssignParcelsModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parcels, setParcels] = useState<
    Array<{ id: string; senderName: string; receiverName: string; fee: number }>
  >([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [showOverride, setShowOverride] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/parks/${parkId}/parcels`)
      .then((r) => r.json())
      .then((d) => setParcels(d.data ?? []))
      .catch(() => setParcels([]));
  }, [open, parkId]);

  const filtered = useMemo(() => {
    return parcels.filter((p) =>
      `${p.id} ${p.senderName} ${p.receiverName}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [parcels, search]);

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );

  const submit = async (override = false) => {
    setLoading(true);
    const res = await fetch(`/api/trips/${tripId}/assign-parcels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parcelIds: selectedIds, override }),
    });
    setLoading(false);

    if (res.status === 409) {
      if (!override) {
        setShowOverride(true);
        return;
      }
    }

    if (!res.ok) return;
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            Assign Parcels
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg w-[92vw] sm:w-[520px]">
        <DialogHeader>
          <DialogTitle>Assign Parcels</DialogTitle>
          <DialogDescription>
            Choose unassigned parcels to add to this trip
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parcels by ID, sender or receiver"
          />

          <div className="max-h-64 overflow-auto rounded border divide-y">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No parcels found
              </div>
            )}
            {filtered.map((p) => (
              <label key={p.id} className="flex items-center gap-3 px-3 py-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!selected[p.id]}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, [p.id]: e.target.checked }))
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {p.id} — {p.senderName} → {p.receiverName}
                  </p>
                  <p className="text-xs text-gray-500">
                    ₦{p.fee.toLocaleString()}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {showOverride && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
              <p className="font-medium mb-1">Parcel capacity exceeded</p>
              <p>
                Assigning these parcels will exceed the vehicle&apos;s parcel
                capacity ({maxParcels}). Proceed?
              </p>
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="outline"
                  onClick={() => setShowOverride(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => submit(true)}>
                  Override and assign (log reason)
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={selectedIds.length === 0 || loading}
              onClick={() => submit(false)}
            >
              {loading
                ? "Assigning..."
                : `Assign ${selectedIds.length} parcel(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
