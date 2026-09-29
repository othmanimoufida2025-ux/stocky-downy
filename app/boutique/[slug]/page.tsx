import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, MessageCircle, Store } from "lucide-react";
import { StorefrontShell } from "@/components/storefront-shell";
import { ProductCard } from "@/components/product-card";
import { publicProducts, publicShop } from "@/lib/storefront";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const shop = await publicShop((await params).slug); return shop ? { title: `${shop.name} | Stocky Downy`, description: shop.description } : { title: "Boutique introuvable" }; }
export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) { const shop = await publicShop((await params).slug); if (!shop) notFound(); const products = (await publicProducts()).filter(p => p.store_id === shop.id); return <StorefrontShell><main><section className="shop-hero">{shop.cover ? <img src={shop.cover} alt={`Couverture ${shop.name}`} /> : <div className="default-cover" />}<div className="shop-profile"><div className="shop-logo large">{shop.logo ? <img src={shop.logo} alt={`Logo ${shop.name}`} /> : <Store />}</div><div><span className="verified"><BadgeCheck /> Boutique vérifiée</span><h1>{shop.name}</h1><p>{shop.description || "Une sélection responsable de pièces revalorisées."}</p><small><MapPin /> {shop.governorate || "Tunisie"}</small></div>{shop.whatsapp && <a className="whatsapp" href={`https://wa.me/216${String(shop.whatsapp).replace(/\D/g, "").replace(/^216/, "")}`}><MessageCircle /> Contacter</a>}</div></section><section className="sf-main shop-products"><div className="section-title"><div><span>La sélection</span><h2>{products.length} pièces disponibles</h2></div></div><div className="sf-grid">{products.map(p => <ProductCard key={p.id} product={p} />)}</div></section></main></StorefrontShell>; }
