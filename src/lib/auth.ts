import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import { prisma } from "./db";
// import bcrypt from 'bcryptjs' // For production password hashing

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

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

        // Check if user exists in demo data
        const user = demoUsers.find((u) => u.email === credentials.email);

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
