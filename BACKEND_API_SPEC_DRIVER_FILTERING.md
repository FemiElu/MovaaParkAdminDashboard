# Backend API Specification: Driver Data Isolation Fix

## Critical Security Issue

**Problem**: The `/driver/` API endpoint currently returns ALL drivers from the database regardless of which park/terminal the authenticated admin user belongs to. This causes **complete data leakage** where Admin A can see drivers belonging to Admin B's terminal.

**Security Impact**: HIGH - Complete breach of data isolation between different park administrators

**Required Action**: Implement server-side filtering to return only drivers belonging to the authenticated user's terminal/park.

---

## Current API Behavior (BROKEN)

### Endpoint: `GET /api/v1/driver/`

**Current Response** (Returns ALL drivers):
```json
{
  "message": "Success",
  "data": [
    {
      "user": {
        "id": "user-123",
        "first_name": "John",
        "last_name": "Doe",
        "phone_number": "+2348012345678",
        "email": "john@example.com",
        "is_active": true,
        "avatar": "...",
        "user_type": ["DRIVER"]
      },
      "date_of_birth": "1990-01-01",
      "address": "Lagos",
      "plate_number": "ABC-123",
      "is_licence_verified": true
    },
    // Returns drivers from Terminal A, B, C, etc. (ALL terminals)
  ],
  "errors": null
}
```

**Current Problem**:
- Admin from Terminal A logs in
- API returns drivers from Terminal A, B, C, D... (all terminals in database)
- Admin A sees drivers from other terminals ❌

---

## Required API Changes

### Change 1: Filter by Authenticated User's Terminal (CRITICAL)

**Requirement**: The API MUST filter drivers to return only those belonging to the authenticated user's terminal/park.

#### Pseudo-code Implementation:

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_drivers(request):
    """
    Get all drivers belonging to the authenticated admin's terminal/park
    """
    # Get the authenticated user's terminal/park ID
    user = request.user
    
    # Assuming your user model has a terminal or park relationship
    user_terminal_id = user.terminal_id  # or user.park.id or user.terminal.id
    
    if not user_terminal_id:
        return Response({
            "message": "Error",
            "data": [],
            "errors": ["User has no associated terminal"]
        }, status=400)
    
    # FILTER drivers by terminal
    drivers = Driver.objects.filter(terminal_id=user_terminal_id)  # ← KEY CHANGE
    
    # Or if relationship is through user:
    # drivers = Driver.objects.filter(user__terminal_id=user_terminal_id)
    
    serializer = DriverSerializer(drivers, many=True)
    
    return Response({
        "message": "Success",
        "data": serializer.data,
        "errors": None
    })
```

#### Key Points:
1. **Extract terminal ID** from authenticated user (`request.user`)
2. **Filter queryset** by `terminal_id` or `park_id`
3. **Return only matched drivers**
4. **Handle edge cases** (user with no terminal, etc.)

---

### Change 2: Add Terminal ID to Response (RECOMMENDED)

**Requirement**: Include terminal/park identification in the driver response for additional frontend validation.

**Updated Response Structure**:
```json
{
  "message": "Success",
  "data": [
    {
      "user": {
        "id": "user-123",
        "first_name": "John",
        "last_name": "Doe",
        "phone_number": "+2348012345678",
        "email": "john@example.com",
        "is_active": true,
        "avatar": "...",
        "user_type": ["DRIVER"],
        "terminal": {                    // ← ADD THIS
          "id": "terminal-456",
          "name": "Berger Motor Park"
        }
        // OR as flat fields:
        // "terminal_id": "terminal-456",
        // "park_id": "park-789"
      },
      "date_of_birth": "1990-01-01",
      "address": "Lagos",
      "plate_number": "ABC-123",
      "is_licence_verified": true,
      "terminal_id": "terminal-456"      // ← ADD THIS (preferred location)
    }
  ],
  "errors": null
}
```

#### Implementation:

```python
class DriverSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    terminal_id = serializers.CharField(source='terminal.id', read_only=True)  # ← ADD
    
    class Meta:
        model = Driver
        fields = [
            'user', 
            'date_of_birth', 
            'address', 
            'plate_number', 
            'is_licence_verified',
            'terminal_id'  # ← ADD THIS FIELD
        ]
```

**Benefits**:
- Frontend can double-validate data belongs to correct terminal
- Debugging easier (can see which terminal each driver belongs to)
- Defense-in-depth security

---

## Database Schema Requirements

### Verify Your Schema Has Terminal Association

The Driver model MUST have a relationship to Terminal/Park. Check your models:

**Option A: Terminal linked to User**
```python
class User(AbstractUser):
    terminal = models.ForeignKey(Terminal, on_delete=CASCADE, null=True)
    # or
    park = models.ForeignKey(Park, on_delete=CASCADE, null=True)

class Driver(models.Model):
    user = models.OneToOneField(User, on_delete=CASCADE)
    # terminal is accessed via user.terminal
```

**Option B: Terminal linked to Driver**
```python
class Driver(models.Model):
    user = models.OneToOneField(User, on_delete=CASCADE)
    terminal = models.ForeignKey(Terminal, on_delete=CASCADE)  # Direct link
    # ...
```

**Option C: No Terminal Link (NEEDS MIGRATION)**
If your models don't have terminal association, you need to:
1. Add terminal/park foreign key to User or Driver model
2. Create and run migration
3. Populate existing records with correct terminal associations

---

## Testing Requirements

### Test Case 1: Basic Filtering

**Setup**:
- Create Terminal A with Admin User A
- Create Terminal B with Admin User B
- Create 3 drivers in Terminal A
- Create 2 drivers in Terminal B

**Test**:
1. Login as Admin User A
2. Call `GET /api/v1/driver/`
3. **Expected**: Returns only 3 drivers (Terminal A's drivers)
4. Login as Admin User B  
5. Call `GET /api/v1/driver/`
6. **Expected**: Returns only 2 drivers (Terminal B's drivers)

**Failure**: If Admin A sees any of Terminal B's drivers (or vice versa)

### Test Case 2: New Account Isolation

**Setup**:
- Login as Admin User A
- Create 5 drivers
- Logout

**Test**:
1. Create new Admin User C (different terminal)
2. Login as Admin User C
3. Call `GET /api/v1/driver/`
4. **Expected**: Returns empty array `[]` (no drivers yet)

**Failure**: If Admin C sees any drivers from User A

### Test Case 3: Authentication Required

**Test**:
1. Call `GET /api/v1/driver/` without authentication token
2. **Expected**: 401 Unauthorized or 403 Forbidden

### Test Case 4: User Without Terminal

**Test**:
1. Create admin user with no terminal association
2. Login and call `GET /api/v1/driver/`
3. **Expected**: Appropriate error message (400 or 403) stating user has no terminal

---

## API Contract

### Request

```http
GET /api/v1/driver/ HTTP/1.1
Host: your-backend.com
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Headers**:
- `Authorization: Bearer <token>` - REQUIRED

**Query Parameters**: None needed (filter by authenticated user's terminal automatically)

### Response (Success)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Success",
  "data": [
    {
      "user": {
        "id": "string",
        "first_name": "string",
        "last_name": "string",
        "phone_number": "string",
        "email": "string",
        "is_active": boolean,
        "avatar": "string",
        "user_type": ["DRIVER"],
        "terminal": {
          "id": "string",
          "name": "string"
        }
      },
      "date_of_birth": "YYYY-MM-DD",
      "address": "string",
      "plate_number": "string",
      "is_licence_verified": boolean,
      "terminal_id": "string"  // ← NEW FIELD
    }
  ],
  "errors": null
}
```

### Response (Error - No Terminal)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "message": "Error",
  "data": [],
  "errors": ["User has no associated terminal"]
}
```

### Response (Unauthorized)

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "message": "Authentication required",
  "data": null,
  "errors": ["Invalid or missing authentication token"]
}
```

---

## Migration Checklist

- [ ] Verify terminal/park relationship exists in User or Driver model
- [ ] If missing, create migration to add terminal foreign key
- [ ] Populate existing driver records with correct terminal associations
- [ ] Update `GET /api/v1/driver/` endpoint to filter by authenticated user's terminal
- [ ] Add `terminal_id` field to DriverSerializer
- [ ] Write unit tests for filtering logic
- [ ] Test with multiple accounts in different terminals
- [ ] Deploy to staging and verify with frontend team
- [ ] Deploy to production

---

## Frontend Compatibility

**Good News**: The frontend is already prepared for this change!

Once you implement backend filtering:
1. Frontend will receive only relevant drivers ✓
2. Frontend has additional client-side validation ready (defense-in-depth) ✓
3. No frontend code changes required ✓
4. Terminal-scoped localStorage already implemented ✓

The frontend developer has prepared the code to:
- Accept terminal_id in the driver response
- Log validation warnings if drivers from other terminals are detected
- Activate additional filtering if needed (commented code ready to uncomment)

---

## Priority Level

**CRITICAL** - This is a data leak security vulnerability

**Timeline**: Should be fixed ASAP before production use

**Impact if not fixed**: 
- ❌ Complete data breach between park admins
- ❌ Admin A can see/manage drivers from Admin B's terminal
- ❌ Potential for data corruption if admins modify wrong drivers
- ❌ Compliance/privacy issues

---

## Questions for Backend Team

Please answer these to help with implementation:

1. **What is your User-Terminal relationship?**
   - [ ] User has `terminal` foreign key
   - [ ] User has `park` foreign key
   - [ ] Driver has direct `terminal` foreign key
   - [ ] Other (please describe): ___________

2. **Do existing driver records have terminal associations?**
   - [ ] Yes, all drivers are linked to terminals
   - [ ] No, need to run data migration
   - [ ] Some drivers have it, some don't

3. **What field name should we use in the response?**
   - [ ] `terminal_id`
   - [ ] `park_id`
   - [ ] Both
   - [ ] Other: ___________

4. **Estimated time to implement?**
   - _____ hours/days

---

## Contact

For questions or clarification, contact:
- **Frontend Team**: [Your Contact]
- **Issue**: Driver Data Isolation - CRITICAL SECURITY

---

## Appendix: Example Django Implementation

```python
# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_drivers(request):
    """
    Get all drivers for the authenticated admin's terminal
    Ensures data isolation between different park administrators
    """
    user = request.user
    
    # Get terminal ID from user
    # Adjust this based on your actual model structure
    terminal_id = None
    if hasattr(user, 'terminal') and user.terminal:
        terminal_id = user.terminal.id
    elif hasattr(user, 'park') and user.park:
        terminal_id = user.park.id
    
    if not terminal_id:
        return Response({
            "message": "Error",
            "data": [],
            "errors": ["User is not associated with any terminal"]
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Filter drivers by terminal
    # Option 1: If terminal is on Driver model
    drivers = Driver.objects.filter(terminal_id=terminal_id)
    
    # Option 2: If terminal is on User model  
    # drivers = Driver.objects.filter(user__terminal_id=terminal_id)
    
    # Serialize and return
    serializer = DriverSerializer(drivers, many=True)
    
    return Response({
        "message": "Success",
        "data": serializer.data,
        "errors": None
    }, status=status.HTTP_200_OK)


# serializers.py
class DriverSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    # Add terminal_id to response
    terminal_id = serializers.SerializerMethodField()
    
    def get_terminal_id(self, obj):
        """Get terminal ID from driver or user"""
        if hasattr(obj, 'terminal') and obj.terminal:
            return str(obj.terminal.id)
        elif hasattr(obj.user, 'terminal') and obj.user.terminal:
            return str(obj.user.terminal.id)
        return None
    
    class Meta:
        model = Driver
        fields = [
            'user',
            'date_of_birth',
            'address',
            'plate_number',
            'is_licence_verified',
            'terminal_id'  # Added field
        ]
```

---

**End of Specification**

Please implement these changes and notify the frontend team when completed for integrated testing.
