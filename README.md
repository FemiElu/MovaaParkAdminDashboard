# Movaa Park Admin Dashboard

A comprehensive park administration system for bus booking management, built with Next.js 14, TypeScript, and PostgreSQL.

## Features

### Core Features (Implemented)

- ✅ **Authentication System**: NextAuth.js with multi-tenant support
- ✅ **Routes Management**: CRUD operations for destinations and pricing
- ✅ **Dashboard Overview**: Key metrics and quick actions

### Features (In Development)

- 🚧 **Driver Management**: Profile management and route qualifications
- 🚧 **Trip Scheduling**: Assign drivers with conflict detection
- 🚧 **Live Passenger Data**: Real-time booking notifications
- 🚧 **Revenue Analytics**: Financial tracking and sharing configuration
- 🚧 **Passenger Messaging**: Communication system

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Heroicons, Custom components

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd movaa-park-admin
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.local` and update the database URL:

   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/movaa_park_admin"
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npm run db:migrate

   # Seed with sample data
   npm run db:seed
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

After seeding the database:

- **Lekki Park Admin**: `admin@lekkipark.com` / `password`
- **Ikeja Park Admin**: `admin@ikejapark.com` / `password`
- **Super Admin**: `super@movaa.com` / `password`

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   └── routes/         # Routes management
├── components/         # React components
│   ├── dashboard/      # Dashboard components
│   └── routes/         # Route management components
├── lib/                # Utility libraries
│   ├── auth.ts         # NextAuth configuration
│   └── db.ts           # Prisma client
└── types/              # TypeScript type definitions
```

## API Endpoints

### Routes Management

- `GET /api/routes?parkId={id}` - Get park routes
- `POST /api/routes` - Create new route
- `PUT /api/routes/{id}` - Update route
- `DELETE /api/routes/{id}` - Delete route

### Authentication

- `POST /api/auth/signin` - User login
- `GET /api/auth/session` - Get session

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:migrate      # Run Prisma migrations
npm run db:seed         # Seed database with sample data
npm run db:studio       # Open Prisma Studio

# Code Quality
npm run lint            # Run ESLint
```

## Multi-tenant Architecture

The application supports multiple parks with data isolation:

- **Login-based identification**: Users access their park data after authentication
- **Row-level security**: Database queries automatically filter by user's parkId
- **Role-based access**: SUPER_ADMIN, PARK_ADMIN, PARK_STAFF permissions

## Planned Integrations

### With Passenger App

- **Webhook endpoints**: Receive booking notifications
- **Real-time sync**: Route configuration changes
- **Payment integration**: Revenue splitting via Paystack

### Real-time Features

- **WebSocket connections**: Live booking updates
- **Push notifications**: Critical alerts
- **Email/SMS**: Backup notification channels

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is proprietary software for Movaa transportation system.
