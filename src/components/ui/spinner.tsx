import * as React from "react";
import { cn } from "@/lib/utils";

export type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
    size?: SpinnerSize;
    className?: string;
    text?: string;
}

const sizeClasses: Record<SpinnerSize, { spinner: string; text: string }> = {
    sm: { spinner: "h-4 w-4", text: "text-xs" },
    md: { spinner: "h-6 w-6", text: "text-sm" },
    lg: { spinner: "h-8 w-8", text: "text-base" },
};

export function Spinner({ size = "md", className, text }: SpinnerProps) {
    const { spinner, text: textSize } = sizeClasses[size];

    return (
        <div className={cn("flex items-center justify-center space-x-2", className)}>
            <svg
                className={cn("animate-spin text-[var(--primary)]", spinner)}
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
            {text && (
                <span className={cn("text-gray-600 font-medium", textSize)}>
                    {text}
                </span>
            )}
        </div>
    );
}

// Full page loader variant
interface PageLoaderProps {
    text?: string;
}

export function PageLoader({ text = "Loading..." }: PageLoaderProps) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <Spinner size="lg" className="mb-4" />
                <p className="text-gray-600 font-medium">{text}</p>
            </div>
        </div>
    );
}
