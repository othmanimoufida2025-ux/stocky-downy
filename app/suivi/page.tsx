import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront-shell";
import { TrackingPage } from "@/components/tracking-page";
export const metadata: Metadata = { title: "Suivi de commande | Stocky Downy" };
export default async function Page({ searchParams }: { searchParams: Promise<{ ref?: string }> }) { return <StorefrontShell><main className="sf-main"><TrackingPage initialRef={String((await searchParams).ref || "")} /></main></StorefrontShell>; }
