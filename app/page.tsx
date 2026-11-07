import Link from "next/link";
import { ArrowRight, BadgeCheck, Heart, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { StorefrontShell } from "@/components/storefront-shell";
import { ProductCard } from "@/components/product-card";
import { publicProducts, publicShops, publicCategories } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, shops, categories] = await Promise.all([
    publicProducts(),
    publicShops(),
    publicCategories(),
  ]);

  const featured = products.slice(0, 8);
  const hero = products.find((product) => product.image) || products[0];
  const image = hero?.image || "/demo-fashion.svg";

  return (
    <StorefrontShell>
      <main>
        {/* HERO SECTION */}
        <section className="home-hero">
          <div className="home-copy">
            <span>
              <Sparkles /> Sélection responsable · Tunisie
            </span>
            <h1>
              Le style continue.
              <br />
              Les pièces aussi.
            </h1>
            <p>
              Découvrez des pièces choisies auprès de boutiques tunisiennes vérifiées.
              Moins de gaspillage, plus de caractère.
            </p>
            <div className="home-actions">
              <Link href="/collection">
                Explorer la collection <ArrowRight />
              </Link>
              <Link href="/boutiques">Rencontrer les boutiques</Link>
            </div>
            <div className="home-proof">
              <span>
                <BadgeCheck /> Boutiques vérifiées
              </span>
              <span>
                <ShieldCheck /> Achat serein
              </span>
            </div>
          </div>

          <Link href={hero ? `/produit/${hero.slug}` : "/collection"} className="home-visual">
            <img src={image} alt={hero?.name || "Collection Stocky Downy"} />
            <div>
              <span>Pièce choisie</span>
              <strong>{hero?.name || "La collection arrive"}</strong>
            </div>
          </Link>
        </section>

        {/* METRICS STRIP */}
        <section className="home-metrics">
          <div>
            <BadgeCheck />
            <strong>{shops.length}+</strong>
            <span>Boutiques vérifiées</span>
          </div>
          <div>
            <Sparkles />
            <strong>{products.length}+</strong>
            <span>Pièces disponibles</span>
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

        {/* CATEGORIES WITH COVER IMAGES */}
        <section className="home-section">
          <div className="section-title">
            <div>
              <span>Choisir autrement</span>
              <h2>Explorer selon votre envie</h2>
            </div>
            <Link href="/collection">
              Toute la collection <ArrowRight />
            </Link>
          </div>

          <div className="home-categories">
            {categories.map((category, index) => (
              <Link
                href={`/collection?cat=${encodeURIComponent(category.name)}`}
                key={category.id || category.name}
              >
                <div
                  className={`category-arch arch-${(index % 4) + 1}`}
                  style={{ position: "relative" }}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                  />
                  {category.product_count !== undefined && category.product_count > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        background: "rgba(35, 17, 26, 0.8)",
                        backdropFilter: "blur(4px)",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: "999px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {category.product_count} pièce{category.product_count > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <strong>{category.name}</strong>
                <span>
                  Découvrir <ArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section className="home-section">
          <div className="section-title">
            <div>
              <span>Sélection circulaire</span>
              <h2>Les pièces du moment</h2>
            </div>
            <Link href="/collection">
              Voir tout <ArrowRight />
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
              <p>Les pièces apparaîtront après validation des boutiques.</p>
            </div>
          )}
        </section>

        {/* SELLER CALL TO ACTION */}
        <section className="home-seller">
          <div>
            <span>Vous êtes professionnel ?</span>
            <h2>Transformez votre stock dormant en opportunité.</h2>
            <p>
              Créez votre boutique, publiez vos produits et pilotez vos commandes depuis un espace
              simple et cohérent.
            </p>
          </div>
          <Link href="/inscription">
            Créer ma boutique <ArrowRight />
          </Link>
        </section>
      </main>
    </StorefrontShell>
  );
}
