import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { dbFirst, dbRun } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/masuk",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const user = await dbFirst<{
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          city: string | null;
          role: string;
          password_hash: string | null;
        }>(
          `SELECT id, email, name, avatar_url, city, role, password_hash
           FROM users WHERE email = ?`,
          email,
        );

        if (!user?.password_hash) return null;
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name || "Pengguna",
          image: user.avatar_url || undefined,
          role: user.role,
          city: user.city || "Jakarta",
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;
      const email = user.email.toLowerCase();
      const existing = await dbFirst<{ id: string }>("SELECT id FROM users WHERE email = ?", email);
      if (!existing) {
        await dbRun(
          `INSERT INTO users (id, email, name, avatar_url, city, role)
           VALUES (?, ?, ?, ?, ?, 'user')`,
          crypto.randomUUID(),
          email,
          user.name || "Pengguna Google",
          user.image || null,
          "Jakarta",
        );
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.email) {
        const row = await dbFirst<{
          id: string;
          role: string;
          city: string | null;
          name: string | null;
          avatar_url: string | null;
        }>(`SELECT id, role, city, name, avatar_url FROM users WHERE email = ?`, user.email.toLowerCase());
        if (row) {
          token.sub = row.id;
          token.role = row.role;
          token.city = row.city || "Jakarta";
          token.name = row.name || user.name;
          token.picture = row.avatar_url || user.image;
        }
      }

      if (trigger === "update" && session?.city) {
        token.city = session.city;
        if (token.sub) {
          await dbRun(`UPDATE users SET city = ?, updated_at = datetime('now') WHERE id = ?`, session.city, token.sub);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.role = (token.role as string) || "user";
        session.user.city = (token.city as string) || "Jakarta";
      }
      return session;
    },
  },
});
