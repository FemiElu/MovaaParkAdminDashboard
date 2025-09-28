// Check-in validation logic and error handling

export interface CheckInValidationResult {
  isValid: boolean;
  error?: string;
  errorType?:
    | "WRONG_DATE"
    | "DUPLICATE_CHECKIN"
    | "CANCELLED_BOOKING"
    | "INVALID_BOOKING"
    | "PAYMENT_PENDING";
}

export interface CheckInContext {
  bookingId: string;
  tripId: string;
  currentDate: string;
  currentTime: string;
  parkId: string;
}

export class CheckInValidator {
  /**
   * Validates if a booking can be checked in
   */
  static validateCheckIn(
    booking: {
      id: string;
      checkedIn?: boolean;
      bookingStatus: string;
      paymentStatus: string;
      tripId: string;
      passengerName: string;
    },
    trip: {
      id: string;
      date: string;
      parkId: string;
    },
    context: CheckInContext
  ): CheckInValidationResult {
    // Check if booking exists
    if (!booking) {
      return {
        isValid: false,
        error: "Ticket not found or invalid",
        errorType: "INVALID_BOOKING",
      };
    }

    // Check if booking is already checked in
    if (booking.checkedIn) {
      return {
        isValid: false,
        error: "This ticket is already checked in.",
        errorType: "DUPLICATE_CHECKIN",
      };
    }

    // Check if booking is cancelled
    if (booking.bookingStatus === "cancelled") {
      return {
        isValid: false,
        error: "This booking has been cancelled and cannot be checked in.",
        errorType: "CANCELLED_BOOKING",
      };
    }

    // Check if payment is confirmed
    if (booking.paymentStatus !== "confirmed") {
      return {
        isValid: false,
        error: "Payment must be confirmed before check-in.",
        errorType: "PAYMENT_PENDING",
      };
    }

    // Check if booking is for the correct date
    if (trip.date !== context.currentDate) {
      const tripDate = new Date(trip.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return {
        isValid: false,
        error: `This booking is for ${tripDate}. Cannot check in.`,
        errorType: "WRONG_DATE",
      };
    }

    // Check if booking belongs to the correct trip
    if (booking.tripId !== context.tripId) {
      return {
        isValid: false,
        error: "This booking does not belong to the selected trip.",
        errorType: "INVALID_BOOKING",
      };
    }

    // Check if booking belongs to the correct park
    if (trip.parkId !== context.parkId) {
      return {
        isValid: false,
        error: "This booking does not belong to this park.",
        errorType: "INVALID_BOOKING",
      };
    }

    // All validations passed
    return {
      isValid: true,
    };
  }

  /**
   * Gets user-friendly error message for display
   */
  static getErrorMessage(result: CheckInValidationResult): string {
    if (result.isValid) return "";

    switch (result.errorType) {
      case "WRONG_DATE":
        return result.error || "This booking is for a different date.";
      case "DUPLICATE_CHECKIN":
        return result.error || "This ticket has already been checked in.";
      case "CANCELLED_BOOKING":
        return result.error || "This booking has been cancelled.";
      case "PAYMENT_PENDING":
        return result.error || "Payment must be confirmed before check-in.";
      case "INVALID_BOOKING":
        return result.error || "Invalid booking or ticket not found.";
      default:
        return result.error || "Unable to check in this passenger.";
    }
  }

  /**
   * Gets the appropriate icon for the error type
   */
  static getErrorIcon(errorType?: string): string {
    switch (errorType) {
      case "WRONG_DATE":
        return "📅";
      case "DUPLICATE_CHECKIN":
        return "✅";
      case "CANCELLED_BOOKING":
        return "❌";
      case "PAYMENT_PENDING":
        return "💳";
      case "INVALID_BOOKING":
        return "❓";
      default:
        return "⚠️";
    }
  }

  /**
   * Gets the appropriate color class for the error type
   */
  static getErrorColorClass(errorType?: string): string {
    switch (errorType) {
      case "WRONG_DATE":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "DUPLICATE_CHECKIN":
        return "text-green-600 bg-green-50 border-green-200";
      case "CANCELLED_BOOKING":
        return "text-red-600 bg-red-50 border-red-200";
      case "PAYMENT_PENDING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "INVALID_BOOKING":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-red-600 bg-red-50 border-red-200";
    }
  }
}
