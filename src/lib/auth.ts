import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const adminUsername = getEnv("ADMIN_USERNAME");
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        const passwordPlain = process.env.ADMIN_PASSWORD;

        if (credentials.username !== adminUsername) return null;

        if (passwordHash) {
          const ok = await bcrypt.compare(credentials.password, passwordHash);
          return ok ? { id: "admin", name: "Admin" } : null;
        }

        if (passwordPlain) {
          return credentials.password === passwordPlain
            ? { id: "admin", name: "Admin" }
            : null;
        }

        throw new Error(
          "Set either ADMIN_PASSWORD (plain) or ADMIN_PASSWORD_HASH (bcrypt)."
        );
      },
    }),
  ],
};
