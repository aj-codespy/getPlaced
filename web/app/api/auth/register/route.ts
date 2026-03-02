import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, contact, referralCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check referral
    let referrerId = null;
    let initialCredits = 1;

    if (referralCode) {
       const referrer = await prisma.user.findUnique({
         where: { referralCode }
       });
       if (referrer) {
         referrerId = referrer.id;
         // Logic for referrer reward could go here or in a separate event
       }
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        contact,
        credits: initialCredits,
        referredBy: referrerId,
        referralCode: Math.random().toString(36).substring(7),
      },
    });

    return NextResponse.json(
      { message: "User created successfully", user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
