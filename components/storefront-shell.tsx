import Link from "next/link";
import { Facebook, Instagram, UserRound } from "lucide-react";
import { CartButton } from "@/components/cart-button";

export function StorefrontHeader() {
  return <><div className="sf-announcement"><span>Livraison dans les 24 gouvernorats</span><strong>Paiement à la livraison</strong><Link href="/suivi">Suivre une commande</Link></div><header className="sf-header"><Link href="/" className="sf-brand"><img src="/stocky-logo.svg" alt="Stocky Downy" /></Link><nav><Link href="/collection">Collection</Link><Link href="/boutiques">Boutiques</Link><Link href="/services">Services</Link></nav><div className="sf-actions"><Link href="/connexion" className="sf-account"><UserRound /> Connexion</Link><CartButton /></div></header></>;
}

export function StorefrontFooter() {
  return (
    <footer className="sf-footer">
      <div>
        <img src="/stocky-logo.svg" alt="Stocky Downy" />
        <p>Le style continue. Les pièces aussi.</p>
      </div>
      <nav>
        <Link href="/collection">Collection</Link>
        <Link href="/boutiques">Boutiques</Link>
        <Link href="/vendeur/demarrage">Vendre sur Stocky</Link>
        <Link href="/suivi">Suivi de commande</Link>
      </nav>
      <div className="sf-footer-socials">
        <a
          href="https://www.facebook.com/profile.php?id=61594223823361&locale=fr_FR"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <Facebook />
        </a>
        <a
          href="https://www.instagram.com/stockydown/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <Instagram />
        </a>
      </div>
    </footer>
  );
}

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  return <div className="sf-site"><StorefrontHeader />{children}<StorefrontFooter /></div>;
}
