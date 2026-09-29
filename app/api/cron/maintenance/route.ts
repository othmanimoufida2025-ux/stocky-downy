import { NextRequest, NextResponse } from "next/server";
import { runMaintenance } from "@/lib/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await runMaintenance()) });
  } catch (error) {
    console.error("Stocky maintenance failed", error);
    return NextResponse.json({ error: "Maintenance échouée" }, { status: 500 });
  }
}
