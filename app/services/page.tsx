import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { ServicesPage } from "@/components/services-page";
export const metadata: Metadata = { title: "Services professionnels | Stocky Downy", description: "Liquidation, upcycling et redesign pour les stocks textiles tunisiens." };
export default function Page() { return <StorefrontShell><main className="sf-main"><ServicesPage /></main></StorefrontShell>; }
