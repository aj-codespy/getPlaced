
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { evaluateEmailForAuth } from "@/lib/email-policy";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const emailLower = credentials.email.toLowerCase().trim();
          const userRef = doc(db, "users", emailLower);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            return null;
          }

          const userData = userSnap.data();

          if (!userData.password) {
            // User likely logged in with Google exclusively
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, userData.password);

          if (!isPasswordValid) {
            return null;
          }

          return { id: emailLower, email: userData.email, name: userData.name };
        } catch (e) {
          console.error("Credentials Auth Error:", e);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      const emailCheck = evaluateEmailForAuth(user.email || "");
      if (!emailCheck.ok) {
        return `/login?error=${emailCheck.code}`;
      }

      if (account?.provider === "google") {
        try {
          if (!user.email) return "/login?error=EMAIL_INVALID_FORMAT";

          // Sync Google user to Firestore "users" collection.
          const userEmail = emailCheck.normalizedEmail;
          const userRef = doc(db, "users", userEmail);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: userEmail,
              name: user.name,
              image: user.image,
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              provider: "google",
              credits: 200, // Welcome bonus
              isPremium: 0, // 0 = Free, 1 = Standard, 2 = Pro
            });
          } else {
            const existingData = userSnap.data();
            const patch: Record<string, unknown> = {
              lastLoginAt: serverTimestamp(),
            };

            if (!existingData.email) patch.email = userEmail;
            if (!existingData.name && user.name) patch.name = user.name;
            if (!existingData.provider) patch.provider = "google";
            if (typeof existingData.credits !== "number") patch.credits = 200;
            if (typeof existingData.isPremium !== "number") patch.isPremium = 0;
            if (!existingData.createdAt) patch.createdAt = serverTimestamp();

            await setDoc(userRef, patch, { merge: true });
          }
        } catch (e) {
          console.error("Firebase User Sync Failed:", {
            provider: account.provider,
            email: emailCheck.normalizedEmail,
            message: e instanceof Error ? e.message : String(e),
          });
          return "/login?error=ACCOUNT_SYNC_FAILED";
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
