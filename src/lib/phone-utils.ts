/**
 * Utility functions for phone number formatting
 */

/**
 * Formats Nigerian phone numbers to international format (+234)
 * Handles various input formats:
 * - 08012345678 -> +2348012345678
 * - 2348012345678 -> +2348012345678
 * - 8012345678 -> +2348012345678
 * - +2348012345678 -> +2348012345678
 */
export const formatNigerianPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return phoneNumber;

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // If it starts with 234, add + prefix
  if (cleaned.startsWith("234")) {
    return `+${cleaned}`;
  }

  // If it starts with 0, replace with +234
  if (cleaned.startsWith("0")) {
    return `+234${cleaned.substring(1)}`;
  }

  // If it's 10 digits and doesn't start with 0, assume it's a Nigerian number
  if (cleaned.length === 10) {
    return `+234${cleaned}`;
  }

  // If it's already in international format, return as is
  if (cleaned.length === 13 && cleaned.startsWith("234")) {
    return `+${cleaned}`;
  }

  // Return original if we can't determine the format
  return phoneNumber;
};

/**
 * Validates if a phone number is a valid Nigerian number
 */
export const isValidNigerianPhoneNumber = (phoneNumber: string): boolean => {
  const formatted = formatNigerianPhoneNumber(phoneNumber);
  const cleaned = formatted.replace(/\D/g, "");

  // Nigerian numbers should be 13 digits starting with 234
  return cleaned.length === 13 && cleaned.startsWith("234");
};

/**
 * Formats phone number for display (removes +234 prefix for Nigerian numbers)
 */
export const formatPhoneNumberForDisplay = (phoneNumber: string): string => {
  if (!phoneNumber) return phoneNumber;

  const cleaned = phoneNumber.replace(/\D/g, "");

  // If it's a Nigerian number, format as 080xxxxxxxx
  if (cleaned.length === 13 && cleaned.startsWith("234")) {
    return `0${cleaned.substring(3)}`;
  }

  return phoneNumber;
};
