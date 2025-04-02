import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import GoogleProvider from "next-auth/providers/google";
import { AuthOptions, DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
    } & DefaultSession["user"]
  }
}

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
        session.user.email = token.email || "";
        session.user.name = token.name || "";
        session.user.image = token.picture || undefined;
      }
      return session;
    },

    async signIn({ user }) {
      if (!user.email) {
        return false; // Prevent sign-in if email is not available
      }
      // const existingUser = await prisma.user.findUnique({
      //   where: { email: user.email ?? "" },
      // });

      // if (existingUser) {
      //   return false; // Prevent OAuth login for sellers
      // }

      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "",
}; 