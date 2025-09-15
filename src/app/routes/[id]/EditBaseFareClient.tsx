"use client";
import { EditBaseFare } from "@/components/routes/edit-base-fare";
import { RouteConfig } from "@/types";

export default function EditBaseFareClient({ route }: { route: RouteConfig }) {
  return <EditBaseFare route={route} />;
}
