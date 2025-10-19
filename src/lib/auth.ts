import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// Optional adapter: disabled in demo to avoid DB requirement
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import { prisma } from "./db";
// import bcrypt from 'bcryptjs' // For production password hashing
import { authService } from "./auth-service";

const useDbAdapter = process.env.NEXT_PUBLIC_USE_DB === "true";
const useRealAuth = process.env.NEXT_PUBLIC_USE_REAL_AUTH === "true";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // Only enable Prisma adapter when explicitly requested
  adapter: useDbAdapter
    ? (await import("@next-auth/prisma-adapter")).PrismaAdapter(
        (await import("./db")).prisma
      )
    : undefined,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone_number: { label: "Phone Number", type: "tel" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone_number || !credentials?.password) {
          throw new Error("Phone number and password required");
        }

        if (useRealAuth) {
          // Use real backend API for authentication
          try {
            const response = await authService.login({
              phone_number: credentials.phone_number,
              password: credentials.password,
            });

            if (response.success && response.user) {
              return {
                id: response.user.id,
                email: response.user.email,
                name: response.user.name,
                role: response.user.role || "PARK_ADMIN",
                parkId: response.user.parkId,
                park: response.user.park,
              };
            } else {
              throw new Error(response.error || "Invalid credentials");
            }
          } catch (error) {
            console.error("Real auth error:", error);
            throw new Error("Authentication failed");
          }
        } else {
          // For development/demo - hardcoded users without database
          const demoUsers = [
            {
              id: "user1",
              email: "admin@lekkipark.com",
              name: "Lekki Park Admin",
              role: "PARK_ADMIN",
              parkId: "lekki-phase-1-motor-park",
              park: {
                id: "lekki-phase-1-motor-park",
                name: "Lekki Phase 1 Motor Park",
                address: "Lekki Phase 1, Lagos State",
              },
            },
            {
              id: "user2",
              email: "admin@ikejapark.com",
              name: "Ikeja Park Admin",
              role: "PARK_ADMIN",
              parkId: "ikeja-motor-park",
              park: {
                id: "ikeja-motor-park",
                name: "Ikeja Motor Park",
                address: "Ikeja, Lagos State",
              },
            },
            {
              id: "user3",
              email: "super@movaa.com",
              name: "Super Admin",
              role: "SUPER_ADMIN",
              parkId: undefined,
              park: undefined,
            },
          ];

          // Check if user exists in demo data (using phone for demo)
          const user = demoUsers.find(
            (u) => u.email === credentials.phone_number
          );

          if (!user) {
            throw new Error("Invalid credentials");
          }

          // For demo purposes, accept "password" for all users
          if (credentials.password !== "password") {
            throw new Error("Invalid credentials");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            parkId: user.parkId,
            park: user.park,
          };
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.parkId = user.parkId;
        token.park = user.park;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.parkId = token.parkId;
        session.user.park = token.park;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
};
