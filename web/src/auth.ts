import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { database } from "@/db";
import { users, accounts } from "@/db/schema";
import { mergeGuestIdentity } from "@/lib/merge-guest";
import { guestId } from "@/lib/guest";

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: DrizzleAdapter(database(), {
    usersTable: users,
    accountsTable: accounts,
  }),
  session: { strategy: "jwt" },
  providers: [Google],
  pages: { signIn: "/masuk", error: "/masuk" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      const guest = await guestId();
      if (!guest) return;
      await mergeGuestIdentity(user.id, guest);
    },
  },
}));
