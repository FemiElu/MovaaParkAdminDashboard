"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssignDriverModalProps {
  parkId: string;
  tripId: string;
  trigger?: React.ReactNode;
  onAssigned?: () => void;
}

export function AssignDriverModal({
  parkId,
  tripId,
  trigger,
  onAssigned,
}: AssignDriverModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<
    Array<{ id: string; name: string; phone: string }>
  >([]);
  const [search, setSearch] = useState("");
  const [driverId, setDriverId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/parks/${parkId}/drivers`)
      .then((r) => r.json())
      .then((d) => setDrivers(d.data ?? []))
      .catch(() => setDrivers([]));
  }, [open, parkId]);

  const filtered = useMemo(() => {
    return drivers.filter((d) =>
      `${d.name} ${d.phone}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [drivers, search]);

  const submit = async () => {
    if (!driverId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/trips/${tripId}/assign-driver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId }),
    });
    setLoading(false);
    if (res.status === 409) {
      setError("DRIVER_CONFLICT");
      return;
    }
    if (!res.ok) {
      setError("Failed to assign driver");
      return;
    }
    setOpen(false);
    onAssigned?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            Assign Driver
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg w-[92vw] sm:w-[480px]">
        <DialogHeader>
          <DialogTitle>Assign Driver</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone"
          />

          <Select value={driverId} onValueChange={setDriverId}>
            <SelectTrigger aria-label="Select driver">
              <SelectValue placeholder="Choose a driver" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {filtered.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span className="truncate">{d.name}</span>
                    <span className="text-xs text-gray-500">{d.phone}</span>
                  </div>
                </SelectItem>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No drivers found
                </div>
              )}
            </SelectContent>
          </Select>

          {error === "DRIVER_CONFLICT" && (
            <div className="text-sm text-red-600">
              This driver is already assigned to an overlapping trip.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!driverId || loading}>
              {loading ? "Assigning..." : "Assign Driver"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
