import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Connexion | Stocky Downy" };
export default function Page() { return <AuthShell title="Heureux de vous revoir." subtitle="Retrouvez votre boutique, vos commandes et vos demandes."><AuthForm mode="login" /></AuthShell>; }
