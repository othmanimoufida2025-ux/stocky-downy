import { NextResponse } from "next/server";
import { db, identity } from "@/lib/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const empty = { products: [], stores: [], requests: [], audit: [], users: [] };

export async function GET() {
  try {
    const user = await identity();
    if (!user)
      return NextResponse.json({ user: null, ...empty }, { headers: { "Cache-Control": "no-store" } });
    const admin = user.role === "superadmin";
    const [products, stores, requests, audit, users] = await Promise.all([
      db.execute(
        admin
          ? "SELECT p.id,p.slug,p.store_id,p.name,p.price,p.stock,p.category,p.description,p.image,p.condition,p.status,p.demo,s.name AS store FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id ORDER BY p.name"
          : {
              sql: "SELECT p.id,p.slug,p.store_id,p.name,p.price,p.stock,p.category,p.description,p.image,p.condition,p.status,p.demo,s.name AS store FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id WHERE s.owner=? ORDER BY p.name",
              args: [String(user.id)],
            },
      ),
      db.execute(
        admin
          ? "SELECT id,slug,owner,name,phone,status,description,logo,cover,address,governorate,whatsapp FROM stocky_stores ORDER BY name"
          : {
              sql: "SELECT id,slug,owner,name,phone,status,description,logo,cover,address,governorate,whatsapp FROM stocky_stores WHERE owner=?",
              args: [String(user.id)],
            },
      ),
      db.execute(
        admin
          ? "SELECT id,owner,type,message,status,reply,created FROM stocky_requests ORDER BY created DESC"
          : {
              sql: "SELECT id,owner,type,message,status,reply,created FROM stocky_requests WHERE owner=? ORDER BY created DESC",
              args: [String(user.id)],
            },
      ),
      admin
        ? db.execute(
            "SELECT a.id,a.actor,a.action,a.entity,a.created,u.email FROM stocky_audit a LEFT JOIN stocky_users u ON u.id=a.actor ORDER BY a.id DESC LIMIT 100",
          )
        : Promise.resolve({ rows: [] }),
      admin
        ? db.execute("SELECT id,email,role,created FROM stocky_users ORDER BY created DESC")
        : Promise.resolve({ rows: [] }),
    ]);
    return NextResponse.json(
      {
        user,
        products: products.rows,
        stores: stores.rows,
        requests: requests.rows,
        audit: audit.rows,
        users: users.rows,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Session temporairement indisponible." }, { status: 503 });
  }
}
