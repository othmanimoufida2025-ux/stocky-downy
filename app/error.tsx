"use client";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="system-page"><img src="/stocky-logo.svg" alt="Stocky Downy" /><div className="system-arch"><RefreshCw /></div><span>Petit contretemps</span><h1>La page n’a pas pu se charger.</h1><p>Vos données sont conservées. Réessayez dans un instant.</p><div><button onClick={reset}>Réessayer</button><Link href="/">Retour à l’accueil</Link></div></main>; }
