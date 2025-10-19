import { z } from "zod";

// Trip create form schema for UI
export const TripCreateFormSchema = z.object({
  total_seats: z
    .number()
    .min(1, "Total seats must be at least 1")
    .max(100, "Total seats cannot exceed 100"),
  to_route: z.string().min(1, "Route is required"),
  is_recurrent: z.boolean(),
  from_state: z.string().min(2, "From state must be at least 2 characters"),
  departure_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  departure_time: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be in HH:MM:SS format"),
  price: z.string().min(1, "Price is required"),
  driver_id: z.string().optional(),
  driver_phone: z.string().optional(),
});

export type TripCreateFormData = z.infer<typeof TripCreateFormSchema>;
