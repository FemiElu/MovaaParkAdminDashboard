"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { geocodingProvider } from "@/lib/geocoding-provider";
import type { SearchResult } from "@/lib/geocoding-provider";

// Dynamically import the map component (client-side only)
const MapComponent = dynamic(() => import("./map-component"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
            </div>
        </div>
    ),
});

export interface LocationData {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
}

interface LocationPickerProps {
    onLocationSelect: (location: LocationData) => void;
    initialLocation?: Partial<LocationData>;
    className?: string;
}

export default function LocationPicker({
    onLocationSelect,
    initialLocation,
    className = "",
}: LocationPickerProps) {
    // Default to Lagos center if no initial location
    const defaultCenter = useMemo(
        () => ({
            lat: initialLocation?.latitude || 6.5244,
            lng: initialLocation?.longitude || 3.3792,
        }),
        [initialLocation]
    );

    const [position, setPosition] = useState(defaultCenter);
    const [address, setAddress] = useState(initialLocation?.address || "");
    const [city, setCity] = useState(initialLocation?.city || "");
    const [state, setState] = useState(initialLocation?.state || "");
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // Reverse geocode when position changes
    const updateAddressFromPosition = useCallback(
        async (lat: number, lng: number) => {
            setIsLoadingAddress(true);
            try {
                const result = await geocodingProvider.reverseGeocode(lat, lng);
                setAddress(result.formattedAddress);
                setCity(result.city || "");
                setState(result.state || "");
                setIsConfirmed(false); // Reset confirmation when position changes
            } catch (error) {
                console.error("Reverse geocoding failed:", error);
                setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            } finally {
                setIsLoadingAddress(false);
            }
        },
        []
    );

    // Search for addresses
    const handleSearch = useCallback(async (query: string) => {
        if (!query || query.length < 3) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const results = await geocodingProvider.searchAddress(query);
            setSearchResults(results);
            setShowSearchResults(true);
        } catch (error) {
            console.error("Search failed:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    // Handle search result selection
    const handleSelectSearchResult = (result: SearchResult) => {
        setPosition({ lat: result.latitude, lng: result.longitude });
        setAddress(result.displayName);
        setCity(result.address?.city || "");
        setState(result.address?.state || "");
        setSearchQuery("");
        setShowSearchResults(false);
        setIsConfirmed(false);
    };

    // Get current location using browser geolocation
    const handleGetCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setPosition({ lat: latitude, lng: longitude });
                updateAddressFromPosition(latitude, longitude);
                setIsGettingLocation(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert(
                    "Unable to get your location. Please ensure location permissions are enabled."
                );
                setIsGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, [updateAddressFromPosition]);

    // Handle marker drag
    const handleMarkerDrag = useCallback(
        (lat: number, lng: number) => {
            setPosition({ lat, lng });
            updateAddressFromPosition(lat, lng);
        },
        [updateAddressFromPosition]
    );

    // Confirm location
    const handleConfirmLocation = () => {
        // Validate city is not empty
        if (!city || city.trim() === "") {
            alert("Please enter a city/town name before confirming the location.");
            return;
        }

        setIsConfirmed(true);
        onLocationSelect({
            latitude: position.lat,
            longitude: position.lng,
            address,
            city: city.trim(),
            state,
        });
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search Box */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search for your terminal location
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by address, landmark, or area name..."
                        className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                        </div>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {searchResults.map((result, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectSearchResult(result)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                                <div className="flex items-start">
                                    <svg
                                        className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {result.displayName}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {showSearchResults && searchResults.length === 0 && !isSearching && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
                        <p className="text-sm text-gray-500 text-center">
                            No results found. Try a different search term.
                        </p>
                    </div>
                )}
            </div>

            {/* Current Location Button */}
            <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isGettingLocation ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                        Getting your location...
                    </>
                ) : (
                    <>
                        <svg
                            className="h-5 w-5 mr-2 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        Use My Current Location
                    </>
                )}
            </button>

            {/* Map */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or drag the pin to your exact location
                </label>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                    <MapComponent
                        position={position}
                        onMarkerDrag={handleMarkerDrag}
                        zoom={13}
                    />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    💡 Tip: Zoom in and drag the pin to mark your exact terminal location
                </p>
            </div>

            {/* Location Details */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <svg
                        className="h-5 w-5 text-green-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    Selected Location
                </h4>

                {isLoadingAddress ? (
                    <div className="flex items-center text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                        Loading address...
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Address</p>
                            <p className="text-sm text-gray-900">{address || "Not available"}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 font-medium">
                                    Coordinates
                                </p>
                                <p className="text-sm text-gray-900 font-mono">
                                    {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">
                                    State
                                </p>
                                <p className="text-sm text-gray-900">
                                    {state || "Not detected"}
                                </p>
                            </div>
                        </div>

                        {/* Manual City Input */}
                        <div>
                            <label className="block text-xs text-gray-500 font-medium mb-1">
                                City / Town *
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => {
                                    const newCity = e.target.value;
                                    setCity(newCity);
                                    setIsConfirmed(false); // Reset confirmation when manually edited
                                }}
                                placeholder="e.g., Lagos, Ajah, Sangotedo..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {city ? "✓ Auto-detected. You can edit if incorrect." : "⚠️ Please enter your city/area name"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation */}
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <input
                    type="checkbox"
                    id="confirm-location"
                    checked={isConfirmed}
                    onChange={(e) => {
                        if (e.target.checked) {
                            handleConfirmLocation();
                        } else {
                            setIsConfirmed(false);
                        }
                    }}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-0.5"
                />
                <label
                    htmlFor="confirm-location"
                    className="text-sm text-gray-700 cursor-pointer"
                >
                    <span className="font-medium text-gray-900">
                        I confirm this is the correct location of my terminal
                    </span>
                    <br />
                    <span className="text-gray-600">
                        Passengers will use this to find the nearest park to their location
                    </span>
                </label>
            </div>

            {!isConfirmed && (
                <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                    <svg
                        className="h-5 w-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <p className="text-sm">
                        Please confirm the location before proceeding
                    </p>
                </div>
            )}
        </div>
    );
}
