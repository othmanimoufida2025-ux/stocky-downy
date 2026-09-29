import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { StorefrontShell } from "@/components/storefront-shell";
import { ProductCard } from "@/components/product-card";
import { publicProducts, publicShops } from "@/lib/storefront";

export const metadata: Metadata = { title: "Collection | Stocky Downy", description: "Découvrez les pièces circulaires proposées par les boutiques tunisiennes vérifiées." };
export const dynamic = "force-dynamic";

export default async function CollectionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [all, shops] = await Promise.all([publicProducts(), publicShops()]);
  const category = String(params.cat || "");
  const shop = String(params.shop || "");
  const governorate = String(params.gov || "");
  const query = String(params.q || "").toLowerCase();
  const sort = String(params.sort || "new");
  const page = Math.max(1, Number(params.page) || 1);
  const filtered = all.filter((p) => (!category || p.category === category) && (!shop || p.store_id === shop) && (!governorate || p.governorate === governorate) && (!query || `${p.name} ${p.store}`.toLowerCase().includes(query)));
  filtered.sort((a, b) => sort === "price-asc" ? Number(a.price) - Number(b.price) : sort === "price-desc" ? Number(b.price) - Number(a.price) : String(a.name).localeCompare(String(b.name), "fr"));
  const pageSize = 12;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  const qs = (next: number) => new URLSearchParams(Object.entries({ cat: category, shop, gov: governorate, q: String(params.q || ""), sort, page: String(next) }).filter(([, value]) => value)).toString();
  return <StorefrontShell><main className="sf-main"><div className="sf-page-head"><span>Collection circulaire</span><h1>Trouver la pièce qui continue son histoire.</h1><p>{filtered.length} pièces disponibles auprès de boutiques vérifiées.</p></div><form className="catalog-filter"><label className="search-field"><Search /><input name="q" defaultValue={String(params.q || "")} placeholder="Produit ou boutique" /></label><label><span>Catégorie</span><select name="cat" defaultValue={category}><option value="">Toutes</option>{["Femme","Homme","Accessoires","Maison"].map(x => <option key={x}>{x}</option>)}</select></label><label><span>Boutique</span><select name="shop" defaultValue={shop}><option value="">Toutes</option>{shops.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label><label><span>Gouvernorat</span><select name="gov" defaultValue={governorate}><option value="">Tous</option>{[...new Set(shops.map(s => String(s.governorate)).filter(Boolean))].map(x => <option key={x}>{x}</option>)}</select></label><label><span>Trier</span><select name="sort" defaultValue={sort}><option value="new">Pertinence</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option></select></label><button><SlidersHorizontal />Appliquer</button></form>{items.length ? <div className="sf-grid">{items.map(p => <ProductCard key={p.id} product={p} />)}</div> : <div className="sf-empty"><h2>Aucune pièce trouvée</h2><p>Essayez d’élargir vos critères.</p><Link href="/collection">Réinitialiser les filtres</Link></div>}<nav className="pagination" aria-label="Pagination">{page > 1 && <Link href={`/collection?${qs(page - 1)}`}>← Précédent</Link>}<span>Page {Math.min(page, pages)} sur {pages}</span>{page < pages && <Link href={`/collection?${qs(page + 1)}`}>Suivant →</Link>}</nav></main></StorefrontShell>;
}
