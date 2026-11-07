import type { Metadata } from "next";
import { identity } from "@/lib/backend";
import { SuperadminDashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Super Admin | Stocky Downy",
  description: "Pilotage et administration de la plateforme Stocky Downy",
};

export default async function SuperadminDashboardPage() {
  const user = await identity();
  const isSuperadmin = Boolean(user && user.role === "superadmin");
  return <SuperadminDashboardClient isSuperadmin={isSuperadmin} />;
}
