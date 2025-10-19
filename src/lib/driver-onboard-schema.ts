import { z } from "zod";

// Phone: free-form but at least 7 digits total after stripping non-digits
export const PhoneSchema = z
  .string()
  .min(3)
  .refine((val) => (val.match(/\d/g) ?? []).length >= 7, {
    message: "Phone must contain at least 7 digits",
  });

// Nigerian vehicle plate pattern: ABC-123DE (3 letters, dash, 3 digits, 2 letters)
export const VehiclePlateSchema = z
  .string()
  .regex(
    /^[A-Za-z]{3}-\d{3}[A-Za-z]{2}$/,
    "Invalid vehicle plate format (ABC-123DE)"
  );

// Nigerian National Identification Number (NIN) format
export const NinSchema = z
  .string()
  .regex(/^\d{11}$/, "NIN must be exactly 11 digits");

// Date of birth schema
export const DateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// Driver onboard form schema for UI
export const DriverOnboardFormSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Valid email address required"),
  phone_number: PhoneSchema,
  date_of_birth: DateOfBirthSchema,
  address: z.string().min(5, "Address must be at least 5 characters"),
  nin: NinSchema,
  plate_number: VehiclePlateSchema,
});

export type DriverOnboardFormData = z.infer<typeof DriverOnboardFormSchema>;

