import React from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const color =
    variant === "primary"
      ? "bg-[var(--primary)] text-white hover:opacity-95 focus-visible:ring-[var(--primary)]"
      : variant === "outline"
      ? "border border-[var(--primary)] text-[var(--primary)] hover:bg-emerald-50 focus-visible:ring-[var(--primary)]"
      : "text-[var(--primary)] hover:bg-emerald-50 focus-visible:ring-[var(--primary)]";
  return (
    <button
      className={[base, color, sizeClasses[size], className].join(" ")}
      {...props}
    />
  );
}
