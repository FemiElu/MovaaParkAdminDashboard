# Driver Persistence Migration Guide

## Current Issues

### 1. "Driver not found" Error

- **Cause**: Data created on client-side isn't visible to server-side `getDriver()` function
- **Root Cause**: Separate memory spaces between client and server in production

### 2. Data Disappears on Reload

- **Cause**: Data stored in `globalThis.__driversData` (in-memory only)
- **Root Cause**: No persistent storage - data lost on server restart

## Solutions

### Option 1: Quick Fix (Enhanced In-Memory Storage)

**File**: `src/lib/persist-drivers.ts`

This provides better persistence using:

- File-based storage in development
- Enhanced global storage
- localStorage on client-side

**To implement:**

1. Replace imports in your API routes:

```typescript
// In src/app/api/drivers/route.ts
import { createDriverWithPersistence } from "@/lib/persist-drivers";

// Replace createDriver with createDriverWithPersistence
```

2. Update driver detail page:

```typescript
// In src/app/drivers/[id]/page.tsx
import { getDriverWithPersistence } from "@/lib/persist-drivers";

// Replace getDriver with getDriverWithPersistence
```

### Option 2: Database Solution (Recommended)

**Files**:

- `prisma/drivers-schema.sql` - Database schema
- `src/lib/database-drivers.ts` - Database service layer

**To implement:**

1. **Set up database** (choose one):

   ```bash
   # Option A: SQLite (easiest for development)
   npm install sqlite3

   # Option B: PostgreSQL (recommended for production)
   npm install pg @types/pg

   # Option C: MySQL
   npm install mysql2 @types/mysql2
   ```

2. **Create database tables**:

   ```bash
   # Run the SQL schema
   mysql -u username -p database_name < prisma/drivers-schema.sql
   # or
   psql -U username -d database_name -f prisma/drivers-schema.sql
   ```

3. **Update API routes**:

   ```typescript
   // In src/app/api/drivers/route.ts
   import { createDriver, listDrivers } from "@/lib/database-drivers";

   // Replace existing imports with database functions
   ```

4. **Update driver detail page**:

   ```typescript
   // In src/app/drivers/[id]/page.tsx
   import { getDriver } from "@/lib/database-drivers";

   // Replace existing import with database function
   ```

## Step-by-Step Migration

### Step 1: Choose Your Solution

**For immediate fix**: Use Option 1 (Enhanced In-Memory Storage)
**For production**: Use Option 2 (Database Solution)

### Step 2: Update API Routes

**File**: `src/app/api/drivers/route.ts`

```typescript
// Replace this:
import { listDrivers, createDriver } from "@/lib/drivers-store";

// With this (Option 1):
import {
  listDrivers,
  createDriverWithPersistence,
} from "@/lib/persist-drivers";

// Or this (Option 2):
import { listDrivers, createDriver } from "@/lib/database-drivers";
```

### Step 3: Update Driver Detail Page

**File**: `src/app/drivers/[id]/page.tsx`

```typescript
// Replace this:
import { getDriver, listDrivers } from "@/lib/drivers-store";

// With this (Option 1):
import { getDriverWithPersistence, listDrivers } from "@/lib/persist-drivers";

// Or this (Option 2):
import { getDriver, listDrivers } from "@/lib/database-drivers";
```

### Step 4: Update Driver Edit Page

**File**: `src/app/drivers/[id]/edit/page.tsx`

```typescript
// Replace this:
import { listDrivers } from "@/lib/drivers-store";

// With this (Option 1):
import { listDrivers } from "@/lib/persist-drivers";

// Or this (Option 2):
import { listDrivers } from "@/lib/database-drivers";
```

### Step 5: Update Individual Driver API

**File**: `src/app/api/drivers/[id]/route.ts`

```typescript
// Replace this:
import { getDriver, updateDriver, deleteDriver } from "@/lib/drivers-store";

// With this (Option 1):
import {
  getDriverWithPersistence,
  updateDriver,
  deleteDriver,
} from "@/lib/persist-drivers";

// Or this (Option 2):
import { getDriver, updateDriver, deleteDriver } from "@/lib/database-drivers";
```

## Testing the Migration

### Test 1: Create Driver

1. Create a new driver
2. Verify it appears in the drivers list
3. Click on the driver card
4. Verify driver details page loads (no "Driver not found")

### Test 2: Persistence

1. Create a driver
2. Reload the page
3. Verify driver still exists
4. Restart the server
5. Verify driver still exists

### Test 3: Edit Driver

1. Edit a driver's details
2. Save changes
3. Verify changes are reflected
4. Reload page
5. Verify changes persist

## Production Considerations

### Option 1 (Enhanced In-Memory)

- ✅ Quick to implement
- ✅ Works for small-scale applications
- ❌ Data lost on server restart
- ❌ Not suitable for multiple server instances
- ❌ No data backup/recovery

### Option 2 (Database)

- ✅ Persistent storage
- ✅ Scalable to multiple server instances
- ✅ Data backup/recovery
- ✅ ACID transactions
- ✅ Better performance with indexes
- ❌ Requires database setup
- ❌ More complex deployment

## Recommended Approach

1. **Immediate**: Implement Option 1 for quick fix
2. **Short-term**: Plan database migration
3. **Long-term**: Implement Option 2 with proper database

## Environment Variables

For database solution, add to your `.env`:

```env
# Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/movaa_park_admin"

# Or for SQLite
DATABASE_URL="file:./dev.db"

# Or for MySQL
DATABASE_URL="mysql://username:password@localhost:3306/movaa_park_admin"
```

## Monitoring

After migration, monitor:

- Driver creation success rate
- Driver retrieval performance
- Data persistence across restarts
- Error rates in driver operations

## Rollback Plan

If issues occur:

1. Revert API route imports to original `drivers-store`
2. Check for any data loss
3. Investigate and fix issues
4. Re-attempt migration

## Support

If you encounter issues during migration:

1. Check server logs for errors
2. Verify database connection
3. Test with sample data first
4. Consider gradual migration (one endpoint at a time)
