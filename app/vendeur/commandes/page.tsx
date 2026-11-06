import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Platform from "@/components/platform";
import { identity } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes commandes | Stocky Downy" };

export default async function Page() {
  const user = await identity();
  if (!user) redirect("/connexion");
  return <Platform initialView="workspace" />;
}
