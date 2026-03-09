import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const DEMO_EMAIL = (process.env.DEMO_ACCOUNT_EMAIL || "demo@memoryportal.com").toLowerCase();

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
        return {
          id: "demo-judge-id",
          name: "Guest",
          email: DEMO_EMAIL,
          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest&backgroundColor=e0f2fe"
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, account }) {
      // Mark the token as demo on initial sign-in via CredentialsProvider
      if (account?.provider === "credentials") {
        token.isDemo = true;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose the isDemo flag to the client session
      (session as any).isDemo = token.isDemo === true;
      return session;
    },
  },
};
