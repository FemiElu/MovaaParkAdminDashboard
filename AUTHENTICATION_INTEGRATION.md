# Authentication Integration Guide

This document outlines the authentication system integration for the Movaa Park Admin application, including both mock and real backend API implementations.

## Overview

The application supports two authentication modes:

1. **Mock Mode** (Default): Uses hardcoded demo users for development/testing
2. **Real API Mode**: Integrates with actual backend authentication APIs

## Current Implementation

### Mock Authentication (Default)

- **Location**: `src/lib/auth.ts`
- **Users**: 3 hardcoded demo users
- **Password**: All users use "password"
- **Session**: JWT-based with NextAuth.js

### Real API Authentication

- **Service Layer**: `src/lib/auth-service.ts`
- **Configuration**: Environment variable controlled
- **Features**: Full CRUD operations for user management

## Environment Configuration

Create a `.env.local` file with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1/api/v1
API_BASE_URL=http://127.0.0.1/api/v1

# Feature Flags
NEXT_PUBLIC_USE_DB=false
NEXT_PUBLIC_USE_REAL_AUTH=false

# Database Configuration (if using Prisma adapter)
DATABASE_URL="postgresql://username:password@localhost:5432/movaa_park_admin"
```

## Switching Between Modes

### Enable Mock Mode (Default)

```env
NEXT_PUBLIC_USE_REAL_AUTH=false
```

### Enable Real API Mode

```env
NEXT_PUBLIC_USE_REAL_AUTH=true
NEXT_PUBLIC_API_BASE_URL=http://your-backend-api.com/api
```

## Required Backend API Endpoints

When using real API mode, your backend must implement these endpoints:

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### User Management Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password
- `GET /api/parks` - List available parks

## API Request/Response Formats

### Login Request

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Login Response

```json
{
  "success": true,
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PARK_ADMIN",
    "parkId": "park123",
    "park": {
      "id": "park123",
      "name": "Lekki Phase 1 Motor Park",
      "address": "Lekki Phase 1, Lagos State"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here"
}
```

### Signup Request

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "role": "PARK_ADMIN",
  "parkId": "park123"
}
```

### Parks Response

```json
{
  "success": true,
  "data": [
    {
      "id": "park123",
      "name": "Lekki Phase 1 Motor Park",
      "address": "Lekki Phase 1, Lagos State"
    }
  ]
}
```

## User Roles

### PARK_ADMIN

- Access to specific park data only
- Requires `parkId` and `park` object
- Can manage drivers, trips, and bookings for their park

### SUPER_ADMIN

- System-wide access
- No park restrictions
- Can manage all parks and users

## Frontend Components

### Login Page

- **Location**: `src/app/auth/login/page.tsx`
- **Features**: Email/password form, error handling, role validation
- **Integration**: Supports both mock and real API modes

### Signup Page

- **Location**: `src/app/auth/signup/page.tsx`
- **Features**: User registration, park selection, role assignment
- **Integration**: Real API mode only

### User Profile Component

- **Location**: `src/components/auth/user-profile.tsx`
- **Features**: Profile display, password change, logout
- **Integration**: Real API mode only

## Security Considerations

### Token Management

- JWT tokens stored in localStorage (client-side)
- Refresh tokens for automatic token renewal
- Automatic token cleanup on logout

### Password Security

- Minimum 8 characters required
- Password confirmation on signup
- Secure password change flow

### Role-Based Access Control

- Server-side session validation
- Park-specific data access restrictions
- API endpoint authorization checks

## Error Handling

### Client-Side

- Form validation with Zod schemas
- User-friendly error messages
- Loading states for async operations

### Server-Side

- HTTP status codes
- Detailed error messages
- Graceful fallbacks

## Testing

### Mock Mode Testing

Use the hardcoded demo users:

- `admin@lekkipark.com` / `password` (Lekki Park Admin)
- `admin@ikejapark.com` / `password` (Ikeja Park Admin)
- `super@movaa.com` / `password` (Super Admin)

### Real API Testing

1. Set `NEXT_PUBLIC_USE_REAL_AUTH=true`
2. Configure backend API URL
3. Test with real user accounts

## Migration Strategy

### Phase 1: Parallel Implementation

- Keep mock authentication as default
- Add real API integration alongside
- Use environment flags to switch modes

### Phase 2: Gradual Migration

- Test real API integration thoroughly
- Migrate user accounts to backend
- Update documentation and training

### Phase 3: Full Migration

- Remove mock authentication
- Clean up unused code
- Optimize for production

## Troubleshooting

### Common Issues

1. **Authentication Fails in Real API Mode**

   - Check API base URL configuration
   - Verify backend endpoints are running
   - Check network connectivity

2. **Session Not Persisting**

   - Verify NEXTAUTH_SECRET is set
   - Check browser localStorage
   - Clear cookies and try again

3. **Role-Based Access Issues**
   - Verify user role in session
   - Check parkId assignment
   - Review API authorization logic

### Debug Mode

Enable debug logging by setting:

```env
NEXTAUTH_DEBUG=true
```

## Future Enhancements

### Planned Features

- OAuth integration (Google, Microsoft)
- Multi-factor authentication
- Password reset functionality
- User account management
- Audit logging for auth events

### Security Improvements

- CSRF protection
- Rate limiting
- Session timeout
- Secure cookie settings
