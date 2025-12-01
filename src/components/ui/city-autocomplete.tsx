"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { searchCities } from "@/lib/nigerian-cities";

interface CityAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    label?: string;
    className?: string;
}

export function CityAutocomplete({
    value,
    onChange,
    placeholder = "e.g., Ibadan, Abuja",
    error,
    label = "Destination",
    className = "",
}: CityAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [inputValue, setInputValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Update internal state when external value changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        if (newValue.trim().length > 0) {
            const results = searchCities(newValue, 8);
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
            setSelectedIndex(-1);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }

        // Update parent with raw input value
        onChange(newValue);
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (city: string) => {
        setInputValue(city);
        onChange(city);
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelectSuggestion(suggestions[selectedIndex]);
                }
                break;
            case "Escape":
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
        }
    };

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && suggestionsRef.current) {
            const selectedElement = suggestionsRef.current.children[
                selectedIndex
            ] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    block: "nearest",
                    behavior: "smooth",
                });
            }
        }
    }, [selectedIndex]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                inputRef.current &&
                !inputRef.current.contains(e.target as Node) &&
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`}>
            <label
                htmlFor="city-autocomplete"
                className="block text-sm font-medium text-gray-700 mb-2"
            >
                {label} *
            </label>
            <div className="relative">
                <input
                    ref={inputRef}
                    id="city-autocomplete"
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (inputValue.trim().length > 0 && suggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    placeholder={placeholder}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${error ? "border-red-500" : "border-gray-300"
                        }`}
                    aria-autocomplete="list"
                    aria-controls="city-suggestions"
                    aria-expanded={showSuggestions}
                    autoComplete="off"
                />

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div
                        ref={suggestionsRef}
                        id="city-suggestions"
                        role="listbox"
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                        {suggestions.map((city, index) => (
                            <div
                                key={city}
                                role="option"
                                aria-selected={index === selectedIndex}
                                onClick={() => handleSelectSuggestion(city)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`px-3 py-2 cursor-pointer transition-colors ${index === selectedIndex
                                        ? "bg-green-100 text-green-900"
                                        : "hover:bg-gray-50"
                                    }`}
                            >
                                {city}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

            {/* Helper text */}
            {!error && (
                <p className="mt-1 text-xs text-gray-500">
                    Start typing to see suggestions
                </p>
            )}
        </div>
    );
}
