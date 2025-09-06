import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      parkId?: string;
      park?: {
        id: string;
        name: string;
        address: string;
      };
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    parkId?: string;
    park?: {
      id: string;
      name: string;
      address: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    parkId?: string;
    park?: {
      id: string;
      name: string;
      address: string;
    };
  }
}
