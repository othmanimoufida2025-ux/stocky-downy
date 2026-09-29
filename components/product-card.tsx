import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import type { StorefrontProduct } from "@/lib/storefront";

export const money = (value: number) => `${(Number(value) / 1000).toFixed(2)} DT`;

export function ProductCard({ product }: { product: StorefrontProduct }) {
  return <article className="sf-product"><Link href={`/produit/${product.slug}`} className="sf-product-image"><img src={product.image || (product.category === "Accessoires" ? "/demo-bag.svg" : "/demo-fashion.svg")} alt={product.name} /></Link><div className="sf-product-body"><Link href={`/boutique/${product.store_slug}`} className="sf-shop-name">{product.store}<BadgeCheck /></Link><Link href={`/produit/${product.slug}`}><h2>{product.name}</h2></Link><div className="sf-product-meta"><strong>{money(product.price)}</strong><span>{product.condition || "Très bon état"}</span></div><AddToCart id={product.id} stock={Number(product.stock)} compact /></div></article>;
}
