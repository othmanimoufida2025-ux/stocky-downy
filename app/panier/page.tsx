import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { CartPage } from "@/components/cart-page";
export const metadata: Metadata = { title: "Panier | Stocky Downy" };
export default function Page() { return <StorefrontShell><main className="sf-main"><CartPage /></main></StorefrontShell>; }
