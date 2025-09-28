# Create/Edit/Recurring Trips Feature Implementation

## Overview

This document outlines the implementation of the comprehensive "Create/Edit/Recurring Trips" feature for the Movaa Park Admin web app. The feature enables ParkAdmins to create, edit, and manage recurring trips with full business rule enforcement.

## 🎯 Key Features Implemented

### 1. Trip Creation & Management

- ✅ **CreateEditTripModal**: Comprehensive modal with all required fields
- ✅ **Recurring Trips**: Daily, Weekdays, and Custom recurrence patterns
- ✅ **Trip Publishing**: Draft vs Published status with immediate visibility
- ✅ **Enhanced Trip Cards**: Seat availability badges, edit actions, driver assignment

### 2. Business Rules Enforcement

- ✅ **Seat Constraints**: `seatCount <= vehicle.seatCount` validation
- ✅ **Price Protection**: Cannot retroactively change prices for confirmed bookings
- ✅ **Driver Conflicts**: Automatic conflict detection for same-day assignments
- ✅ **Recurrence Horizon**: 90-day generation with automatic extension

### 3. Booking System

- ✅ **Atomic Seat Allocation**: 5-minute hold system with automatic release
- ✅ **Race Condition Handling**: Server-side locks prevent double-booking
- ✅ **Payment Simulation**: Paystack webhook simulation for payment confirmation

### 4. Driver Management

- ✅ **Conflict Detection**: Prevents driver double-assignment on same day
- ✅ **Visibility Rules**: Driver details visible 5 hours before departure
- ✅ **Assignment Modal**: Interactive driver selection with availability check

### 5. Audit & Compliance

- ✅ **Comprehensive Logging**: All operations logged with timestamps and actors
- ✅ **PII Access Tracking**: Driver contact access logged for compliance
- ✅ **Override Tracking**: All admin overrides logged with reasons

## 🏗️ Architecture

### Frontend Components

```
src/components/trips/
├── create-edit-trip-modal.tsx    # Main trip creation/editing modal
├── enhanced-trip-card.tsx        # Trip cards with seat badges and actions
├── trips-page-client.tsx         # Updated trips page with create functionality
└── assign-driver-modal.tsx       # Driver assignment with conflict detection
```

### Backend API Endpoints

```
src/app/api/
├── trips/
│   ├── route.ts                  # GET/POST trips
│   ├── [tripId]/
│   │   ├── route.ts              # GET/PUT/DELETE specific trip
│   │   ├── publish/route.ts      # POST publish trip
│   │   ├── assign-driver/route.ts # POST assign driver
│   │   └── check-payment/route.ts # POST confirm payment
├── bookings/route.ts             # POST create booking with hold
└── parks/[parkId]/trips/route.ts # GET public trips with metadata
```

### Data Models

```typescript
// Enhanced Trip model
interface Trip {
  id: string;
  parkId: string;
  routeId: string;
  date: string;
  unitTime: string;
  vehicleId: string;
  seatCount: number;
  confirmedBookingsCount: number;
  price: number;
  status: "draft" | "published" | "live" | "completed" | "cancelled";
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  parentTripId?: string;
  driverId?: string;
  driverPhone?: string;
  // ... other fields
}

// Recurrence patterns
interface RecurrencePattern {
  type: "daily" | "weekdays" | "custom";
  interval?: number;
  daysOfWeek?: number[];
  endDate?: string;
  exceptions?: string[];
}
```

## 🚀 Usage Guide

### Creating a Trip

1. **Navigate to Trips Page**: Click "Schedule New Trip" button
2. **Fill Trip Details**:
   - Select route (auto-populates price)
   - Choose date and time (default 06:00)
   - Select vehicle (auto-sets seat count)
   - Set price and optional driver
3. **Configure Recurrence** (Optional):
   - Toggle "Make this a recurring trip"
   - Choose pattern: Daily, Weekdays, or Custom
   - Set end date or leave for indefinite
   - Preview next 7 occurrences
4. **Publish Status**: Choose Draft or Published
5. **Save**: Creates single trip or entire recurring series

### Editing Trips

1. **Click Edit Button**: On any trip card
2. **Modify Fields**: Change any editable properties
3. **Recurrence Options**: For recurring trips, choose scope:
   - **This occurrence only**
   - **All future occurrences**
   - **Entire series**
4. **Validation**: System prevents invalid changes (e.g., reducing seats below confirmed bookings)

### Driver Assignment

1. **Click "Assign Driver"**: On trip cards without drivers
2. **Conflict Detection**: System shows available drivers and highlights conflicts
3. **Select Driver**: Choose from available drivers with ratings
4. **Confirmation**: Driver assigned with audit log entry

## 🔒 Business Rules Implementation

### Seat Management

```typescript
// Seat count validation
if (tripData.seatCount > vehicle.seatCount) {
  return { success: false, error: "Seat count cannot exceed vehicle capacity" };
}

// Reduction protection
if (updates.seatCount < trip.confirmedBookingsCount) {
  return {
    success: false,
    error: "Cannot reduce seats below confirmed bookings",
  };
}
```

### Price Protection

```typescript
// Price change validation
if (updates.price !== trip.price && trip.confirmedBookingsCount > 0) {
  return {
    success: false,
    error: "Cannot change price for trips with confirmed bookings",
  };
}
```

### Driver Conflict Detection

```typescript
// Check for same-day conflicts
const conflictingTrips = trips.filter(
  (t) =>
    t.driverId === driverId &&
    t.date === trip.date &&
    t.id !== tripId &&
    (t.status === "published" || t.status === "live")
);
```

### Atomic Booking

```typescript
// 5-minute seat hold
const holdToken = `hold_${Date.now()}_${Math.random()
  .toString(36)
  .substring(2, 8)}`;
const holdExpiresAt = Date.now() + 5 * 60 * 1000;

// Automatic release
setTimeout(() => {
  this.releaseSeatHold(booking.id);
}, 5 * 60 * 1000);
```

## 🧪 Testing

### Race Condition Test

Run the booking race simulation:

```bash
node scripts/simulateBookingRace.js
```

This script:

- Attempts to book the last available seat simultaneously
- Demonstrates atomic seat allocation
- Shows 5-minute hold system
- Simulates payment confirmation

Expected result: 1 success, 1 conflict (SLOT_TAKEN)

### Manual Testing Scenarios

1. **Create Recurring Trip**:

   - Create daily recurring trip for next 30 days
   - Verify 30 trip instances created
   - Check recurrence preview shows correctly

2. **Driver Conflict**:

   - Assign same driver to two trips on same day
   - Verify second assignment fails with conflict error

3. **Seat Reduction**:

   - Try to reduce seats below confirmed bookings
   - Verify system prevents invalid reduction

4. **Price Change**:
   - Try to change price on trip with confirmed bookings
   - Verify system prevents retroactive price changes

## 📊 API Examples

### Create Trip

```bash
POST /api/trips
{
  "parkId": "lekki-phase-1-motor-park",
  "routeId": "r_lekki_1",
  "date": "2025-01-15",
  "unitTime": "06:00",
  "vehicleId": "vehicle_1",
  "seatCount": 18,
  "price": 2000,
  "driverId": "driver_1",
  "isRecurring": true,
  "recurrencePattern": {
    "type": "daily",
    "endDate": "2025-02-15"
  },
  "status": "published"
}
```

### Create Booking with Hold

```bash
POST /api/bookings
{
  "tripId": "trip_2025-01-15_r_lekki_1",
  "passengerName": "John Doe",
  "passengerPhone": "+2348012345678",
  "nokName": "Jane Doe",
  "nokPhone": "+2348012345679",
  "nokAddress": "123 Main St",
  "amount": 2000
}
```

### Confirm Payment

```bash
POST /api/trips/trip_2025-01-15_r_lekki_1/check-payment
{
  "bookingId": "booking_1234567890_abc123"
}
```

## 🎨 UI/UX Highlights

### Seat Availability Badges

- **Green**: Many seats available
- **Orange**: Few seats left (≤3)
- **Red**: Full (0 seats)

### Recurrence Preview

- Shows next 7 occurrences
- Handles exceptions and custom patterns
- Updates in real-time as settings change

### Status Indicators

- **Draft**: Gray badge, not visible to passengers
- **Published**: Green badge, visible to passengers
- **Live**: Blue badge, actively running

### Driver Visibility

- Shows driver details only when appropriate
- Displays rating and contact info
- Indicates when details will become available

## 🔧 Configuration

### Recurrence Horizon

```typescript
// Configurable in trips-store.ts
const RECURRENCE_HORIZON_DAYS = 90;
```

### Seat Hold Duration

```typescript
// Configurable in booking creation
const HOLD_DURATION_MINUTES = 5;
```

### Driver Visibility Window

```typescript
// Driver details visible 5 hours before departure
const DRIVER_VISIBILITY_HOURS = 5;
```

## 🚀 Future Enhancements

1. **Advanced Recurrence**: Weekly, monthly patterns
2. **Trip Templates**: Save and reuse common trip configurations
3. **Bulk Operations**: Edit multiple trips simultaneously
4. **Analytics Dashboard**: Trip performance metrics
5. **Mobile Optimization**: Enhanced mobile trip management
6. **Real-time Updates**: WebSocket integration for live updates

## 📝 Notes

- All operations are fully audited for compliance
- PII access is logged for driver contact visibility
- System handles edge cases gracefully with clear error messages
- Mock data includes realistic Nigerian context (names, locations, prices)
- Race condition testing demonstrates atomic booking system
- UI follows Movaa Park Admin design system with green/white theme

## ✅ Acceptance Criteria Met

1. ✅ ParkAdmin can create trips with all required fields
2. ✅ Recurring series creates 90-day horizon with extension
3. ✅ Publish action makes trips discoverable publicly
4. ✅ Booking atomicity prevents double-booking
5. ✅ Driver conflict detection prevents scheduling conflicts
6. ✅ Driver details visible 5 hours before departure
7. ✅ Seat reduction blocked without override
8. ✅ Price edits don't affect confirmed bookings
9. ✅ Comprehensive audit logging for all operations
10. ✅ Enhanced UI with seat badges and intuitive controls

The implementation fully satisfies all specified business rules and technical requirements while providing an excellent user experience for ParkAdmins managing their trip schedules.


