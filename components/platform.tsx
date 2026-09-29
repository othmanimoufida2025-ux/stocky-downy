"use client";
import { useCallback, useEffect, useState, FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ShoppingBag,
  X,
  ArrowRight,
  Store,
  Package,
  LogOut,
  MessageCircle,
  Search,
  BadgeCheck,
  Heart,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Operations,
  Services,
  Tracking,
  type OperationsData,
} from "./operations";
import { AdminDashboard } from "./admin-dashboard";
import { SellerOnboarding } from "./seller-onboarding";
type Product = {
  store_id: string;
  image: string;
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  store: string;
  status: string;
};
type Shop = {
  id: string;
  owner: string;
  name: string;
  status: string;
  description?: string;
  logo?: string;
  cover?: string;
  governorate?: string;
};
type Order = {
  id: string;
  customer: string;
  total: number;
  status: string;
  created: string;
};
type Data = OperationsData & {
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  products: Product[];
  stores: Shop[];
  orders: Order[];
};
const empty: Data = {
  user: null,
  products: [],
  stores: [],
  orders: [],
  requests: [],
  users: [],
  audit: [],
  config: {
    title: "Une nouvelle histoire pour chaque pièce.",
    deliveryFee: 0,
    commission: 10,
  },
};
function mergeById<T extends { id: string }>(publicRows: T[], privateRows: T[]) {
  const merged = new Map(publicRows.map((row) => [row.id, row]));
  privateRows.forEach((row) => merged.set(row.id, row));
  return [...merged.values()];
}
const money = (value: number) => `${(value / 1000).toFixed(2)} DT`;
export default function Platform({
  initialView = "catalog",
}: {
  initialView?: string;
}) {
  const [data, setData] = useState<Data>(empty),
    [view, setView] = useState(initialView),
    [modal, setModal] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [cart, setCart] = useState<Record<string, number>>({}),
    [selected, setSelected] = useState<Product | null>(null);
  const refresh = useCallback(async () => {
    try {
      const [catalogResponse, accountResponse, ordersResponse] = await Promise.all([
        fetch("/api/catalog"),
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
      ]);
      const [catalog, account, orders] = await Promise.all([
        catalogResponse.json(),
        accountResponse.json(),
        ordersResponse.json(),
      ]);
      if (!catalogResponse.ok) throw Error(catalog.error);
      if (!accountResponse.ok) throw Error(account.error);
      if (!ordersResponse.ok) throw Error(orders.error);
      setData({
        ...empty,
        ...catalog,
        ...account,
        ...orders,
        config: catalog.config,
        products: mergeById(catalog.products || [], account.products || []),
        stores: mergeById(catalog.stores || [], account.stores || []),
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);
  useEffect(() => {
    if (
      data.user?.role === "superadmin" &&
      new URLSearchParams(location.search).get("admin") === "1"
    )
      setView("admin");
  }, [data.user?.role]);
  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("stocky-basket-v2") || "{}"));
    } catch {}
  }, []);
  const updateCart = (next: Record<string, number>) => {
    setCart(next);
    localStorage.setItem("stocky-basket-v2", JSON.stringify(next));
  };
  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      await refresh();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible");
      return null;
    } finally {
      setBusy(false);
    }
  }
  const [productImage, setProductImage] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const admin = data.user?.role === "superadmin";
  const own = data.stores.find((s) => s.owner === data.user?.id);
  const publicProducts = data.products.filter((p) => p.status === "active");
  const featuredProducts = [...publicProducts].sort((a, b) =>
    Number(Boolean(b.image?.startsWith("/api/media"))) -
    Number(Boolean(a.image?.startsWith("/api/media"))),
  );
  const total = Object.entries(cart).reduce(
    (sum, [id, q]) =>
      sum + (data.products.find((p) => p.id === id)?.price || 0) * q,
    0,
  );
  async function form(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const result = await act({
      action,
      ...values,
      ...(action === "product"
        ? {
            price: Number(values.price),
            stock: Number(values.stock),
            image: productImage,
          }
        : {}),
      ...(action === "checkout"
        ? {
            deliveryFee: data.config.deliveryFee,
            items: Object.entries(cart).map(([id, quantity]) => ({
              id,
              quantity,
            })),
          }
        : {}),
    });
    if (result) {
      setModal("");
      setNotice(
        action === "checkout"
          ? `Commande enregistrée : ${result.orders.join(", ")}`
          : "Enregistré.",
      );
      if (action === "checkout") updateCart({});
    }
  }
  if (initialView === "admin" && loading) {
    return <div className="admin-loading"><img src="/stocky-logo.svg" alt="Stocky"/><p>Chargement du centre de contrôle…</p></div>;
  }
  if (view === "admin" && admin) {
    return <AdminDashboard data={data} act={act} busy={busy}/>;
  }
  return (
    <div className="platform">
      <div className="announcement-bar">
        <span>Livraison dans toute la Tunisie</span>
        <strong>Mode circulaire, style durable</strong>
        <button onClick={() => setView("tracking")}>Suivre ma commande →</button>
      </div>
      <header className="p-header">
        <div className="p-header-main">
          <a href="/" aria-label="Stocky accueil">
            <img src="/stocky-logo.svg" alt="Stocky" width="130" height="48" />
          </a>
          <label className="header-search">
            <Search />
            <input aria-label="Rechercher dans la boutique" placeholder="Rechercher un produit, une boutique…" value={query} onChange={(e)=>{setQuery(e.target.value);setView("catalog")}} />
          </label>
          <div className="p-actions">
            {data.user ? (
              <Button variant="outline" onClick={() => setView("workspace")}><UserRound/> Ma boutique</Button>
            ) : (
              <Button variant="outline" onClick={() => setModal("auth")}><UserRound/> Se connecter</Button>
            )}
            <Button className="cart-button" onClick={() => setModal("cart")}>
              <ShoppingBag />
              <span>Panier</span>
              <b>{Object.values(cart).reduce((s, q) => s + q, 0)}</b>
            </Button>
            {data.user && <button className="logout-button" aria-label="Déconnexion" onClick={async()=>{if(await act({action:"logout"}))setView("catalog")}}><LogOut/></button>}
          </div>
        </div>
        <nav className="p-nav">
          {[
            ["catalog", "Nouveautés"],
            ["stores", "Boutiques"],
            ["services", "Services"],
            ["tracking", "Suivi commande"],
          ].map(([key, title]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              aria-current={view === key ? "page" : undefined}
            >
              {title}
            </button>
          ))}
          <span className="nav-spacer" />
          {['Femme','Homme','Accessoires','Maison'].map(category=><button key={category} onClick={()=>{setShopFilter('');setQuery(category);setView('catalog')}}>{category}</button>)}
        </nav>
      </header>
      <main className="p-main">
        {error && (
          <div role="alert" className="p-error">
            {error}
            <button onClick={refresh}>Réessayer</button>
          </div>
        )}
        {notice && (
          <div role="status" className="p-notice">
            {notice}
            <button onClick={() => setNotice("")} aria-label="Fermer">
              <X size={16} />
            </button>
          </div>
        )}
        {view === "catalog" && (
          <>
            <section className="p-hero">
              <div className="hero-copy">
                <div className="hero-badge"><Sparkles/> SÉLECTION RESPONSABLE · TUNISIE</div>
                <p className="eyebrow">STOCKY DOWNY · MODE CIRCULAIRE</p>
                <h1>Le style continue. Les pièces aussi.</h1>
                <p className="hero-lead">
                  Découvrez des pièces choisies auprès de boutiques tunisiennes
                  vérifiées. Moins de gaspillage, plus de caractère.
                </p>
                <div className="hero-actions">
                  <Button asChild size="default">
                    <a href="#collection">Explorer la collection <ArrowRight /></a>
                  </Button>
                  <Button variant="outline" onClick={()=>setView("stores")}>Rencontrer les boutiques</Button>
                </div>
                <div className="hero-proof">
                  <span><BadgeCheck/> Boutiques vérifiées</span>
                  <span><ShieldCheck/> Achat serein</span>
                </div>
              </div>
              <div className="hero-gallery" aria-label="Aperçu de la collection">
                {featuredProducts.slice(0,3).map((p,index)=><button key={p.id} className={`hero-look hero-look-${index+1}`} onClick={()=>{setSelected(p);setModal("detail")}}><img src={p.image || (p.category === "Accessoires" ? "/demo-bag.svg" : "/demo-fashion.svg")} alt={p.name}/><span>{p.name}<b>{money(p.price)}</b></span></button>)}
                {!publicProducts.length && <div className="hero-placeholder"><Heart/><span>La collection arrive</span></div>}
                <div className="hero-note">PIÈCES CHOISIES<br/><b>AVEC INTENTION</b></div>
              </div>
            </section>
            <section className="collection-showcase">
              <div className="section-heading"><div><span>SHOP BY MOOD</span><h2>Une collection pour chaque envie</h2></div><button onClick={()=>{setQuery('');document.getElementById('collection')?.scrollIntoView()}}>Tout voir <ArrowRight/></button></div>
              <div className="collection-tiles">
                {['Femme','Homme','Accessoires','Maison'].map((category,index)=>{const item=publicProducts.find(p=>p.category===category)||publicProducts[index];return <button key={category} onClick={()=>{setQuery(category);document.getElementById('collection')?.scrollIntoView()}}><div>{item?<img src={item.image || (category==='Accessoires'?'/demo-bag.svg':'/demo-fashion.svg')} alt=""/>:<span>{category}</span>}</div><strong>{category}</strong><small>Découvrir la sélection <ArrowRight/></small></button>})}
              </div>
            </section>
            <section className="trust-strip"><div><span className="trust-icon"><BadgeCheck/></span><strong>{data.stores.filter(s=>s.status==='active').length}+</strong><span>Boutiques vérifiées</span></div><div><span className="trust-icon"><Sparkles/></span><strong>{publicProducts.length}+</strong><span>Pièces disponibles</span></div><div><span className="trust-icon"><Heart/></span><strong>100%</strong><span>Mode responsable</span></div><div><span className="trust-icon"><Truck/></span><strong>24</strong><span>Gouvernorats livrés</span></div></section>
            <section className="category-row"><div><p className="eyebrow">EXPLORER</p><h2>Choisir autrement</h2></div><div className="category-pills">{['Tous','Femme','Homme','Accessoires','Maison'].map(category=><button key={category} className={query===category?'active':''} onClick={()=>{setShopFilter('');setQuery(category==='Tous'?'':category)}}>{category}</button>)}</div></section>
            <div className="p-heading" id="collection">
              <div><p className="eyebrow">SÉLECTION CIRCULAIRE</p><h2>La collection</h2></div>
              <label className="p-search">
                <Search size={17} />
                <input
                  aria-label="Rechercher"
                  placeholder="Rechercher une pièce…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
            {loading ? (
              <p>Chargement de la collection…</p>
            ) : (
              <div className="p-grid">
                {publicProducts
                  .filter((p) => !shopFilter || p.store_id === shopFilter)
                  .filter((p) =>
                    `${p.name} ${p.category}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map((p) => (
                    <article className="p-card" key={p.id}>
                      <button
                        className="p-product-cover"
                        onClick={() => {
                          setSelected(p);
                          setModal("detail");
                        }}
                      >
                        <img
                          src={
                            p.image ||
                            (p.category === "Accessoires"
                              ? "/demo-bag.svg"
                              : "/demo-fashion.svg")
                          }
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <div className="p-card-body">
                        <small>
                          {p.store} · {p.category}
                        </small>
                        <button
                          className="p-product-title"
                          onClick={() => {
                            setSelected(p);
                            setModal("detail");
                          }}
                        >
                          {p.name}
                        </button>
                        <strong>{money(p.price)}</strong>
                        <Button
                          disabled={!p.stock}
                          onClick={() => {
                            updateCart({
                              ...cart,
                              [p.id]: Math.min(p.stock, (cart[p.id] || 0) + 1),
                            });
                            setNotice("Pièce ajoutée au panier.");
                          }}
                        >
                          {p.stock ? "Ajouter au panier" : "Épuisé"}
                        </Button>
                      </div>
                    </article>
                  ))}
                {!publicProducts.length && (
                  <div className="p-empty">
                    <Package />
                    <h3>La collection se prépare.</h3>
                    <p>
                      Les pièces apparaîtront ici après validation des
                      boutiques.
                    </p>
                  </div>
                )}
              </div>
            )}
            <section className="pro-banner"><div><p className="eyebrow">VOUS ÊTES PROFESSIONNEL ?</p><h2>Transformez votre stock dormant en opportunité.</h2><p>Créez votre boutique, publiez vos produits et pilotez vos commandes depuis un espace unique.</p></div><Button onClick={()=>setModal('auth')}>Créer ma boutique <ArrowRight/></Button></section>
          </>
        )}
        {view === "stores" && (
          <>
            <div className="page-intro"><p className="eyebrow">CRÉATEURS & REVENDEURS ENGAGÉS</p><h1>Les boutiques circulaires</h1><p>Des professionnels vérifiés qui donnent une nouvelle valeur aux stocks dormants.</p></div>
            <div className="store-grid">
              {data.stores
                .filter((s) => s.status === "active")
                .map((s) => (
                  <article className="store-rich" key={s.id}>
                    <div className="store-cover">{s.cover?<img src={s.cover} alt=""/>:<span>STOCKY PARTNER</span>}</div>
                    <div className="store-rich-body"><div className="store-logo">{s.logo?<img src={s.logo} alt={`Logo ${s.name}`}/>:<Store/>}</div><span className="verified-pill">✓ Boutique vérifiée</span><h2>{s.name}</h2><p>{s.description||"Une sélection responsable issue de stocks valorisés."}</p><small>{s.governorate||"Tunisie"}</small>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery("");
                        setShopFilter(s.id);
                        setView("catalog");
                      }}
                    >
                      Voir la collection
                    </Button>
                    </div>
                  </article>
                ))}
              {!data.stores.some((s) => s.status === "active") && (
                <div className="p-empty">
                  Aucune boutique publiée pour le moment.
                </div>
              )}
            </div>
          </>
        )}
        {view === "workspace" && data.user && (
          <>
            <div className="p-heading">
              <div>
                <p className="eyebrow">ESPACE PROFESSIONNEL</p>
                <h1>{own?.name || "Bienvenue dans votre espace"}</h1>
              </div>
              <Button onClick={() => setModal("store")}>
                {own ? "Modifier ma boutique" : "Créer ma boutique"}
              </Button>
            </div>
            {own && (
              <>
                <p className="p-notice">
                  Statut de votre boutique :{" "}
                  {own.status === "active"
                    ? "Vérifiée"
                    : own.status === "pending"
                      ? "En cours de vérification"
                      : "Suspendue"}
                </p>
                <div className="p-heading">
                  <h2>Mes produits</h2>
                  <Button onClick={() => setModal("product")}>
                    Ajouter un produit
                  </Button>
                </div>
                <ProductTable
                  products={data.products.filter((p) => p.store_id === own.id)}
                  inventory={(id, stock) =>
                    act({ action: "inventory", id, stock })
                  }
                />
                <h2>Mes commandes</h2>
                <OrderTable
                  orders={data.orders}
                  change={(id, status) =>
                    act({ action: "orderStatus", id, status })
                  }
                />
              </>
            )}
          </>
        )}
        {view === "admin" && admin && (
          <>
            <p className="eyebrow">ADMINISTRATION PRIVÉE</p>
            <h1>Pilotage de la plateforme</h1>
            <div className="p-metrics">
              {[
                ["Boutiques", data.stores.length],
                ["Produits", data.products.length],
                ["Commandes", data.orders.length],
              ].map(([name, value]) => (
                <article className="p-card p-card-body" key={name}>
                  <small>{name}</small>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>
            <h2>Vérification des boutiques</h2>
            <div className="p-table">
              <table>
                <thead>
                  <tr>
                    <th>Boutique</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stores.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.status}</td>
                      <td>
                        <Button
                          disabled={busy}
                          onClick={() =>
                            act({
                              action: "moderate",
                              entity: "store",
                              id: s.id,
                              status:
                                s.status === "active" ? "suspended" : "active",
                            })
                          }
                        >
                          {s.status === "active" ? "Suspendre" : "Valider"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2>Modération des produits</h2>
            <ProductTable
              products={data.products}
              moderate={(p) =>
                act({
                  action: "moderate",
                  entity: "product",
                  id: p.id,
                  status: p.status === "active" ? "suspended" : "active",
                })
              }
            />
            <h2>Commandes</h2>
            <OrderTable
              orders={data.orders}
              change={(id, status) =>
                act({ action: "orderStatus", id, status })
              }
            />
            <div className="p-danger">
              <Button onClick={() => act({ action: "seedDemo" })}>
                Charger le catalogue démo
              </Button>
              <p>
                Supprimer uniquement les produits marqués comme démonstration.
              </p>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm("Supprimer les produits de démonstration ?"))
                    act({ action: "deleteDemo" });
                }}
              >
                Effacer les données de démonstration
              </Button>
            </div>
            <Operations data={data} act={act} />
          </>
        )}
        {view === "services" && (
          <Services
            requests={data.requests}
            act={act}
            authenticated={!!data.user}
            onLogin={() => setModal("auth")}
          />
        )}
        {view === "tracking" && <Tracking act={act} />}
      </main>
      <footer className="p-footer">
        <span>Stocky Downy · Du stock dormant au style circulaire.</span>
        <a href="https://wa.me/21626107128" target="_blank" rel="noreferrer">
          developpé par chafik dridi <MessageCircle size={18} /> +21626107128
        </a>
      </footer>
      <Dialog.Root
        open={!!modal}
        onOpenChange={(open) => {
          if (!open) setModal("");
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="p-overlay" />
          <Dialog.Content className="p-dialog">
            <Dialog.Title>
              {{
                auth: "Espace boutique",
                cart: "Votre panier",
                store: "Votre boutique",
                product: "Nouveau produit",
                detail: selected?.name,
              }[modal] || ""}
            </Dialog.Title>
            <Dialog.Description>
              {modal === "auth"
                ? "Connectez-vous ou lancez votre boutique en quelques étapes."
                : "Stocky Downy"}
            </Dialog.Description>
            <Dialog.Close className="p-close" aria-label="Fermer">
              <X size={20} />
            </Dialog.Close>
            {error && (
              <p role="alert" className="p-error">
                {error}
              </p>
            )}
            {modal === "auth" && (
              <SellerOnboarding busy={busy} act={act} onComplete={()=>{setModal("");setView("workspace")}}/>
            )}
            {modal === "detail" && selected && (
              <>
                <p>{selected.description}</p>
                <p>
                  {selected.category} · {selected.store}
                </p>
                <strong>{money(selected.price)}</strong>
                <Button
                  disabled={!selected.stock}
                  onClick={() => {
                    updateCart({
                      ...cart,
                      [selected.id]: Math.min(
                        selected.stock,
                        (cart[selected.id] || 0) + 1,
                      ),
                    });
                    setModal("cart");
                  }}
                >
                  Ajouter au panier
                </Button>
              </>
            )}
            {modal === "cart" && (
              <>
                {Object.entries(cart).map(([id, q]) => {
                  const p = data.products.find((p) => p.id === id);
                  return (
                    <div className="p-cart-line" key={id}>
                      <span>
                        {p?.name || "Article indisponible"} × {q}
                      </span>
                      <strong>{money((p?.price || 0) * q)}</strong>
                      <button
                        aria-label="Retirer"
                        onClick={() => {
                          const next = { ...cart };
                          delete next[id];
                          updateCart(next);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
                <strong>Total articles : {money(total)}</strong>
                <p>
                  Livraison :{" "}
                  {money(
                    data.config.deliveryFee *
                      1000 *
                      new Set(
                        Object.keys(cart).map(
                          (id) =>
                            data.products.find((p) => p.id === id)?.store_id,
                        ),
                      ).size,
                  )}{" "}
                  · {data.config.deliveryFee} DT par boutique
                </p>
                <strong>
                  Total à payer :{" "}
                  {money(
                    total +
                      data.config.deliveryFee *
                        1000 *
                        new Set(
                          Object.keys(cart).map(
                            (id) =>
                              data.products.find((p) => p.id === id)?.store_id,
                          ),
                        ).size,
                  )}
                </strong>
                {Object.keys(cart).length > 0 ? (
                  <form onSubmit={(e) => form(e, "checkout")}>
                    <p>Paiement à la livraison. Commande sans compte client.</p>
                    <label>
                      Nom complet
                      <input name="customer" required autoComplete="name" />
                    </label>
                    <label>
                      Téléphone
                      <input
                        name="phone"
                        required
                        type="tel"
                        autoComplete="tel"
                      />
                    </label>
                    <label>
                      Adresse de livraison
                      <textarea
                        name="address"
                        required
                        autoComplete="street-address"
                      />
                    </label>
                    <Button disabled={busy}>Confirmer la commande</Button>
                  </form>
                ) : (
                  <p>Votre panier est vide.</p>
                )}
              </>
            )}
            {modal === "store" && (
              <form onSubmit={(e) => form(e, "store")}>
                <label>
                  Nom de la boutique
                  <input name="name" required defaultValue={own?.name} />
                </label>
                <label>
                  Téléphone
                  <input name="phone" type="tel" required />
                </label>
                <p>
                  Votre boutique est soumise à vérification avant publication.
                </p>
                <Button disabled={busy}>Enregistrer</Button>
              </form>
            )}
            {modal === "product" && (
              <form onSubmit={(e) => form(e, "product")}>
                <label>
                  Nom
                  <input name="name" required maxLength={150} />
                </label>
                <label>
                  Prix en DT
                  <input
                    type="number"
                    name="price"
                    min="0.001"
                    step="0.001"
                    required
                  />
                </label>
                <label>
                  Stock
                  <input type="number" name="stock" min="0" step="1" required />
                </label>
                <label>
                  Catégorie
                  <select name="category">
                    <option>Femme</option>
                    <option>Homme</option>
                    <option>Accessoires</option>
                    <option>Maison</option>
                  </select>
                </label>
                <label>
                  Description
                  <textarea name="description" required />
                </label>
                <label>
                  Photo du produit (JPEG, PNG, WebP · 1,5 Mo)
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBusy(true);
                      try {
                        const form = new FormData();
                        form.set("file", file);
                        const r = await fetch("/api/media", {
                          method: "POST",
                          body: form,
                        });
                        const b = await r.json();
                        if (!r.ok) throw Error(b.error);
                        setProductImage(b.url);
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : "Échec upload",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </label>
                {productImage && (
                  <img
                    src={productImage}
                    alt="Photo téléversée"
                    className="h-24 rounded-md object-cover"
                  />
                )}
                <Button disabled={busy}>Soumettre à validation</Button>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
function ProductTable({
  products,
  moderate,
  inventory,
}: {
  products: Product[];
  moderate?: (p: Product) => void;
  inventory?: (id: string, stock: number) => void;
}) {
  return (
    <div className="p-table">
      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th>Prix</th>
            <th>Stock</th>
            <th>Statut</th>
            {moderate && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{money(p.price)}</td>
              <td>
                {inventory ? (
                  <input
                    aria-label={`Stock ${p.name}`}
                    type="number"
                    min={0}
                    defaultValue={p.stock}
                    key={p.stock}
                    onBlur={(e) => {
                      const stock = Number(e.target.value);
                      if (
                        Number.isInteger(stock) &&
                        stock >= 0 &&
                        stock !== p.stock
                      )
                        inventory(p.id, stock);
                    }}
                  />
                ) : (
                  p.stock
                )}
              </td>
              <td>{p.status}</td>
              {moderate && (
                <td>
                  <Button onClick={() => moderate(p)}>
                    {p.status === "active" ? "Masquer" : "Publier"}
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!products.length && <p>Aucun produit.</p>}
    </div>
  );
}
function SellerAuth({
  busy,
  submit,
}: {
  busy: boolean;
  submit: (body: Record<string, unknown>) => void;
}) {
  const [register, setRegister] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit({
          action: register ? "register" : "login",
          ...Object.fromEntries(new FormData(e.currentTarget)),
        });
      }}
    >
      <div className="flex gap-2">
        <Button
          type="button"
          variant={register ? "outline" : "primary"}
          onClick={() => setRegister(false)}
        >
          Connexion
        </Button>
        <Button
          type="button"
          variant={register ? "primary" : "outline"}
          onClick={() => setRegister(true)}
        >
          Créer ma boutique
        </Button>
      </div>
      <label>
        E-mail professionnel
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Mot de passe
        <input
          name="password"
          type="password"
          minLength={10}
          maxLength={128}
          autoComplete={register ? "new-password" : "current-password"}
          required
        />
      </label>
      {register && (
        <label className="flex gap-2">
          <input type="checkbox" required />
          Je crée un compte professionnel pour ma boutique.
        </label>
      )}
      <Button disabled={busy}>
        {busy
          ? "Veuillez patienter…"
          : register
            ? "Créer mon compte"
            : "Se connecter"}
      </Button>
    </form>
  );
}
function OrderTable({
  orders,
  change,
}: {
  orders: Order[];
  change: (id: string, status: string) => void;
}) {
  return (
    <div className="p-table">
      <table>
        <thead>
          <tr>
            <th>Commande</th>
            <th>Client</th>
            <th>Total</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id.slice(0, 8)}</td>
              <td>{o.customer}</td>
              <td>{money(o.total)}</td>
              <td>
                <select
                  aria-label="Statut de commande"
                  value={o.status}
                  onChange={(e) => change(o.id, e.target.value)}
                >
                  <option value={o.status}>{o.status}</option>
                  {(
                    {
                      new: ["confirmed", "cancelled"],
                      confirmed: ["preparing", "cancelled"],
                      preparing: ["shipped"],
                      shipped: ["delivered"],
                    } as Record<string, string[]>
                  )[o.status]?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && <p>Aucune commande.</p>}
    </div>
  );
}
