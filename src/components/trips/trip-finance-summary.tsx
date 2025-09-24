"use client";

import { useState } from "react";
import { Trip, Booking, Parcel } from "@/lib/trips-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge"; // Unused import
import { ExportButtons } from "./export-buttons";
import { PlusIcon } from "@heroicons/react/24/outline";

interface TripFinanceSummaryProps {
  trip: Trip;
  bookings: Booking[];
  parcels: Parcel[];
}

export function TripFinanceSummary({
  trip,
  bookings,
  parcels,
}: TripFinanceSummaryProps) {
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Calculate finance data
  const passengerRevenue = bookings
    .filter((b) => b.bookingStatus === "confirmed")
    .reduce((sum, b) => sum + b.amountPaid, 0);

  const parcelRevenue = parcels
    .filter(
      (p) =>
        p.status === "assigned" ||
        p.status === "in-transit" ||
        p.status === "delivered"
    )
    .reduce((sum, p) => sum + p.fee, 0);

  const totalRevenue = passengerRevenue + parcelRevenue;

  // Split calculations
  const driverPassengerSplit = passengerRevenue * 0.8;
  const parkPassengerSplit = passengerRevenue * 0.2;
  const driverParcelSplit = parcelRevenue * 0.5;
  const parkParcelSplit = parcelRevenue * 0.5;

  // Mock adjustments (in real app, these would come from the store)
  const adjustments = [
    {
      id: "adj_1",
      amount: -500,
      reason: "Fuel surcharge",
      createdBy: "admin",
      createdAt: new Date().toISOString(),
    },
  ];

  const adjustmentTotal = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  const driverTotal =
    driverPassengerSplit + driverParcelSplit + adjustmentTotal;
  const parkTotal = parkPassengerSplit + parkParcelSplit - adjustmentTotal;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const getPayoutStatusBadge = (status: Trip["payoutStatus"]) => {
    const colors = {
      NotScheduled: "bg-gray-100 text-gray-800",
      Scheduled: "bg-yellow-100 text-yellow-800",
      Paid: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status.replace(/([A-Z])/g, " $1").trim()}
      </span>
    );
  };

  const handleAddAdjustment = () => {
    // In real app, this would call the store method
    console.log("Adding adjustment:", {
      amount: adjustmentAmount,
      reason: adjustmentReason,
    });
    setIsAdjustmentDialogOpen(false);
    setAdjustmentAmount("");
    setAdjustmentReason("");
  };

  // const exportCSV = () => { // Unused function
  //   // Mock CSV export
  //   const csvData = [
  //     ["Item", "Amount", "Driver Share", "Park Share"],
  //     [
  //       "Passenger Revenue",
  //       formatCurrency(passengerRevenue),
  //       formatCurrency(driverPassengerSplit),
  //       formatCurrency(parkPassengerSplit),
  //     ],
  //     [
  //       "Parcel Revenue",
  //       formatCurrency(parcelRevenue),
  //       formatCurrency(driverParcelSplit),
  //       formatCurrency(parkParcelSplit),
  //     ],
  //     [
  //       "Adjustments",
  //       formatCurrency(adjustmentTotal),
  //       formatCurrency(adjustmentTotal),
  //       formatCurrency(-adjustmentTotal),
  //     ],
  //     [
  //       "TOTAL",
  //       formatCurrency(totalRevenue),
  //       formatCurrency(driverTotal),
  //       formatCurrency(parkTotal),
  //     ],
  //   ];

  //   const csvContent = csvData.map((row) => row.join(",")).join("\n");
  //   const blob = new Blob([csvContent], { type: "text/csv" });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `trip-finance-${trip.id}.csv`;
  //   a.click();
  // };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Trip Finance Summary</h3>
          <p className="text-sm text-gray-600">
            Revenue split: Driver 80% / Park 20% (passengers), Driver 50% / Park
            50% (parcels)
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={isAdjustmentDialogOpen}
            onOpenChange={setIsAdjustmentDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Manual Adjustment</DialogTitle>
                <DialogDescription>
                  Add a manual adjustment to the trip revenue (positive or
                  negative amount).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (NGN)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Enter reason for adjustment"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAdjustmentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddAdjustment}>Add Adjustment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ExportButtons
            size="sm"
            variant="finance"
            tripId={trip.id}
            finance={{
              passengerRevenue,
              parcelRevenue,
              driverPassengerSplit,
              parkPassengerSplit,
              driverParcelSplit,
              parkParcelSplit,
              driverTotal,
              parkTotal,
            }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="text-sm font-medium text-green-800">Driver Total</h4>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(driverTotal)}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800">Park Total</h4>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(parkTotal)}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-800">Total Revenue</h4>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Payout Status */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Payout Status</h4>
            <p className="text-sm text-gray-600">
              Current payment status for this trip
            </p>
          </div>
          {getPayoutStatusBadge(trip.payoutStatus)}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-4">
        <h4 className="font-semibold">Revenue Breakdown</h4>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Driver Share</TableHead>
                <TableHead className="text-right">Park Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Passenger Revenue</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(passengerRevenue)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(driverPassengerSplit)} (80%)
                </TableCell>
                <TableCell className="text-right text-blue-600">
                  {formatCurrency(parkPassengerSplit)} (20%)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Parcel Revenue</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(parcelRevenue)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(driverParcelSplit)} (50%)
                </TableCell>
                <TableCell className="text-right text-blue-600">
                  {formatCurrency(parkParcelSplit)} (50%)
                </TableCell>
              </TableRow>
              {adjustments.map((adjustment) => (
                <TableRow key={adjustment.id}>
                  <TableCell className="font-medium">
                    {adjustment.reason}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(adjustment.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(adjustment.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(-adjustment.amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-semibold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totalRevenue)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(driverTotal)}
                </TableCell>
                <TableCell className="text-right text-blue-600">
                  {formatCurrency(parkTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Recent Adjustments */}
      {adjustments.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold">Recent Adjustments</h4>
          <div className="space-y-2">
            {adjustments.map((adjustment) => (
              <div
                key={adjustment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{adjustment.reason}</p>
                  <p className="text-sm text-gray-600">
                    Added by {adjustment.createdBy} on{" "}
                    {new Date(adjustment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      adjustment.amount >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {adjustment.amount >= 0 ? "+" : ""}
                    {formatCurrency(adjustment.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
