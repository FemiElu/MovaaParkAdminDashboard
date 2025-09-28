"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  XMarkIcon,
  CameraIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { BrowserMultiFormatReader } from "@zxing/library";
import { AuditLogger, getUserContext } from "@/lib/audit-logger";

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    return () => {
      reader.reset();
    };
  }, []);

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setError(null);

      await readerRef.current?.decodeFromVideoDevice(
        null,
        videoRef.current,
        (result, error) => {
          if (result) {
            setIsScanning(false);

            // Log QR scan event
            try {
              const userContext = getUserContext();
              AuditLogger.log({
                action: "qr_code_scanned",
                entityType: "booking",
                entityId: result.getText(),
                userId: "admin",
                parkId: "unknown", // Would need to be passed as prop
                details: {
                  qrCodeData: result.getText(),
                  scanMethod: "camera",
                  timestamp: new Date().toISOString(),
                },
                ...userContext,
              });
            } catch (auditError) {
              console.error("Failed to log QR scan audit:", auditError);
            }

            onScan(result.getText());
          }
          if (
            error &&
            !(error instanceof Error && error.name === "NotFoundException")
          ) {
            console.error("QR Scan error:", error);
          }
        }
      );

      setHasPermission(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied or not available");
      setHasPermission(false);
      setIsScanning(false);
    }
  }, [onScan]);

  const stopScanning = () => {
    readerRef.current?.reset();
    setIsScanning(false);
  };

  const handleManualInput = () => {
    const input = prompt("Enter QR code data manually:");
    if (input && input.trim()) {
      // Log manual QR input
      try {
        const userContext = getUserContext();
        AuditLogger.log({
          action: "qr_code_manual_input",
          entityType: "booking",
          entityId: input.trim(),
          userId: "admin",
          parkId: "unknown", // Would need to be passed as prop
          details: {
            qrCodeData: input.trim(),
            inputMethod: "manual",
            timestamp: new Date().toISOString(),
          },
          ...userContext,
        });
      } catch (auditError) {
        console.error("Failed to log manual QR input audit:", auditError);
      }

      onScan(input.trim());
    }
  };

  const retryScan = () => {
    setError(null);
    setHasPermission(null);
    startScanning();
  };

  // Start scanning when component mounts
  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, [startScanning]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CameraIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Scan QR Code
              </h2>
              <p className="text-sm text-gray-600">
                Point your camera at the passenger&apos;s QR ticket
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scanner Content */}
        <div className="p-6">
          {hasPermission === false ? (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Camera Permission Required
              </h3>
              <p className="text-gray-600 mb-6">
                Please allow camera access to scan QR codes. You can enable it
                in your browser settings.
              </p>
              <div className="space-y-3">
                <button
                  onClick={retryScan}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleManualInput}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Enter Manually
                </button>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Scanner Error
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={retryScan}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleManualInput}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Enter Manually
                </button>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera Scanner */}
              <div className="relative">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />

                  {/* Scanning overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-4 border-2 border-blue-500 rounded-lg">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Position the QR code within the frame above
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  The scanner will automatically detect and process the code
                </p>
              </div>

              {/* Manual entry fallback */}
              <div className="border-t pt-4 space-y-2">
                <button
                  onClick={handleManualInput}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Enter QR Code Manually
                </button>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
