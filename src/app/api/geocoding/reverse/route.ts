import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side reverse geocoding using Nominatim API
 * Converts coordinates to human-readable address
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get("lat");
        const lng = searchParams.get("lng");

        if (!lat || !lng) {
            return NextResponse.json(
                { error: "Parameters 'lat' and 'lng' are required" },
                { status: 400 }
            );
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            return NextResponse.json(
                { error: "Invalid latitude or longitude values" },
                { status: 400 }
            );
        }

        // Make request to Nominatim API from server (no CORS issues)
        const params = new URLSearchParams({
            lat: latitude.toString(),
            lon: longitude.toString(),
            format: "json",
            addressdetails: "1",
        });

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params}`,
            {
                headers: {
                    "User-Agent": "MovaaParkAdmin/1.0 (https://movaa.com)", // Required by Nominatim
                },
            }
        );

        if (!response.ok) {
            console.error(
                `Nominatim reverse API error: ${response.status} ${response.statusText}`
            );
            return NextResponse.json(
                {
                    error: `Reverse geocoding service error: ${response.status}`,
                    formattedAddress: `${latitude}, ${longitude}`,
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        if (!data || data.error) {
            return NextResponse.json({
                formattedAddress: `${latitude}, ${longitude}`,
                city: "",
                state: "",
                country: "Nigeria",
            });
        }

        // Extract city with multiple fallbacks for Nigerian addresses
        // Nominatim often doesn't have "city" for smaller Nigerian locations
        let city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.suburb ||
            data.address?.county ||
            data.address?.municipality ||
            data.address?.state_district ||
            data.address?.state || // Use state as fallback
            "";

        const state = data.address?.state || "";

        // Final fallback: If city is still empty, try to extract from formatted address
        if (!city && data.display_name) {
            // Extract the first significant location from the address
            const addressParts = data.display_name.split(",").map((p: string) => p.trim());
            // Skip road names and use the first meaningful location
            city = addressParts.find((part: string) =>
                part &&
                !part.match(/^\d/) && // Not a postal code
                !part.toLowerCase().includes("nigeria") && // Not country name
                part.length > 2 // Has meaningful length
            ) || state || "Lagos"; // Ultimate fallback to Lagos
        }

        // Log for debugging
        console.log("Reverse geocoding result:", {
            latitude,
            longitude,
            address: data.address,
            displayName: data.display_name,
            extractedCity: city,
            extractedState: state,
        });

        return NextResponse.json({
            formattedAddress: data.display_name || `${latitude}, ${longitude}`,
            city,
            state,
            country: data.address?.country || "Nigeria",
        });
    } catch (error) {
        console.error("Reverse geocoding API error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Reverse geocoding failed",
                formattedAddress: "",
            },
            { status: 500 }
        );
    }
}
