import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { CartPage } from "@/components/cart-page";
export const metadata: Metadata = { title: "Finaliser ma commande | Stocky Downy" };
export default function Page() { return <StorefrontShell><main className="sf-main"><CartPage checkout /></main></StorefrontShell>; }
