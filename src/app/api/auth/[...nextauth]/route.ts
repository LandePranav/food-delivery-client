import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";

// Create a Prisma client without extensions for the adapter
const prismaBase = new PrismaClient();
// Create an extended client for our own queries
const prisma = new PrismaClient().$extends(withAccelerate());

interface SessionCallbackParams {
  session: Session;
  token: JWT;
}

interface SignInCallbackParams {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

// Extend the Session type to include user ID
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prismaBase),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }: SessionCallbackParams) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    async signIn({ user }: SignInCallbackParams) {
      if (!user.email) {
        return false; // Prevent sign-in if email is not available
      }
      const existingSeller = await prisma.seller.findUnique({
        where: { email: user.email },
      });

      if (existingSeller) {
        return false; // Prevent OAuth login for sellers
      }

      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
