"use client";

import React from "react";
import { Button } from "@/components/ui/button";

type PassengerRow = {
  seatNumber: number;
  passengerName: string;
  passengerPhone: string;
  nokName: string;
  nokPhone: string;
  nokAddress?: string;
  amountPaid: number;
  paymentStatus: string;
  bookingStatus: string;
  createdAt: string;
};

type ParcelRow = {
  id: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhoneMasked?: string;
  receiverPhone?: string;
  fee: number;
  status: string;
};

interface ExportButtonsProps {
  tripId: string;
  passengers?: PassengerRow[];
  parcels?: ParcelRow[];
  finance?: {
    passengerRevenue: number;
    parcelRevenue: number;
    driverPassengerSplit: number;
    parkPassengerSplit: number;
    driverParcelSplit: number;
    parkParcelSplit: number;
    driverTotal: number;
    parkTotal: number;
  };
  variant?: "passengers" | "parcels" | "finance";
  size?: "sm" | "default"; // kept for API compatibility, not used internally
}

function downloadCsv(filename: string, rows: string[][]) {
  const csvContent = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({
  tripId,
  passengers,
  parcels,
  finance,
  variant = "passengers",
}: ExportButtonsProps) {
  const exportPassengers = () => {
    if (!passengers) return;
    const header = [
      "seatNumber",
      "passengerName",
      "passengerPhone",
      "nokName",
      "nokPhone",
      "nokAddress",
      "amountPaid",
      "paymentStatus",
      "bookingStatus",
      "createdAt",
    ];
    const rows = passengers.map((p) => [
      String(p.seatNumber),
      p.passengerName,
      p.passengerPhone,
      p.nokName,
      p.nokPhone,
      p.nokAddress ?? "",
      String(p.amountPaid),
      p.paymentStatus,
      p.bookingStatus,
      new Date(p.createdAt).toISOString(),
    ]);
    downloadCsv(`passenger-manifest-${tripId}.csv`, [header, ...rows]);
  };

  const exportParcels = () => {
    if (!parcels) return;
    const header = [
      "id",
      "senderName",
      "senderPhone",
      "receiverName",
      "receiverPhone",
      "fee",
      "status",
    ];
    const rows = parcels.map((p) => [
      p.id,
      p.senderName,
      p.senderPhone,
      p.receiverName,
      p.receiverPhone || p.receiverPhoneMasked || "",
      String(p.fee),
      p.status,
    ]);
    downloadCsv(`parcel-manifest-${tripId}.csv`, [header, ...rows]);
  };

  const exportFinance = () => {
    if (!finance) return;
    const rows: string[][] = [
      ["Item", "Total", "Driver", "Park"],
      [
        "Passenger Revenue",
        String(finance.passengerRevenue),
        String(finance.driverPassengerSplit),
        String(finance.parkPassengerSplit),
      ],
      [
        "Parcel Revenue",
        String(finance.parcelRevenue),
        String(finance.driverParcelSplit),
        String(finance.parkParcelSplit),
      ],
      [
        "TOTAL",
        String(finance.passengerRevenue + finance.parcelRevenue),
        String(finance.driverTotal),
        String(finance.parkTotal),
      ],
    ];
    downloadCsv(`finance-reconciliation-${tripId}.csv`, rows);
  };

  if (variant === "passengers") {
    return <Button onClick={exportPassengers}>Export CSV</Button>;
  }
  if (variant === "parcels") {
    return <Button onClick={exportParcels}>Export CSV</Button>;
  }
  return <Button onClick={exportFinance}>Export CSV</Button>;
}
