import NextAuth from "next-auth";
// Import the centralized authOptions
import { authOptions } from "@/lib/auth";

// Create the handler by passing the imported options
const handler = NextAuth(authOptions);

// Export the handler for GET and POST requests as required
export { handler as GET, handler as POST };