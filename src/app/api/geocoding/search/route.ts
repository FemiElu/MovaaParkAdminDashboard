import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side address search using Nominatim API
 * Provides autocomplete functionality for location picker
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.length < 2) {
            return NextResponse.json(
                { error: "Query parameter 'q' is required and must be at least 2 characters" },
                { status: 400 }
            );
        }

        // Make request to Nominatim API from server (no CORS issues)
        const params = new URLSearchParams({
            q: query,
            format: "json",
            limit: "5",
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
                `Nominatim search API error: ${response.status} ${response.statusText}`
            );
            return NextResponse.json(
                {
                    error: `Search service error: ${response.status}`,
                    results: [],
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            return NextResponse.json({
                results: [],
            });
        }

        // Transform Nominatim response to our format
        const results = data.map((item: any) => ({
            displayName: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            address: {
                city: item.address?.city || item.address?.town || item.address?.village,
                state: item.address?.state,
                country: item.address?.country,
            },
        }));

        return NextResponse.json({
            results,
        });
    } catch (error) {
        console.error("Search API error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Search failed",
                results: [],
            },
            { status: 500 }
        );
    }
}
