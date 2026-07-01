import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

function apiBaseUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000"
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        oauth_token: { label: "OAuth Token", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.oauth_token) {
          try {
            const res = await axios.get(`${apiBaseUrl()}/api/auth/me`, {
              headers: { Authorization: `Bearer ${credentials.oauth_token}` },
            });
            return { ...res.data, accessToken: credentials.oauth_token };
          } catch {
            return null;
          }
        }
        try {
          const res = await axios.post(`${apiBaseUrl()}/api/auth/login`, {
            email: credentials?.email,
            password: credentials?.password,
          });
          const { access_token, user } = res.data;
          return { ...user, accessToken: access_token };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      (session as { accessToken?: string }).accessToken = token.accessToken as string | undefined;
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getSession() {
  if (!process.env.NEXTAUTH_SECRET) {
    return null;
  }
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}
