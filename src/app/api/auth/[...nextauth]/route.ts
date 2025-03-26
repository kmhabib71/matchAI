export const runtime = "nodejs";

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Simplified environment check focusing on Node.js version and runtime
console.log("Node version:", process.version);
console.log("Runtime mode:", process.env.NEXT_RUNTIME);
console.log("Auth route loading...");

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
