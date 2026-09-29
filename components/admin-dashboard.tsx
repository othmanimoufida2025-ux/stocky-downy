"use client";

import { useState } from "react";
import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  PackageCheck,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import { Operations, type OperationsData } from "./operations";
import { STATUS_FR } from "@/lib/order-ref";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  store: string;
};
type Shop = { id: string; name: string; status: string };
type Order = { id: string; ref?: string; customer: string; total: number; status: string };
type AdminData = OperationsData & {
  products: Product[];
  stores: Shop[];
  orders: Order[];
};
const money = (value: number) => `${(value / 1000).toFixed(2)} DT`;
const items = [
  ["overview", "Vue générale", LayoutDashboard],
  ["stores", "Boutiques", Building2],
  ["products", "Produits", PackageCheck],
  ["orders", "Commandes", ClipboardList],
  ["services", "Services", LifeBuoy],
  ["users", "Utilisateurs", Users],
  ["analytics", "Analytics", BarChart3],
  ["settings", "Paramètres & audit", Settings],
] as const;

export function AdminDashboard({
  data,
  act,
  busy,
}: {
  data: AdminData;
  act: (body: Record<string, unknown>) => Promise<unknown>;
  busy: boolean;
}) {
  const [section, setSection] = useState("overview");
  const [query, setQuery] = useState("");
  const revenue = data.orders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingStores = data.stores.filter(
    (s) => s.status === "pending",
  ).length;
  const pendingProducts = data.products.filter(
    (p) => p.status === "pending",
  ).length;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">
          <img src="/stocky-logo.svg" alt="Stocky" />
        </a>
        <p>SUPER ADMIN</p>
        <nav>
          {items.map(([key, title, Icon]) => (
            <button
              key={key}
              className={section === key ? "active" : ""}
              onClick={() => setSection(key)}
            >
              <Icon />
              {title}
              {key === "stores" && pendingStores > 0 && <b>{pendingStores}</b>}
              {key === "products" && pendingProducts > 0 && (
                <b>{pendingProducts}</b>
              )}
            </button>
          ))}
        </nav>
        <a className="admin-exit" href="/">
          <LogOut />
          Retour au site
        </a>
      </aside>
      <section className="admin-content">
        <header className="admin-top">
          <div>
            <p className="eyebrow">CENTRE DE CONTRÔLE</p>
            <h1>{items.find((x) => x[0] === section)?.[1]}</h1>
          </div>
          <div className="admin-identity">
            <ShieldCheck />
            <span>
              Session protégée
              <br />
              <small>Super administrateur</small>
            </span>
          </div>
        </header>
        {section === "overview" && (
          <>
            <div className="admin-kpis">
              <Kpi
                label="Chiffre d’affaires"
                value={money(revenue)}
                note={`${data.orders.length} commandes`}
              />
              <Kpi
                label="Boutiques actives"
                value={String(
                  data.stores.filter((s) => s.status === "active").length,
                )}
                note={`${pendingStores} à vérifier`}
              />
              <Kpi
                label="Produits publiés"
                value={String(
                  data.products.filter((p) => p.status === "active").length,
                )}
                note={`${pendingProducts} à modérer`}
              />
              <Kpi
                label="Demandes services"
                value={String(data.requests.length)}
                note={`${data.requests.filter((r) => r.status !== "resolved").length} ouvertes`}
              />
            </div>
            <div className="admin-columns">
              <article className="admin-panel">
                <h2>Actions prioritaires</h2>
                {[
                  ["Boutiques en attente", pendingStores, "stores"],
                  ["Produits à modérer", pendingProducts, "products"],
                  [
                    "Demandes non résolues",
                    data.requests.filter((r) => r.status !== "resolved").length,
                    "services",
                  ],
                ].map(([label, count, target]) => (
                  <button
                    key={String(label)}
                    onClick={() => setSection(String(target))}
                  >
                    <span>{label}</span>
                    <b>{count}</b>
                  </button>
                ))}
              </article>
              <article className="admin-panel">
                <h2>Santé de la plateforme</h2>
                <div className="health-row">
                  <span>Base Turso</span>
                  <b className="healthy">Synchronisée</b>
                </div>
                <div className="health-row">
                  <span>Sessions</span>
                  <b className="healthy">Protégées</b>
                </div>
                <div className="health-row">
                  <span>Catalogue</span>
                  <b>{data.products.length} articles</b>
                </div>
              </article>
            </div>
          </>
        )}
        {section === "stores" && (
          <><div className="admin-toolbar"><input aria-label="Rechercher une boutique" placeholder="Rechercher une boutique…" value={query} onChange={(e)=>setQuery(e.target.value)} /></div><AdminTable
            title="Vérification des boutiques"
            headers={["Boutique", "Statut", "Action"]}
          >
            {[...data.stores].sort((a,b)=>Number(b.status === "pending")-Number(a.status === "pending")).filter(s=>s.name.toLowerCase().includes(query.toLowerCase())).map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                </td>
                <td>
                  <Status value={s.status} />
                </td>
                <td>
                  <Button
                    disabled={busy}
                    variant={s.status === "active" ? "danger" : "primary"}
                    onClick={() =>
                      act({
                        action: "moderate",
                        entity: "store",
                        id: s.id,
                        status: s.status === "active" ? "suspended" : "active",
                      })
                    }
                  >
                    {s.status === "active" ? "Suspendre" : "Valider"}
                  </Button>
                </td>
              </tr>
            ))}
          </AdminTable></>
        )}
        {section === "products" && (
          <>
            <div className="admin-toolbar">
              <p>Les produits soumis restent invisibles jusqu’à validation.</p>
              <input aria-label="Rechercher un produit" placeholder="Rechercher un produit…" value={query} onChange={(e)=>setQuery(e.target.value)} />
              <Button
                variant="outline"
                onClick={() => act({ action: "seedDemo" })}
              >
                <Boxes />
                Charger les données démo
              </Button>
            </div>
            <AdminTable
              title="Modération du catalogue"
              headers={[
                "Produit",
                "Boutique",
                "Prix",
                "Stock",
                "Statut",
                "Action",
              ]}
            >
              {data.products.filter(p=>`${p.name} ${p.store}`.toLowerCase().includes(query.toLowerCase())).map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.store}</td>
                  <td>{money(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <Status value={p.status} />
                  </td>
                  <td>
                    <Button
                      disabled={busy}
                      variant={p.status === "active" ? "danger" : "primary"}
                      onClick={() =>
                        act({
                          action: "moderate",
                          entity: "product",
                          id: p.id,
                          status:
                            p.status === "active" ? "suspended" : "active",
                        })
                      }
                    >
                      {p.status === "active" ? "Masquer" : "Publier"}
                    </Button>
                  </td>
                </tr>
              ))}
            </AdminTable>
            <div className="p-danger">
              <p>
                La suppression cible uniquement les produits marqués comme
                démonstration.
              </p>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm("Supprimer les produits de démonstration ?"))
                    act({ action: "deleteDemo" });
                }}
              >
                Effacer les données démo
              </Button>
            </div>
          </>
        )}
        {section === "orders" && (
          <><div className="admin-toolbar"><input aria-label="Rechercher une commande" placeholder="Référence ou client…" value={query} onChange={(e)=>setQuery(e.target.value)} /></div><AdminTable
            title="Toutes les commandes"
            headers={["Référence", "Client", "Total", "Statut"]}
          >
            {data.orders.filter(o=>`${o.ref || o.id} ${o.customer}`.toLowerCase().includes(query.toLowerCase())).map((o) => (
              <tr key={o.id}>
                <td>{o.ref || o.id.slice(0, 8)}</td>
                <td>{o.customer}</td>
                <td>{money(o.total)}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) =>
                      act({
                        action: "orderStatus",
                        id: o.id,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value={o.status}>{STATUS_FR[o.status] || o.status}</option>
                    {transitions[o.status]?.map((s) => (
                      <option key={s} value={s}>{STATUS_FR[s] || s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </AdminTable></>
        )}
        {section === "services" && <Operations key="services" data={data} act={act} initialTab="Demandes" />}{" "}
        {section === "users" && (
          <Operations key="users" data={data} act={act} initialTab="Utilisateurs" />
        )}{" "}
        {section === "settings" && <Operations key="settings" data={data} act={act} initialTab="Paramètres" />}{" "}
        {section === "analytics" && (
          <div className="admin-kpis">
            <Kpi
              label="Panier moyen"
              value={
                data.orders.length
                  ? money(revenue / data.orders.length)
                  : "0 DT"
              }
              note="Toutes boutiques"
            />
            <Kpi
              label="Taux boutiques actives"
              value={`${data.stores.length ? Math.round((data.stores.filter((s) => s.status === "active").length / data.stores.length) * 100) : 0}%`}
              note="Vérifiées"
            />
            <Kpi
              label="Stock disponible"
              value={String(data.products.reduce((s, p) => s + p.stock, 0))}
              note="Unités"
            />
            <Kpi
              label="Commission"
              value={`${data.config.commission}%`}
              note="Paramètre plateforme"
            />
          </div>
        )}
      </section>
    </div>
  );
}
const transitions: Record<string, string[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["shipped"],
  shipped: ["delivered"],
};
function Kpi({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
function Status({ value }: { value: string }) {
  const labels: Record<string,string> = { active:"Active", pending:"En attente", suspended:"Suspendue", archived:"Archivé", ...STATUS_FR };
  return <span className={`admin-status ${value}`}>{labels[value] || value}</span>;
}
function AdminTable({
  title,
  headers,
  children,
}: {
  title: string;
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="admin-panel admin-table">
      <h2>{title}</h2>
      <div>
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  );
}
