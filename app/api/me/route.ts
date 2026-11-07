import { NextResponse } from "next/server";
import { db, identity } from "@/lib/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const empty = { products: [], stores: [], requests: [], audit: [], users: [], categories: [] };

export async function GET() {
  try {
    const user = await identity();
    if (!user)
      return NextResponse.json({ user: null, ...empty }, { headers: { "Cache-Control": "no-store" } });
    const admin = user.role === "superadmin";
    const [products, stores, requests, audit, users, productImages, categories] = await Promise.all([
      db.execute(
        admin
          ? "SELECT p.id,p.slug,p.store_id,p.name,p.price,p.stock,p.category,p.description,p.image,p.condition,p.status,p.demo,s.name AS store,s.slug AS store_slug FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id ORDER BY p.name"
          : {
              sql: "SELECT p.id,p.slug,p.store_id,p.name,p.price,p.stock,p.category,p.description,p.image,p.condition,p.status,p.demo,s.name AS store,s.slug AS store_slug FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id WHERE s.owner=? ORDER BY p.name",
              args: [String(user.id)],
            },
      ),
      db.execute(
        admin
          ? "SELECT s.id,s.slug,s.owner,s.name,s.phone,s.status,s.description,s.logo,s.cover,s.address,s.governorate,s.whatsapp,u.email AS owner_email, (SELECT COUNT(*) FROM stocky_products WHERE store_id=s.id) AS product_count FROM stocky_stores s LEFT JOIN stocky_users u ON u.id=s.owner ORDER BY s.name"
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
        ? db.execute(
            "SELECT u.id,u.email,u.role,u.nom,u.prenom,u.created,s.id AS store_id,s.name AS store_name,s.slug AS store_slug FROM stocky_users u LEFT JOIN stocky_stores s ON s.owner=u.id ORDER BY u.created DESC",
          )
        : Promise.resolve({ rows: [] }),
      db.execute("SELECT product_id, url FROM stocky_product_images ORDER BY position ASC"),
      db.execute("SELECT id, name, slug, image, description, position FROM stocky_categories ORDER BY position ASC, name ASC"),
    ]);
    const imagesByProduct: Record<string, string[]> = {};
    for (const r of (productImages?.rows || [])) {
      const pid = String(r.product_id);
      (imagesByProduct[pid] ||= []).push(String(r.url));
    }
    const enrichedProducts = products.rows.map((p) => {
      const gallery = imagesByProduct[String(p.id)] || [];
      if (!gallery.length && p.image) gallery.push(String(p.image));
      return {
        ...p,
        images: gallery,
      };
    });

    return NextResponse.json(
      {
        user,
        products: enrichedProducts,
        stores: stores.rows,
        requests: requests.rows,
        audit: audit.rows,
        users: users.rows,
        categories: categories.rows,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Session temporairement indisponible." }, { status: 503 });
  }
}
