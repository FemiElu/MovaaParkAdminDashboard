import Link from "next/link";
import { Button } from "./button";

interface BackButtonProps {
  href: string;
  children?: React.ReactNode;
  className?: string;
}

export function BackButton({
  href,
  children = "Back",
  className = "",
}: BackButtonProps) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 ${className}`}>
      <Button variant="outline" size="sm" className="flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {children}
      </Button>
    </Link>
  );
}

