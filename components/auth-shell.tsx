import Link from "next/link";
import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="auth-layout"><aside className="auth-art"><Link href="/"><img src="/stocky-logo.svg" alt="Stocky Downy" /></Link><div className="auth-promise"><span><Sparkles /> Mode circulaire tunisienne</span><h2>Donnez une seconde vie à votre stock.</h2><p>Une plateforme pensée pour acheter mieux, vendre simplement et faire durer chaque pièce.</p><div><small><BadgeCheck /> Boutiques vérifiées</small><small><ShieldCheck /> Données protégées</small></div></div></aside><section className="auth-panel"><Link href="/" className="auth-mobile-logo"><img src="/stocky-logo.svg" alt="Stocky Downy" /></Link><div className="auth-heading"><span>Espace sécurisé</span><h1>{title}</h1><p>{subtitle}</p></div>{children}</section></main>;
}
