import { NextRequest, NextResponse } from "next/server";

export interface GeocodingOptions {
  address: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  success: boolean;
  error?: string;
}

/**
 * Server-side geocoding using Nominatim API
 * This avoids CORS issues by making requests from the server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      address,
      city,
      state,
      country = "Nigeria",
    }: GeocodingOptions = body;

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Construct the full address
    const addressParts = [address, city, state, country].filter(Boolean);
    const fullAddress = addressParts.join(", ");

    // Make request to Nominatim API from server (no CORS issues)
    const params = new URLSearchParams({
      q: fullAddress,
      format: "json",
      limit: "1",
      countrycodes: "ng", // Limit to Nigeria
      addressdetails: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "MovaaParkAdmin/1.0 (https://movaa.com)", // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Nominatim API error: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Geocoding service error: ${response.status}`,
          latitude: 0,
          longitude: 0,
          address: fullAddress,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Address not found",
        latitude: 0,
        longitude: 0,
        address: fullAddress,
      });
    }

    const result = data[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({
        success: false,
        error: "Invalid coordinates returned",
        latitude: 0,
        longitude: 0,
        address: fullAddress,
      });
    }

    return NextResponse.json({
      success: true,
      latitude,
      longitude,
      address: result.display_name || fullAddress,
    });
  } catch (error) {
    console.error("Geocoding API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Geocoding failed",
        latitude: 0,
        longitude: 0,
        address: "",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const country = searchParams.get("country") || "Nigeria";

  if (!address) {
    return NextResponse.json(
      { error: "Address parameter is required" },
      { status: 400 }
    );
  }

  // Use POST logic
  const mockRequest = {
    json: () => Promise.resolve({ address, city, state, country }),
  } as NextRequest;

  return POST(mockRequest);
}
