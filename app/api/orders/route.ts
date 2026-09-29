import { NextResponse } from "next/server";
import { db, identity } from "@/lib/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await identity();
    if (!user)
      return NextResponse.json(
        { orders: [] },
        { headers: { "Cache-Control": "private, no-store" } },
      );

    const result = await db.execute(
      user.role === "superadmin"
        ? "SELECT id,ref,store_id,customer,phone,address,governorate,notes,items,subtotal,delivery_fee,commission_rate,commission_amount,total,status,created,updated FROM stocky_orders ORDER BY created DESC"
        : {
            sql: "SELECT o.id,o.ref,o.store_id,o.customer,o.phone,o.address,o.governorate,o.notes,o.items,o.subtotal,o.delivery_fee,o.commission_rate,o.commission_amount,o.total,o.status,o.created,o.updated FROM stocky_orders o JOIN stocky_stores s ON s.id=o.store_id WHERE s.owner=? ORDER BY o.created DESC",
            args: [String(user.id)],
          },
    );

    return NextResponse.json(
      { orders: result.rows },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Commandes temporairement indisponibles." },
      { status: 503 },
    );
  }
}
