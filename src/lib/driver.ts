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
  )
  .optional();

// Nigeria driver license format: 3 letters, 5 digits, 2 letters, 1 digit
// Example: AKW06968AA2
export const NigeriaLicenseRegex = /^[A-Za-z]{3}\d{5}[A-Za-z]{2}\d$/;

export function isValidNigeriaLicenseNumber(license: string): boolean {
  return NigeriaLicenseRegex.test(license.toUpperCase());
}

const LicenseSchemaAPI = z
  .string()
  .min(1, "License number is required")
  .refine((v) => isValidNigeriaLicenseNumber(v), {
    message: "Invalid Nigerian license number",
  });

// UI form: enforce the official Nigerian format
const LicenseSchemaUI = z
  .string()
  .min(1, "License number is required")
  .refine((v) => isValidNigeriaLicenseNumber(v), {
    message: "Invalid Nigerian license number",
  });

export const DriverDocumentSchema = z.object({
  type: z.enum(["DRIVER_LICENSE", "OTHER"]),
  number: z.string().optional(),
  note: z.string().optional(),
});

// Form schema for UI - expects string dates
export const DriverFormSchema = z.object({
  name: z.string().min(2),
  phone: PhoneSchema,
  licenseNumber: LicenseSchemaUI,
  licenseExpiry: z.string().min(1, "License expiry is required"),
  dob: z.string().min(1, "Date of birth is required"), // New
  qualifiedRoute: z.string().min(1), // routeId
  isActive: z.boolean(),
  vehiclePlateNumber: VehiclePlateSchema.optional(),
  address: z.string().optional(),
  nin: z.string().min(1, "NIN (National ID Number) is required"), // Separate NIN
  route_id: z.string().min(1), // For backend submission
  driversLicenseFile: z.instanceof(File, {
    message: "Driver's license file is required",
  }), // File upload
  documents: z.array(DriverDocumentSchema).optional(), // metadata only
});

// API schema - handles both string and Date inputs
export const DriverInputSchema = z.object({
  name: z.string().min(2),
  phone: PhoneSchema,
  licenseNumber: LicenseSchemaAPI,
  licenseExpiry: z.union([
    z.string().transform((str) => new Date(str)),
    z.date(),
  ]),
  // Accept either single qualifiedRoute or array qualifiedRoutes (by destination names)
  qualifiedRoute: z.string().min(1).optional(),
  qualifiedRoutes: z.array(z.string().min(1)).optional(),
  isActive: z.boolean().default(true),
  vehiclePlateNumber: VehiclePlateSchema.optional(),
  address: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  photo: z.string().url().optional(),
  documents: z.array(DriverDocumentSchema).optional(),
});

export type DriverFormData = z.infer<typeof DriverFormSchema>;
export type DriverInput = z.infer<typeof DriverInputSchema>;
