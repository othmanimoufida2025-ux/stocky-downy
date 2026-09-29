import { db, init } from "@/lib/backend";

export type StorefrontProduct = {
  id: string;
  slug: string;
  store_id: string;
  store: string;
  store_slug: string;
  governorate: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  image: string;
  condition: string;
};

export type StorefrontShop = {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string;
  cover: string;
  governorate: string;
  whatsapp: string;
};

export async function publicProducts() {
  await init();
  const result = await db.execute(
    `SELECT p.id,p.slug,p.store_id,p.name,p.price,p.stock,p.category,p.description,p.image,p.condition,
            s.name AS store,s.slug AS store_slug,s.governorate
     FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id
     WHERE p.status='active' AND s.status='active' ORDER BY p.name`,
  );
  return result.rows as unknown as StorefrontProduct[];
}

export async function publicShops() {
  await init();
  const result = await db.execute(
    `SELECT s.id,s.slug,s.name,s.description,s.logo,s.cover,s.governorate,s.whatsapp,
            COUNT(p.id) AS product_count
     FROM stocky_stores s LEFT JOIN stocky_products p ON p.store_id=s.id AND p.status='active'
     WHERE s.status='active' GROUP BY s.id ORDER BY s.name`,
  );
  return result.rows as unknown as (StorefrontShop & { product_count: number })[];
}

export async function publicProduct(slug: string) {
  await init();
  const result = await db.execute({
    sql: `SELECT p.id,p.slug,p.store_id,p.name,p.price,p.stock,p.category,p.description,p.image,p.condition,
                 s.name AS store,s.slug AS store_slug,s.governorate,s.logo AS store_logo,s.whatsapp
          FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id
          WHERE p.slug=? AND p.status='active' AND s.status='active'`,
    args: [slug],
  });
  return result.rows[0] as unknown as (StorefrontProduct & { store_logo: string; whatsapp: string }) | undefined;
}

export async function publicShop(slug: string) {
  await init();
  const result = await db.execute({
    sql: "SELECT id,slug,name,description,logo,cover,governorate,whatsapp FROM stocky_stores WHERE slug=? AND status='active'",
    args: [slug],
  });
  return result.rows[0] as unknown as StorefrontShop | undefined;
}
