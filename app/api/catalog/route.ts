import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db, init } from "@/lib/backend";

export const runtime = "nodejs";

const getCatalog = unstable_cache(
  async (page: number, pageSize: number) => {
    await init();
    const offset = (page - 1) * pageSize;
    const [products, stores, config] = await Promise.all([
      db.execute({
        sql: "SELECT p.id,p.store_id,p.name,p.price,p.stock,p.category,p.description,p.image,p.status,s.name AS store FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id WHERE p.status='active' AND s.status='active' ORDER BY p.name LIMIT ? OFFSET ?",
        args: [pageSize + 1, offset],
      }),
      db.execute(
        "SELECT id,name,status,description,logo,cover,governorate,'' AS owner FROM stocky_stores WHERE status='active' ORDER BY name",
      ),
      db.execute("SELECT value FROM stocky_settings WHERE id='public'"),
    ]);
    const rows = [...products.rows];
    const hasMore = rows.length > pageSize;
    if (hasMore) rows.pop();
    return {
      products: rows,
      stores: stores.rows,
      hasMore,
      page,
      config: config.rows[0]
        ? JSON.parse(String(config.rows[0].value))
        : {
            title: "Une nouvelle histoire pour chaque pièce.",
            deliveryFee: 0,
            commission: 10,
          },
    };
  },
  ["stocky-public-catalog-v1"],
  { revalidate: 60, tags: ["stocky-catalog"] },
);

export async function GET(request: NextRequest) {
  try {
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
    const pageSize = Math.max(
      1,
      Math.min(100, Number(request.nextUrl.searchParams.get("pageSize")) || 100),
    );
    return NextResponse.json(await getCatalog(page, pageSize), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json(
      { error: "Catalogue temporairement indisponible." },
      { status: 503 },
    );
  }
}
