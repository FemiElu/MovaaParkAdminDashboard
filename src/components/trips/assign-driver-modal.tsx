"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  isOpen: boolean;
  onClose: () => void;
  trip: {
    id: string;
    parkId: string;
    routeId: string;
    date: string;
    unitTime: string;
  };
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    rating: number;
    parkId: string;
  }>;
  onAssign: (driverId: string) => Promise<void>;
}

export function AssignDriverModal({
  isOpen,
  onClose,
  trip,
  drivers,
  onAssign,
}: AssignDriverModalProps) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [driverId, setDriverId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return drivers.filter((d) =>
      `${d.name} ${d.phone}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [drivers, search]);

  const submit = async () => {
    if (!driverId) return;
    setLoading(true);
    setError(null);
    try {
      await onAssign(driverId);
    } catch (err) {
      setError("Failed to assign driver");
      console.error("Driver assignment error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[92vw] sm:w-[480px]">
        <DialogHeader>
          <DialogTitle>Assign Driver to {trip.routeId}</DialogTitle>
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
            <Button variant="outline" onClick={onClose}>
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
