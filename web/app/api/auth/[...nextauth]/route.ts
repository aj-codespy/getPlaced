
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import bcrypt from "bcryptjs";

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
          const emailLower = credentials.email.toLowerCase();
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
      if (account?.provider === "google") {
        try {
           if (!user.email) return false;
           
           // Sync Google User to Firestore "users" collection
           const userRef = doc(db, "users", user.email);
           const userSnap = await getDoc(userRef);

           if (!userSnap.exists()) {
             await setDoc(userRef, {
                 email: user.email,
                 name: user.name,
                 image: user.image,
                 createdAt: serverTimestamp(),
                 provider: 'google',
                 credits: 200, // Welcome Bonus
                 isPremium: 0 // 0 = Free, 1 = Standard, 2 = Pro
             });
           }
        } catch (e) {
          console.error("Firebase User Sync Failed:", e);
          // Allow login anyway
          return true;
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
