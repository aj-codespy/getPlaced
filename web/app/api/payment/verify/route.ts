import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct verify endpoint is deprecated for Dodo checkout. Configure /api/payment/webhook/dodo and rely on webhook-based confirmation.",
    },
    { status: 410 },
  );
}

