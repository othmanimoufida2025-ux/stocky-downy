import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Créer un compte | Stocky Downy" };
export default function Page() { return <AuthShell title="Commencez votre histoire Stocky." subtitle="Acheteur ou boutique, votre compte se crée avec un e-mail vérifié."><AuthForm mode="register" /></AuthShell>; }
