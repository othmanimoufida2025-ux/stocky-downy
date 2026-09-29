import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
export default function NotFound() { return <main className="system-page"><img src="/stocky-logo.svg" alt="Stocky Downy" /><div className="system-arch"><Search /></div><span>Erreur 404</span><h1>Cette pièce reste introuvable.</h1><p>La page a peut-être changé d’adresse ou le produit n’est plus disponible.</p><div><Link href="/">Retour à l’accueil</Link><Link href="/collection"><ArrowLeft /> Voir la collection</Link></div></main>; }
