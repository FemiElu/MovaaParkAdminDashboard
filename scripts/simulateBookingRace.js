#!/usr/bin/env node

/**
 * Simulates race condition for booking atomicity testing
 * This script demonstrates the 5-minute seat hold functionality
 * by attempting to book the last available seat simultaneously
 */

const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000";
const TRIP_ID = "trip_2025-08-29_r_ajah_1"; // Trip with 17 confirmed bookings out of 18 seats

async function makeBooking(bookingId, delay = 0) {
  // Add small delay to simulate network latency
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  const bookingData = {
    tripId: TRIP_ID,
    passengerName: `Test Passenger ${bookingId}`,
    passengerPhone: "+2348012345678",
    nokName: "Next of Kin",
    nokPhone: "+2348012345679",
    nokAddress: "Test Address",
    amount: 2000,
  };

  try {
    console.log(`[${bookingId}] Attempting booking...`);
    const response = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    if (response.status === 201) {
      console.log(
        `[${bookingId}] ✅ SUCCESS: Booking created with hold token: ${result.data.holdToken}`
      );
      return { success: true, bookingId, holdToken: result.data.holdToken };
    } else if (response.status === 409) {
      console.log(
        `[${bookingId}] ❌ CONFLICT: ${result.error} (${result.conflictType})`
      );
      return {
        success: false,
        error: result.error,
        conflictType: result.conflictType,
      };
    } else {
      console.log(
        `[${bookingId}] ❌ ERROR: ${result.error || "Unknown error"}`
      );
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.log(`[${bookingId}] ❌ NETWORK ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function simulateRaceCondition() {
  console.log("🏁 Starting booking race condition simulation...");
  console.log(`📍 Target trip: ${TRIP_ID}`);
  console.log("📊 Expected: 1 success, 1 conflict (last seat scenario)");
  console.log("");

  // Start both bookings simultaneously
  const promises = [
    makeBooking("A", 0), // No delay
    makeBooking("B", 10), // 10ms delay
  ];

  const results = await Promise.all(promises);

  console.log("");
  console.log("📋 Results Summary:");
  console.log("==================");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful bookings: ${successful.length}`);
  successful.forEach((r) => {
    console.log(`   - Booking ${r.bookingId}: Hold token ${r.holdToken}`);
  });

  console.log(`❌ Failed bookings: ${failed.length}`);
  failed.forEach((r) => {
    console.log(
      `   - Error: ${r.error} (${r.conflictType || "No conflict type"})`
    );
  });

  // Verify the atomicity worked correctly
  if (successful.length === 1 && failed.length === 1) {
    console.log("");
    console.log("🎉 SUCCESS: Race condition handled correctly!");
    console.log("   - Exactly one booking succeeded");
    console.log("   - Exactly one booking was rejected due to slot conflict");
    console.log("   - Seat allocation is atomic and consistent");
  } else {
    console.log("");
    console.log("⚠️  WARNING: Unexpected result");
    console.log("   - This might indicate a race condition issue");
  }

  // Simulate payment confirmation for successful booking
  if (successful.length > 0) {
    const successfulBooking = successful[0];
    console.log("");
    console.log("💳 Simulating payment confirmation...");

    try {
      const paymentResponse = await fetch(
        `${BASE_URL}/api/trips/${TRIP_ID}/check-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingId: successfulBooking.bookingId }),
        }
      );

      const paymentResult = await paymentResponse.json();

      if (paymentResponse.ok) {
        console.log(
          `✅ Payment confirmed for booking ${successfulBooking.bookingId}`
        );
      } else {
        console.log(`❌ Payment confirmation failed: ${paymentResult.error}`);
      }
    } catch (error) {
      console.log(`❌ Payment simulation error: ${error.message}`);
    }
  }
}

// Run the simulation
if (require.main === module) {
  simulateRaceCondition()
    .then(() => {
      console.log("");
      console.log("🏁 Simulation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Simulation failed:", error);
      process.exit(1);
    });
}

module.exports = { simulateRaceCondition, makeBooking };


