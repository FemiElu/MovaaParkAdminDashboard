#!/usr/bin/env node

/**
 * Race Condition Simulation Script
 *
 * This script simulates concurrent booking attempts to test atomic seat hold functionality.
 * It creates multiple simultaneous booking requests and verifies that seat count limits
 * are properly enforced even under high concurrency.
 */

// Import the trips store - we'll need to compile TypeScript first
// For now, let's create a simple mock version for testing
const { tripsStore } = require("../dist/src/lib/trips-store");

// Configuration
const CONCURRENT_REQUESTS = 20;
const TRIP_ID = "trip_ajah_ibadan_2025_08_29"; // The trip with 17 confirmed bookings
const BOOKING_DELAY_MS = 50; // Simulate network delay

// Mock booking data
const generateBookingData = (index) => ({
  passengerName: `Race Test Passenger ${index}`,
  passengerPhone: `+2348012345${index.toString().padStart(3, "0")}`,
  nokName: `Race Test NOK ${index}`,
  nokPhone: `+2348012346${index.toString().padStart(3, "0")}`,
  nokAddress: `${index} Race Test Street, Lagos`,
  amountPaid: 5000,
  bookingStatus: "confirmed",
  paymentStatus: "confirmed",
  seatNumber: index + 1,
  checkedIn: false,
  updatedAt: new Date().toISOString(),
});

// Simulate booking attempt with delay
const attemptBooking = async (index) => {
  const delay = Math.random() * BOOKING_DELAY_MS;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const bookingData = generateBookingData(index);
  const result = tripsStore.createBooking(TRIP_ID, bookingData);

  return {
    index,
    success: result !== null,
    bookingId: result?.id || null,
    timestamp: new Date().toISOString(),
  };
};

// Run race condition simulation
const simulateRaceCondition = async () => {
  console.log("🏁 Starting Race Condition Simulation");
  console.log(`📊 Testing ${CONCURRENT_REQUESTS} concurrent booking attempts`);
  console.log(`🎯 Target Trip: ${TRIP_ID}`);

  // Get initial trip state
  const initialTrip = tripsStore.getTrip(TRIP_ID);
  if (!initialTrip) {
    console.error("❌ Target trip not found:", TRIP_ID);
    process.exit(1);
  }

  console.log(`🚌 Initial seat count: ${initialTrip.seatCount}`);
  console.log(
    `👥 Initial confirmed bookings: ${initialTrip.confirmedBookingsCount}`
  );
  console.log(
    `🪑 Available seats: ${
      initialTrip.seatCount - initialTrip.confirmedBookingsCount
    }`
  );
  console.log("");

  // Start timer
  const startTime = Date.now();

  // Launch concurrent booking attempts
  console.log("🚀 Launching concurrent booking attempts...");
  const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
    attemptBooking(i + 1)
  );

  // Wait for all attempts to complete
  const results = await Promise.all(promises);

  // Calculate execution time
  const executionTime = Date.now() - startTime;

  // Analyze results
  const successfulBookings = results.filter((r) => r.success);
  const failedBookings = results.filter((r) => !r.success);

  // Get final trip state
  const finalTrip = tripsStore.getTrip(TRIP_ID);
  const finalBookings = tripsStore.getBookings(TRIP_ID);

  console.log("📈 Simulation Results:");
  console.log("=".repeat(50));
  console.log(`⏱️  Execution time: ${executionTime}ms`);
  console.log(`✅ Successful bookings: ${successfulBookings.length}`);
  console.log(`❌ Failed bookings: ${failedBookings.length}`);
  console.log(
    `🎯 Success rate: ${(
      (successfulBookings.length / CONCURRENT_REQUESTS) *
      100
    ).toFixed(1)}%`
  );
  console.log("");

  console.log("📊 Trip State Analysis:");
  console.log("-".repeat(30));
  console.log(`🚌 Final seat count: ${finalTrip.seatCount}`);
  console.log(
    `👥 Final confirmed bookings: ${finalTrip.confirmedBookingsCount}`
  );
  console.log(
    `🪑 Final available seats: ${
      finalTrip.seatCount - finalTrip.confirmedBookingsCount
    }`
  );
  console.log(
    `📈 Bookings added: ${
      finalTrip.confirmedBookingsCount - initialTrip.confirmedBookingsCount
    }`
  );
  console.log("");

  // Verify atomicity
  const expectedMaxBookings =
    initialTrip.confirmedBookingsCount +
    (finalTrip.seatCount - initialTrip.confirmedBookingsCount);
  const actualBookings = finalTrip.confirmedBookingsCount;
  const atomicityMaintained = actualBookings <= finalTrip.seatCount;

  console.log("🔒 Atomicity Verification:");
  console.log("-".repeat(30));
  console.log(`📊 Expected max bookings: ${expectedMaxBookings}`);
  console.log(`📊 Actual bookings: ${actualBookings}`);
  console.log(
    `🔒 Seat limit respected: ${atomicityMaintained ? "✅ YES" : "❌ NO"}`
  );
  console.log(
    `🎯 Atomicity test: ${atomicityMaintained ? "✅ PASSED" : "❌ FAILED"}`
  );
  console.log("");

  // Show failed attempts
  if (failedBookings.length > 0) {
    console.log("❌ Failed Booking Attempts:");
    console.log("-".repeat(30));
    failedBookings.forEach((attempt) => {
      console.log(`   Attempt ${attempt.index}: ${attempt.timestamp}`);
    });
    console.log("");
  }

  // Show successful attempts
  if (successfulBookings.length > 0) {
    console.log("✅ Successful Booking Attempts:");
    console.log("-".repeat(30));
    successfulBookings.forEach((attempt) => {
      console.log(
        `   Attempt ${attempt.index}: ${attempt.bookingId} at ${attempt.timestamp}`
      );
    });
    console.log("");
  }

  // Performance analysis
  console.log("⚡ Performance Analysis:");
  console.log("-".repeat(30));
  console.log(
    `📊 Requests per second: ${(
      CONCURRENT_REQUESTS /
      (executionTime / 1000)
    ).toFixed(2)}`
  );
  console.log(
    `📊 Average response time: ${(executionTime / CONCURRENT_REQUESTS).toFixed(
      2
    )}ms`
  );
  console.log("");

  // Final verdict
  const testPassed = atomicityMaintained && successfulBookings.length > 0;
  console.log("🏆 Final Verdict:");
  console.log("=".repeat(50));
  console.log(
    `🎯 Race condition test: ${testPassed ? "✅ PASSED" : "❌ FAILED"}`
  );

  if (testPassed) {
    console.log(
      "🎉 The booking system successfully handled concurrent requests while maintaining data integrity!"
    );
  } else {
    console.log(
      "⚠️  The booking system failed to maintain atomicity under concurrent load."
    );
    console.log(
      "   This could lead to overbooking and data corruption in production."
    );
  }

  return testPassed;
};

// Error handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Run simulation if called directly
if (require.main === module) {
  simulateRaceCondition()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Simulation failed:", error);
      process.exit(1);
    });
}

module.exports = { simulateRaceCondition };
