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
  images?: string[];
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
  const [result, imgRes] = await Promise.all([
    db.execute(
      `SELECT p.id,p.slug,p.store_id,p.name,p.price,p.stock,p.category,p.description,p.image,p.condition,
              s.name AS store,s.slug AS store_slug,s.governorate
       FROM stocky_products p JOIN stocky_stores s ON s.id=p.store_id
       WHERE p.status='active' AND s.status='active' ORDER BY p.name`,
    ),
    db.execute("SELECT product_id, url FROM stocky_product_images ORDER BY position ASC"),
  ]);
  const imagesByProduct: Record<string, string[]> = {};
  for (const r of imgRes.rows) {
    const pid = String(r.product_id);
    (imagesByProduct[pid] ||= []).push(String(r.url));
  }
  return result.rows.map((p) => {
    const gallery = imagesByProduct[String(p.id)] || [];
    if (!gallery.length && p.image) gallery.push(String(p.image));
    return {
      ...p,
      images: gallery,
    } as unknown as StorefrontProduct;
  });
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
  if (!result.rows[0]) return undefined;
  const prod = result.rows[0] as unknown as (StorefrontProduct & { store_logo: string; whatsapp: string; images?: string[] });
  const imgRes = await db.execute({
    sql: "SELECT url FROM stocky_product_images WHERE product_id=? ORDER BY position ASC",
    args: [prod.id],
  });
  const gallery = imgRes.rows.map((r) => String(r.url));
  if (!gallery.length && prod.image) gallery.push(prod.image);
  prod.images = gallery;
  return prod;
}

export async function publicShop(slug: string) {
  await init();
  const result = await db.execute({
    sql: "SELECT id,slug,name,description,logo,cover,governorate,whatsapp FROM stocky_stores WHERE slug=? AND status='active'",
    args: [slug],
  });
  return result.rows[0] as unknown as StorefrontShop | undefined;
}


export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  product_count?: number;
};

export async function publicCategories(): Promise<StorefrontCategory[]> {
  await init();
  const [cats, products] = await Promise.all([
    db.execute("SELECT id, name, slug, image, description, position FROM stocky_categories ORDER BY position ASC, name ASC"),
    db.execute("SELECT category, image FROM stocky_products WHERE status='active'"),
  ]);

  const counts: Record<string, number> = {};
  const firstImages: Record<string, string> = {};
  for (const p of products.rows) {
    const c = String(p.category);
    counts[c] = (counts[c] || 0) + 1;
    if (!firstImages[c] && p.image) firstImages[c] = String(p.image);
  }

  if (!cats.rows.length) {
    // Fallback if not yet migrated
    const { DEFAULT_CATEGORY_COVERS } = await import("./backend");
    return DEFAULT_CATEGORY_COVERS.map((c, i) => ({
      id: String(i + 1),
      name: c.name,
      slug: c.slug,
      image: c.image || firstImages[c.name] || "/demo-fashion.svg",
      description: c.description,
      product_count: counts[c.name] || 0,
    }));
  }

  return cats.rows.map((r: any) => ({
    id: String(r.id),
    name: String(r.name),
    slug: String(r.slug),
    image: r.image || firstImages[String(r.name)] || "/demo-fashion.svg",
    description: String(r.description || ""),
    product_count: counts[String(r.name)] || 0,
  }));
}
