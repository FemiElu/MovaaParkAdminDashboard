"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
    position: { lat: number; lng: number };
    onMarkerDrag: (lat: number, lng: number) => void;
    zoom?: number;
}

export default function MapComponent({
    position,
    onMarkerDrag,
    zoom = 13,
}: MapComponentProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        // Fix for default marker icon
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Initialize map
        const map = L.map(containerRef.current).setView([position.lat, position.lng], zoom);

        // Add OpenStreetMap tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        // Create custom icon for the marker (green to match brand)
        const customIcon = L.divIcon({
            className: "custom-marker",
            html: `
        <div style="position: relative;">
          <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 30 20 30s20-16 20-30c0-11.046-8.954-20-20-20z" fill="#059669"/>
            <circle cx="20" cy="20" r="8" fill="white"/>
            <circle cx="20" cy="20" r="4" fill="#059669"/>
          </svg>
          <div style="
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 2px 8px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 11px;
            font-weight: 600;
            color: #059669;
            white-space: nowrap;
          ">
            Drag me!
          </div>
        </div>
      `,
            iconSize: [40, 50],
            iconAnchor: [20, 50],
        });

        // Add draggable marker
        const marker = L.marker([position.lat, position.lng], {
            draggable: true,
            icon: customIcon,
        }).addTo(map);

        // Add pulse animation circle
        const pulseCircle = L.circle([position.lat, position.lng], {
            color: "#059669",
            fillColor: "#059669",
            fillOpacity: 0.2,
            radius: 100,
        }).addTo(map);

        // Handle marker drag
        marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onMarkerDrag(pos.lat, pos.lng);
            pulseCircle.setLatLng(pos);
        });

        mapRef.current = map;
        markerRef.current = marker;

        // Add zoom control message
        const InfoControl = L.Control.extend({
            onAdd: function () {
                const div = L.DomUtil.create("div", "info");
                div.innerHTML = `
          <div style="
            background: white;
            padding: 8px 12px;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            font-size: 12px;
            color: #374151;
          ">
            <strong>💡 Tip:</strong> Zoom in for better precision
          </div>
        `;
                return div;
            },
        });

        const info = new InfoControl({ position: "bottomleft" });
        info.addTo(map);

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []); // Only run once on mount

    // Update marker position when prop changes
    useEffect(() => {
        if (mapRef.current && markerRef.current) {
            const newLatLng = L.latLng(position.lat, position.lng);
            markerRef.current.setLatLng(newLatLng);
            mapRef.current.panTo(newLatLng);

            // Update pulse circle by iterating through layers
            mapRef.current.eachLayer((layer: any) => {
                if (layer instanceof L.Circle) {
                    layer.setLatLng(newLatLng);
                }
            });
        }
    }, [position]);

    return (
        <div
            ref={containerRef}
            className="w-full h-[400px] rounded-lg z-0"
            style={{ minHeight: "400px" }}
        />
    );
}
