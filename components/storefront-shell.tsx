import Link from "next/link";
import { MessageCircle, UserRound } from "lucide-react";
import { CartButton } from "@/components/cart-button";

export function StorefrontHeader() {
  return <><div className="sf-announcement"><span>Livraison dans les 24 gouvernorats</span><strong>Paiement à la livraison</strong><Link href="/suivi">Suivre une commande</Link></div><header className="sf-header"><Link href="/" className="sf-brand"><img src="/stocky-logo.svg" alt="Stocky Downy" /></Link><nav><Link href="/collection">Collection</Link><Link href="/boutiques">Boutiques</Link><Link href="/services">Services</Link></nav><div className="sf-actions"><Link href="/connexion" className="sf-account"><UserRound /> Connexion</Link><CartButton /></div></header></>;
}

export function StorefrontFooter() {
  return <footer className="sf-footer"><div><img src="/stocky-logo.svg" alt="Stocky Downy" /><p>Le style continue. Les pièces aussi.</p></div><nav><Link href="/collection">Collection</Link><Link href="/boutiques">Boutiques</Link><Link href="/vendeur/demarrage">Vendre sur Stocky</Link><Link href="/suivi">Suivi de commande</Link></nav><a href="https://wa.me/21626107128" target="_blank" rel="noreferrer">développé par chafik dridi <MessageCircle /> +21626107128</a></footer>;
}

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  return <div className="sf-site"><StorefrontHeader />{children}<StorefrontFooter /></div>;
}
