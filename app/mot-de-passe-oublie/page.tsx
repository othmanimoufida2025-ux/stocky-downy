import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Réinitialiser le mot de passe | Stocky Downy" };
export default function Page() { return <AuthShell title="Retrouver votre accès." subtitle="Recevez un code sécurisé et choisissez un nouveau mot de passe."><AuthForm mode="forgot" /></AuthShell>; }
