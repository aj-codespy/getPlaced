import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usersSnap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5000)));
    const users: Record<string, unknown>[] = [];
    
    usersSnap.forEach((doc) => {
        const d = doc.data();
        const createdAtData = d.createdAt as { toDate?: () => Date } | string | undefined;
        let createdAtStr = new Date().toISOString(); // fallback
        
        if (createdAtData && typeof createdAtData === "object" && typeof createdAtData.toDate === "function") {
             createdAtStr = createdAtData.toDate().toISOString();
        } else if (createdAtData instanceof Date) {
             createdAtStr = createdAtData.toISOString();
        } else if (typeof createdAtData === "string") {
             createdAtStr = new Date(createdAtData).toISOString();
        }

        users.push({
            id: doc.id,
            email: d.email as string,
            name: d.name as string,
            credits: d.credits as number,
            plan: (d.planType as string) || (((d.isPremium as number) > 0) ? "premium" : "free"),
            createdAt: createdAtStr
        });
    });

    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error("Admin Users Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
