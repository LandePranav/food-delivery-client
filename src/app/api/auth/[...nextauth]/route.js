import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async signIn({ user }) {
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
