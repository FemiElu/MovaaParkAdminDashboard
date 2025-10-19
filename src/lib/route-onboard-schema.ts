import { z } from "zod";

// Route onboard form schema for UI
export const RouteOnboardFormSchema = z.object({
  from_state: z.string().min(2, "From state must be at least 2 characters"),
  to_state: z.string().min(2, "To state must be at least 2 characters"),
  to_city: z.string().min(2, "To city must be at least 2 characters"),
  bus_stop: z.string().min(3, "Bus stop must be at least 3 characters"),
});

export type RouteOnboardFormData = z.infer<typeof RouteOnboardFormSchema>;

