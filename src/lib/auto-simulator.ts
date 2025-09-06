// Auto-start simulation for demo purposes
import { bookingSimulator } from "./live-bookings";

// Auto-start simulation in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Start simulation after a short delay
  setTimeout(() => {
    bookingSimulator.start();
    console.log("🎬 Auto-simulation started for demo");
  }, 2000);
}



