"use client";

import { ReactNode } from "react";
import { ToastProvider } from "./ui/toast";
import { AuthProvider } from "@/lib/auth-context";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
