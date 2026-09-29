import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin, Store } from "lucide-react";
import { StorefrontShell } from "@/components/storefront-shell";
import { publicShops } from "@/lib/storefront";

export const metadata: Metadata = { title: "Boutiques vérifiées | Stocky Downy", description: "Rencontrez les boutiques tunisiennes de mode circulaire." };
export const dynamic = "force-dynamic";
export default async function ShopsPage() { const shops = await publicShops(); return <StorefrontShell><main className="sf-main"><div className="sf-page-head"><span>Partenaires engagés</span><h1>Les boutiques qui font durer le style.</h1><p>Des vendeurs contrôlés par Stocky, partout en Tunisie.</p></div><div className="shop-grid">{shops.map(shop => <article className="shop-card" key={shop.id}><Link href={`/boutique/${shop.slug}`} className="shop-cover">{shop.cover ? <img src={shop.cover} alt={`Couverture ${shop.name}`} /> : <Store />}</Link><div className="shop-card-body"><div className="shop-logo">{shop.logo ? <img src={shop.logo} alt={`Logo ${shop.name}`} /> : <Store />}</div><span className="verified"><BadgeCheck /> Boutique vérifiée</span><h2>{shop.name}</h2><p>{shop.description || "Une sélection responsable de pièces revalorisées."}</p><small><MapPin /> {shop.governorate || "Tunisie"} · {shop.product_count} produits</small><Link href={`/boutique/${shop.slug}`} className="text-action">Voir la boutique →</Link></div></article>)}</div></main></StorefrontShell>; }
