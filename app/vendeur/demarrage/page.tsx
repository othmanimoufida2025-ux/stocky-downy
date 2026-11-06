import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingPage } from "@/components/onboarding-page";
import { identity } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Créer ma boutique | Stocky Downy" };

export default async function Page() {
  const user = await identity();
  if (!user) redirect("/inscription");
  return <OnboardingPage />;
}
