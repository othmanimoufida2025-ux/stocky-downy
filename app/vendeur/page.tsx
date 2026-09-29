import type { Metadata } from "next";
import Platform from "@/components/platform";
export const metadata: Metadata = { title: "Espace vendeur | Stocky Downy" };
export default function Page() { return <Platform initialView="workspace" />; }
