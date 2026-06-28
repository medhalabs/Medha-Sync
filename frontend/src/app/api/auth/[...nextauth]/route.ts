import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        try {
          const apiUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
          const res = await axios.post(`${apiUrl}/api/auth/login`, {
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
      if (user) { token.accessToken = (user as any).accessToken; token.role = (user as any).role; }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session.user as any).role = token.role;
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
