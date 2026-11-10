import Link from "next/link";
import { ArrowRight, BadgeCheck, Heart, Sparkles, Truck } from "lucide-react";
import { StorefrontShell } from "@/components/storefront-shell";
import { ProductCard } from "@/components/product-card";
import { HeroCategoryCarousel } from "@/components/hero-category-carousel";
import { publicProducts, publicShops, publicCategories } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, shops, categories] = await Promise.all([
    publicProducts(),
    publicShops(),
    publicCategories(),
  ]);

  const featured = products.slice(0, 8);

  return (
    <StorefrontShell>
      <main>
        {/* ═══ HERO: full-screen category carousel with copy overlay ═══ */}
        <HeroCategoryCarousel
          categories={categories}
          heroCopy={{ shopCount: shops.length, productCount: products.length }}
        />

        {/* ═══ METRICS STRIP ═══ */}
        <section className="home-metrics">
          <div>
            <BadgeCheck />
            <strong>{shops.length}+</strong>
            <span>Boutiques de confiance</span>
          </div>
          <div>
            <Sparkles />
            <strong>{products.length}+</strong>
            <span>Pièces à saisir</span>
          </div>
          <div>
            <Heart />
            <strong>100%</strong>
            <span>Mode responsable</span>
          </div>
          <div>
            <Truck />
            <strong>24</strong>
            <span>Gouvernorats livrés</span>
          </div>
        </section>

        {/* ═══ FEATURED PRODUCTS ═══ */}
        <section className="home-section">
          <div className="section-title">
            <div>
              <span>Coups de cœur du moment</span>
              <h2>Des pièces qui ont du caractère</h2>
            </div>
            <Link href="/collection">
              Tout explorer <ArrowRight />
            </Link>
          </div>
          {featured.length ? (
            <div className="sf-grid">
              {featured.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : (
            <div className="sf-empty">
              <h2>La collection se prépare.</h2>
              <p>Des pièces soigneusement choisies arrivent bientôt.</p>
            </div>
          )}
        </section>

        {/* ═══ SELLER CALL TO ACTION ═══ */}
        <section className="home-seller">
          <div>
            <span>Vous avez du stock à valoriser ?</span>
            <h2>Donnez une seconde vie à vos pièces.</h2>
            <p>
              Rejoignez les boutiques tunisiennes qui font confiance à Stocky Downy
              pour vendre malin, vendre bien, et ne plus laisser de stock dormir.
            </p>
          </div>
          <Link href="/inscription">
            Ouvrir ma boutique <ArrowRight />
          </Link>
        </section>
      </main>
    </StorefrontShell>
  );
}
