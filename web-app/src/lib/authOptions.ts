import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Guest",
      credentials: {},
      async authorize() {
        // Instantly log in as the pre-configured judge account
        // We use the same email as the primary account so the demo data shows up
        const demoEmail = process.env.DEMO_ACCOUNT_EMAIL || "srathnagiriswaran@gmail.com";
        return {
          id: "demo-judge-id",
          name: "Guest",
          email: demoEmail,
          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest&backgroundColor=e0f2fe"
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
};
