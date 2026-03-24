import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch then sort locally so users missing createdAt are still visible.
    const usersSnap = await getDocs(collection(db, "users"));
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

    users.sort((a, b) => {
      const aTime = new Date(String(a.createdAt || 0)).getTime() || 0;
      const bTime = new Date(String(b.createdAt || 0)).getTime() || 0;
      return bTime - aTime;
    });

    return NextResponse.json({ users: users.slice(0, 5000) });
  } catch (error: unknown) {
    console.error("Admin Users Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
