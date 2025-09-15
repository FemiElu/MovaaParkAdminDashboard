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

// Temporary Nigeria driver license format with checksum:
// base: 6-12 alnum, then '-' and checksum digit computed by simple mod 10
export function computeLicenseChecksum(base: string): number {
  const cleaned = base.toUpperCase().replace(/[^A-Z0-9]/g, "");
  let sum = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const code = /[0-9]/.test(ch) ? Number(ch) : ch.charCodeAt(0) - 55; // A=10
    sum = (sum + code * (i + 1)) % 97; // prime-ish modulus to spread
  }
  return sum % 10;
}

export function isValidNigeriaLicenseNumber(license: string): boolean {
  const m = license.match(/^([A-Z0-9]{6,12})-(\d)$/i);
  if (!m) return false;
  const [, base, chk] = m;
  const expected = computeLicenseChecksum(base);
  return Number(chk) === expected;
}

const LicenseSchema = z.string().min(1, "License number is required");

export const DriverDocumentSchema = z.object({
  type: z.enum(["DRIVER_LICENSE", "OTHER"]),
  number: z.string().optional(),
  note: z.string().optional(),
});

// Form schema for UI - expects string dates
export const DriverFormSchema = z.object({
  name: z.string().min(2),
  phone: PhoneSchema,
  licenseNumber: LicenseSchema,
  licenseExpiry: z.string().min(1, "License expiry is required"),
  qualifiedRoute: z.string().min(1), // Single route destination
  isActive: z.boolean(),
  rating: z.number().min(1).max(5).optional(),
  vehiclePlateNumber: VehiclePlateSchema.optional(),
  address: z.string().optional(),
  photo: z.string().optional(),
  documents: z.array(DriverDocumentSchema).optional(), // metadata only
});

// API schema - handles both string and Date inputs
export const DriverInputSchema = z.object({
  name: z.string().min(2),
  phone: PhoneSchema,
  licenseNumber: LicenseSchema,
  licenseExpiry: z.union([
    z.string().transform((str) => new Date(str)),
    z.date(),
  ]),
  qualifiedRoute: z.string().min(1), // Single route destination
  isActive: z.boolean().default(true),
  rating: z.number().min(1).max(5).optional(),
  vehiclePlateNumber: VehiclePlateSchema.optional(),
  address: z.string().optional(),
  photo: z.string().optional(),
  documents: z.array(DriverDocumentSchema).optional(), // metadata only
});

export type DriverFormData = z.infer<typeof DriverFormSchema>;
export type DriverInput = z.infer<typeof DriverInputSchema>;
