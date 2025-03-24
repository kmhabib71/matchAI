import NextAuth from "next-auth";
import { UserRole } from "@/models/User";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's ID. */
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** Whether the user has admin privileges */
      isAdmin: boolean;
      /** The user's roles */
      roles: string[];
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin?: boolean;
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's ID. */
    id: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
    /** Whether the user has admin privileges */
    isAdmin: boolean;
    /** The user's roles */
    roles: string[];
  }
}
