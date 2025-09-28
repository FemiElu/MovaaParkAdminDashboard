"use client";

import { useState, useMemo } from "react";
import { Trip, Booking } from "@/lib/trips-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge"; // Unused import
import { ExportButtons } from "./export-buttons";
import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

interface PassengerManifestTableProps {
  trip: Trip;
  bookings: Booking[];
}

export function PassengerManifestTable({
  trip,
  bookings,
}: PassengerManifestTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.passengerName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        booking.passengerPhone.includes(searchTerm) ||
        booking.nokName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || booking.bookingStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const getStatusBadge = (status: Booking["bookingStatus"]) => {
    // const variants = { // Unused variable
    //   confirmed: "default",
    //   pending: "secondary",
    //   cancelled: "destructive",
    //   refunded: "outline",
    // } as const;

    const colors = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: Booking["paymentStatus"]) => {
    const colors = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      refunded: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Search passengers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            size="sm"
            variant="passengers"
            tripId={trip.id}
            passengers={bookings.map((b) => ({
              seatNumber: b.seatNumber,
              passengerName: b.passengerName,
              passengerPhone: b.passengerPhone,
              nokName: b.nokName,
              nokPhone: b.nokPhone,
              nokAddress: b.nokAddress,
              amountPaid: b.amountPaid,
              paymentStatus: b.paymentStatus,
              bookingStatus: b.bookingStatus,
              createdAt: b.createdAt,
            }))}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Total Passengers</p>
          <p className="text-lg font-semibold">{bookings.length}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Confirmed</p>
          <p className="text-lg font-semibold text-green-600">
            {bookings.filter((b) => b.bookingStatus === "confirmed").length}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-lg font-semibold">
            {formatCurrency(bookings.reduce((sum, b) => sum + b.amountPaid, 0))}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Seat Utilization</p>
          <p className="text-lg font-semibold">
            {Math.round((bookings.length / trip.seatCount) * 100)}%
          </p>
        </div>
      </div>

      {/* Mobile list (cards) */}
      <div className="sm:hidden space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No passengers found
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="border rounded-lg p-3 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">
                    Seat {booking.seatNumber}
                  </p>
                  <p className="font-medium truncate">
                    {booking.passengerName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {booking.passengerPhone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(booking.amountPaid)}
                  </p>
                  <div className="mt-1 flex items-center gap-2 justify-end">
                    {getPaymentStatusBadge(booking.paymentStatus)}
                    {getStatusBadge(booking.bookingStatus)}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                NOK: {booking.nokName} • {booking.nokPhone}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/trips/${trip.id}/checkin`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ bookingId: booking.id }),
                      });
                      if (!res.ok) return;
                      booking.checkedIn = true;
                    } catch {}
                  }}
                  disabled={!!booking.checkedIn}
                  aria-disabled={!!booking.checkedIn}
                >
                  {booking.checkedIn ? "Checked-in" : "Check-in"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seat</TableHead>
              <TableHead>Passenger</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Next of Kin</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500"
                >
                  No passengers found
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.seatNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.passengerName}</p>
                      <p className="text-sm text-gray-500">
                        Booked{" "}
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {booking.passengerPhone}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="Call passenger"
                        >
                          <PhoneIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="WhatsApp passenger"
                        >
                          <ChatBubbleLeftRightIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{booking.nokName}</p>
                      <p className="text-sm text-gray-500">
                        {booking.nokPhone}
                      </p>
                      <p className="text-xs text-gray-400">
                        {booking.nokAddress}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(booking.amountPaid)}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(booking.paymentStatus)}
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.bookingStatus)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={async () => {
                          try {
                            const res = await fetch(
                              `/api/trips/${trip.id}/checkin`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ bookingId: booking.id }),
                              }
                            );
                            if (!res.ok) return;
                            booking.checkedIn = true;
                          } catch {}
                        }}
                        disabled={!!booking.checkedIn}
                        aria-disabled={!!booking.checkedIn}
                      >
                        {booking.checkedIn ? "Checked-in" : "Check-in"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
