// Test script to verify trips store functionality
// Run with: node scripts/test-trips-store.js

const { tripsStore } = require("../src/lib/trips-store.ts");

console.log("🚌 Testing Trips Store...\n");

// Test 1: Get all trips
console.log("1. Getting all trips:");
const allTrips = tripsStore.getTrips();
console.log(`   Found ${allTrips.length} trips`);

// Test 2: Get trips for a specific park
console.log("\n2. Getting trips for lekki-phase-1-motor-park:");
const lekkiTrips = tripsStore.getTrips("lekki-phase-1-motor-park");
console.log(`   Found ${lekkiTrips.length} trips`);

// Test 3: Get trips for today
const today = new Date().toISOString().split("T")[0];
console.log(`\n3. Getting trips for today (${today}):`);
const todayTrips = tripsStore.getTrips(undefined, today);
console.log(`   Found ${todayTrips.length} trips`);

// Test 4: Get vehicles
console.log("\n4. Getting vehicles:");
const vehicles = tripsStore.getVehicles();
console.log(`   Found ${vehicles.length} vehicles`);

// Test 5: Get drivers
console.log("\n5. Getting drivers for lekki-phase-1-motor-park:");
const drivers = tripsStore.getDrivers("lekki-phase-1-motor-park");
console.log(`   Found ${drivers.length} drivers`);

// Test 6: Get bookings for a specific trip
if (allTrips.length > 0) {
  const firstTrip = allTrips[0];
  console.log(`\n6. Getting bookings for trip ${firstTrip.id}:`);
  const bookings = tripsStore.getBookings(firstTrip.id);
  console.log(`   Found ${bookings.length} bookings`);
}

// Test 7: Get unassigned parcels
console.log("\n7. Getting unassigned parcels:");
const unassignedParcels = tripsStore.getParcels();
console.log(`   Found ${unassignedParcels.length} unassigned parcels`);

// Test 8: Get audit logs
console.log("\n8. Getting audit logs:");
const auditLogs = tripsStore.getAuditLogs();
console.log(`   Found ${auditLogs.length} audit log entries`);

console.log("\n✅ Trips store test completed successfully!");
