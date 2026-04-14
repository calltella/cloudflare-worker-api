// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { getUserFromDb } from "@/lib/utils/auth";
import { getRequestMeta } from "@/lib/auth.server";
import type { UserRole } from "@/types/user";
import type { User, NewLoginHistory } from "@/db/schema/users";
const isProduction = process.env.NODE_ENV === "production";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        // ユーザー認証
        const user = await getUserFromDb(email, password);

        if (!user) {
          // No user found, so this is their first attempt to login
          // Optionally, this is also the place you could do a user registration
          return null;
        }

        try {
          await getRequestMeta(user);
        } catch (error) {
          console.error("Failed to save login history:", error);
        }
        // return user object with their profile data
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role ?? undefined,
          avatarUrl: user.avatarUrl ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.avatarUrl = (user as { avatarUrl?: string }).avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.avatarUrl = token.avatarUrl as string | undefined;
      return session;
    },
  },
  trustHost: true, // hostを信用する
});
