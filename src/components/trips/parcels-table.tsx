"use client";

import { useState, useMemo } from "react";
import { Trip, Parcel, Vehicle } from "@/lib/trips-store";
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
import { Badge } from "@/components/ui/badge";
import { ExportButtons } from "./export-buttons";
import { PhoneIcon, PrinterIcon } from "@heroicons/react/24/outline";

interface ParcelsTableProps {
  trip: Trip;
  parcels: Parcel[];
  vehicle?: Vehicle;
}

export function ParcelsTable({ trip, parcels, vehicle }: ParcelsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredParcels = useMemo(() => {
    return parcels.filter((parcel) => {
      const matchesSearch =
        parcel.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parcel.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parcel.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || parcel.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [parcels, searchTerm, statusFilter]);

  const getStatusBadge = (status: Parcel["status"]) => {
    const colors = {
      unassigned: "bg-gray-100 text-gray-800",
      assigned: "bg-blue-100 text-blue-800",
      "in-transit": "bg-yellow-100 text-yellow-800",
      delivered: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const totalParcelRevenue = parcels.reduce(
    (sum, parcel) => sum + parcel.fee,
    0
  );
  const capacityUsage = vehicle
    ? (parcels.length / vehicle.maxParcelsPerVehicle) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Search parcels..."
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
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in-transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print Labels
          </Button>
          <ExportButtons
            size="sm"
            variant="parcels"
            tripId={trip.id}
            parcels={parcels.map((p) => ({
              id: p.id,
              senderName: p.senderName,
              senderPhone: p.senderPhone,
              receiverName: p.receiverName,
              receiverPhoneMasked: p.receiverPhoneMasked,
              receiverPhone: p.receiverPhone,
              fee: p.fee,
              status: p.status,
            }))}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Total Parcels</p>
          <p className="text-lg font-semibold">{parcels.length}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Capacity Used</p>
          <p className="text-lg font-semibold">{Math.round(capacityUsage)}%</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-lg font-semibold">
            {formatCurrency(totalParcelRevenue)}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Max Capacity</p>
          <p className="text-lg font-semibold">
            {vehicle?.maxParcelsPerVehicle || "N/A"}
          </p>
        </div>
      </div>

      {/* Capacity Warning */}
      {capacityUsage > 80 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                High Capacity Usage
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Vehicle capacity is {Math.round(capacityUsage)}% full.
                  {capacityUsage >= 100 &&
                    " Consider assigning additional vehicles."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parcel ID</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParcels.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  No parcels found
                </TableCell>
              </TableRow>
            ) : (
              filteredParcels.map((parcel) => (
                <TableRow key={parcel.id}>
                  <TableCell className="font-medium font-mono">
                    {parcel.id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{parcel.senderName}</p>
                      <p className="text-sm text-gray-500">
                        {parcel.senderPhone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{parcel.receiverName}</p>
                      <p className="text-sm text-gray-500">
                        {parcel.receiverPhone || parcel.receiverPhoneMasked}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {parcel.receiverPhone || parcel.receiverPhoneMasked}
                      </span>
                      {parcel.receiverPhone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="Call receiver"
                        >
                          <PhoneIcon className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(parcel.fee)}
                  </TableCell>
                  <TableCell>{getStatusBadge(parcel.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="text-xs">
                        Update Status
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        Print Label
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
