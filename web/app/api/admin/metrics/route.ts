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

    // Parallel fetch for speed
    const [usersSnap, resumesSnap, profilesSnap, transactionsSnap] = await Promise.all([
      getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(200))), // Get last 200 for metrics
      getDocs(collection(db, "resumes")),
      getDocs(collection(db, "profiles")),
      getDocs(query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(200))),
    ]);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let newUsersCount = 0;
    let paidUsersCount = 0;
    let totalCreditsInSystem = 0;
    const users: Record<string, unknown>[] = [];

    usersSnap.forEach((doc) => {
      const data = doc.data();
      users.push({ id: doc.id, ...data });
      
      let createdAtStr = "";
      // Handle firestore timestamp or string
      if (data.createdAt?.toDate) {
          createdAtStr = data.createdAt.toDate();
      } else if (data.createdAt) {
          createdAtStr = new Date(data.createdAt).toString();
      }
      
      if (createdAtStr) {
          const createdDate = new Date(createdAtStr);
          if (createdDate > yesterday) newUsersCount++;
      }
      if (data.isPremium > 0 || data.planType === "pro" || data.planType === "standard") {
          paidUsersCount++;
      }
      totalCreditsInSystem += (typeof data.credits === "number" ? data.credits : 0);
    });

    const totalUsers = usersSnap.size; // Or keep a global counter, but size of query works for small DBs
    const totalResumes = resumesSnap.size;

    let totalTokens = 0;
    
    // Aggregate by date for graphs
    const dailyTokensMap: Record<string, { input: number, output: number, total: number }> = {};

    const templatesCounter: Record<string, number> = {};
    resumesSnap.forEach((doc) => {
       const data = doc.data();
       const templateId = data.templateId;
       if (templateId) {
          templatesCounter[templateId] = (templatesCounter[templateId] || 0) + 1;
       }
       
       let inputT = 0;
       let outputT = 0;
       if (data.tokens) {
           inputT = typeof data.tokens.input === "number" ? data.tokens.input : 0;
           outputT = typeof data.tokens.output === "number" ? data.tokens.output : 0;
       }
       const sumT = inputT + outputT;
       totalTokens += sumT;
       
       let dateStr = "Unknown";
       const createdAtObj = data.createdAt;
       if (createdAtObj) {
            if (createdAtObj.toDate) {
                dateStr = createdAtObj.toDate().toISOString().split("T")[0];
            } else if (typeof createdAtObj === "string") {
                dateStr = new Date(createdAtObj).toISOString().split("T")[0];
            }
       }
       
       if (dateStr !== "Unknown" && sumT > 0) {
           if (!dailyTokensMap[dateStr]) dailyTokensMap[dateStr] = { input: 0, output: 0, total: 0 };
           dailyTokensMap[dateStr].input += inputT;
           dailyTokensMap[dateStr].output += outputT;
           dailyTokensMap[dateStr].total += sumT;
       }
    });

    let mostPopularTemplate = "None";
    let maxT = 0;
    for (const [k, v] of Object.entries(templatesCounter)) {
       if (v > maxT) { maxT = v; mostPopularTemplate = k; }
    }

    // Gemini 2.5 Flash exact pricing: $0.30 per 1M tokens (input + output).
    let totalCost = 0.0;
    for (const ds of Object.values(dailyTokensMap)) {
         totalCost += (ds.total * (0.30 / 1_000_000));
    }
    
    // Sort array for charts
    const tokensChartData = Object.entries(dailyTokensMap)
         .sort((a, b) => a[0].localeCompare(b[0])) // chronological 
         .map(([date, counts]) => ({ date, ...counts }));

    let totalRevenueCents = 0;
    transactionsSnap.forEach((doc) => {
        const d = doc.data();
        if (d.status === "success" && typeof d.amount === "number") {
            totalRevenueCents += d.amount;
        }
    });
    // Convert to INR
    const totalRevenueINR = totalRevenueCents / 100;

    // Aggregate institutions
    const institutions: Record<string, number> = {};
    profilesSnap.forEach((doc) => {
      const data = doc.data();
      const edu = data.education || [];
      edu.forEach((e: Record<string, unknown>) => {
        const inst = e.institution || e.school || e.name;
        if (inst && typeof inst === "string") {
            const clean = inst.trim();
            if (clean.length > 3) { // filter out noise
                institutions[clean] = (institutions[clean] || 0) + 1;
            }
        }
      });
    });

    // Sort top institutions
    const topInstitutions = Object.entries(institutions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
        metrics: {
            totalUsers,
            newUsersCount,
            paidUsersCount,
            totalCreditsInSystem,
            totalResumes,
            mostPopularTemplate,
            totalRevenue: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalRevenueINR),
            totalTokens,
            totalCost: `$${totalCost.toFixed(6)}`,
            topInstitutions,
            growthRate: totalUsers > 0 ? ((newUsersCount / totalUsers) * 100).toFixed(1) : 0,
            tokensChartData
        },
        recentUsers: users.slice(0, 30).map(u => {
            const createdAtData = u.createdAt as { toDate?: () => Date } | string | undefined;
            return {
                email: u.email as string,
                name: u.name as string,
                credits: u.credits as number,
                plan: u.planType as string || ((u.isPremium as number) > 0 ? "premium" : "free"),
                createdAt: createdAtData && typeof createdAtData === "object" && typeof createdAtData.toDate === "function" 
                    ? createdAtData.toDate() 
                    : createdAtData
            };
        })
    });

  } catch (e: unknown) {
    console.error("Admin Metrics Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
  }
}
