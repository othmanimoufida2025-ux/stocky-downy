"use client";

import { useState, useMemo, FormEvent } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
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
  Search,
  ExternalLink,
  Edit,
  Trash2,
  KeyRound,
  Plus,
  X,
  Store,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Check,
  Download,
} from "lucide-react";
import { Button } from "./ui/button";
import { Operations, type OperationsData } from "./operations";
import { STATUS_FR } from "@/lib/order-ref";

export type Product = {
  id: string;
  store_id?: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  store: string;
  slug?: string;
  store_slug?: string;
  category?: string;
  description?: string;
  image?: string;
  condition?: string;
  demo?: number;
};

export type Shop = {
  id: string;
  owner: string;
  name: string;
  status: string;
  slug?: string;
  phone?: string;
  description?: string;
  logo?: string;
  cover?: string;
  address?: string;
  governorate?: string;
  whatsapp?: string;
  owner_email?: string;
  product_count?: number;
};

export type Order = {
  id: string;
  ref?: string;
  customer: string;
  total: number;
  status: string;
  created?: string;
};

export type AdminUser = {
  id: string;
  email: string;
  role: string;
  created: string;
  store_id?: string;
  store_name?: string;
  store_slug?: string;
  nom?: string;
  prenom?: string;
};

export type AdminData = OperationsData & {
  products: Product[];
  stores: Shop[];
  orders: Order[];
  users: AdminUser[];
};

const money = (value: number) => `${(value / 1000).toFixed(2)} DT`;

const items = [
  ["overview", "Vue générale", LayoutDashboard],
  ["stores", "Boutiques", Building2],
  ["products", "Produits", PackageCheck],
  ["users", "Utilisateurs", Users],
  ["orders", "Commandes", ClipboardList],
  ["services", "Services", LifeBuoy],
  ["analytics", "Analytics", BarChart3],
  ["settings", "Paramètres & audit", Settings],
] as const;


function exportExcel(filename: string, rows: string[][]) {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Données");
    XLSX.writeFile(wb, filename);
  });
}

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);

  const [selectedStore, setSelectedStore] = useState<Shop | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const notify = (message: string, isError = false) => {
    setFeedback({ type: isError ? "error" : "success", message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const revenue = data.orders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingStores = data.stores.filter((s) => s.status === "pending").length;
  const pendingProducts = data.products.filter((p) => p.status === "pending").length;

  // Filtered Stores
  const filteredStores = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.stores
      .filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          (s.phone && s.phone.includes(q)) ||
          (s.governorate && s.governorate.toLowerCase().includes(q)) ||
          (s.owner_email && s.owner_email.toLowerCase().includes(q)) ||
          (s.address && s.address.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
  }, [data.stores, query, statusFilter]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.products
      .filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (catFilter !== "all" && p.category !== catFilter) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.store.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
  }, [data.products, query, statusFilter, catFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.nom && u.nom.toLowerCase().includes(q)) ||
        (u.prenom && u.prenom.toLowerCase().includes(q)) ||
        (u.store_name && u.store_name.toLowerCase().includes(q))
      );
    });
  }, [data.users, query, roleFilter]);

  // Categories list for product filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    data.products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [data.products]);

  // Handlers
  async function handleEditUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUser) return;
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const role = String(form.get("role") || "").trim();
    const nom = String(form.get("nom") || "").trim();
    const prenom = String(form.get("prenom") || "").trim();
    const res = await act({
      action: "adminEditUser",
      id: selectedUser.id,
      email,
      role,
      nom,
      prenom,
    });
    if (res) {
      notify("Utilisateur mis à jour avec succès.");
      setSelectedUser(null);
    } else {
      notify("Erreur lors de la modification de l'utilisateur.", true);
    }
  }

  async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!passwordUser) return;
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    if (password.length < 6) {
      notify("Le mot de passe doit comporter au moins 6 caractères.", true);
      return;
    }
    const res = await act({
      action: "adminResetPassword",
      id: passwordUser.id,
      password,
    });
    if (res) {
      notify(`Mot de passe réinitialisé pour ${passwordUser.email}.`);
      setPasswordUser(null);
    } else {
      notify("Erreur lors de la réinitialisation du mot de passe.", true);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    if (!confirm(`Supprimer définitivement l'utilisateur ${user.email} et ses données ?`)) return;
    const res = await act({ action: "adminDeleteUser", id: user.id });
    if (res) {
      notify(`Utilisateur ${user.email} supprimé.`);
      if (selectedUser?.id === user.id) setSelectedUser(null);
    } else {
      notify("Impossible de supprimer cet utilisateur.", true);
    }
  }

  async function handleCreateUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const role = String(form.get("role") || "seller").trim();
    const password = String(form.get("password") || "");
    const nom = String(form.get("nom") || "").trim();
    const prenom = String(form.get("prenom") || "").trim();
    const res = await act({
      action: "adminCreateUser",
      email,
      role,
      password,
      nom,
      prenom,
    });
    if (res) {
      notify(`Utilisateur ${email} créé avec succès.`);
      setCreateUserOpen(false);
    } else {
      notify("Erreur lors de la création du compte.", true);
    }
  }

  async function handleEditStore(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStore) return;
    const form = new FormData(e.currentTarget);
    const res = await act({
      action: "adminEditStore",
      id: selectedStore.id,
      name: String(form.get("name") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      governorate: String(form.get("governorate") || "").trim(),
      address: String(form.get("address") || "").trim(),
      whatsapp: String(form.get("whatsapp") || "").trim(),
      description: String(form.get("description") || "").trim(),
      status: String(form.get("status") || "pending"),
    });
    if (res) {
      notify("Informations de la boutique enregistrées.");
      setSelectedStore(null);
    } else {
      notify("Erreur lors de l'enregistrement de la boutique.", true);
    }
  }

  async function handleDeleteStore(store: Shop) {
    if (!confirm(`Supprimer définitivement la boutique "${store.name}" et tous ses produits ?`)) return;
    const res = await act({ action: "adminDeleteStore", id: store.id });
    if (res) {
      notify(`Boutique "${store.name}" supprimée.`);
      if (selectedStore?.id === store.id) setSelectedStore(null);
    } else {
      notify("Impossible de supprimer cette boutique.", true);
    }
  }

  async function handleModerateStore(store: Shop, status: "active" | "suspended" | "pending") {
    const res = await act({
      action: "moderate",
      entity: "store",
      id: store.id,
      status,
    });
    if (res) {
      notify(`Statut de "${store.name}" mis à jour (${status}).`);
      if (selectedStore?.id === store.id) {
        setSelectedStore({ ...selectedStore, status });
      }
    } else {
      notify("Erreur lors de la modération.", true);
    }
  }

  async function handleEditProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedProduct) return;
    const form = new FormData(e.currentTarget);
    const res = await act({
      action: "adminEditProduct",
      id: selectedProduct.id,
      name: String(form.get("name") || "").trim(),
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      category: String(form.get("category") || "Mode"),
      condition: String(form.get("condition") || "Très bon état"),
      description: String(form.get("description") || ""),
      status: String(form.get("status") || "pending"),
    });
    if (res) {
      notify("Produit mis à jour avec succès.");
      setSelectedProduct(null);
    } else {
      notify("Erreur lors de la mise à jour du produit.", true);
    }
  }

  async function handleDeleteProduct(product: Product) {
    if (!confirm(`Supprimer définitivement le produit "${product.name}" ?`)) return;
    const res = await act({ action: "adminDeleteProduct", id: product.id });
    if (res) {
      notify(`Produit "${product.name}" supprimé.`);
      if (selectedProduct?.id === product.id) setSelectedProduct(null);
    } else {
      notify("Impossible de supprimer ce produit.", true);
    }
  }

  async function handleModerateProduct(product: Product, status: "active" | "suspended") {
    const res = await act({
      action: "moderate",
      entity: "product",
      id: product.id,
      status,
    });
    if (res) {
      notify(`Produit "${product.name}" ${status === "active" ? "publié" : "masqué"}.`);
      if (selectedProduct?.id === product.id) {
        setSelectedProduct({ ...selectedProduct, status });
      }
    } else {
      notify("Erreur lors de la modération du produit.", true);
    }
  }

  return (
    <div className="admin-shell">
      {/* SIDEBAR */}
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
              onClick={() => {
                setSection(key);
                setQuery("");
                setStatusFilter("all");
                setRoleFilter("all");
                setCatFilter("all");
              }}
            >
              <Icon />
              {title}
              {key === "stores" && pendingStores > 0 && <b>{pendingStores}</b>}
              {key === "products" && pendingProducts > 0 && <b>{pendingProducts}</b>}
              {key === "users" && <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.8 }}>{data.users.length}</span>}
            </button>
          ))}
        </nav>
        <div style={{ position: "absolute", bottom: "16px", left: "14px", right: "14px", display: "grid", gap: "6px" }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", color: "#d8c6c0", textDecoration: "none", fontSize: "13px" }}
          >
            <ExternalLink size={15} />
            Voir la boutique
          </a>
          <button
            type="button"
            disabled={busy}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#ffb4a8", cursor: "pointer", fontSize: "13px", fontWeight: 600, width: "100%", textAlign: "left" }}
            onClick={async () => {
              await act({ action: "logout" });
              try { sessionStorage.clear(); } catch {}
              window.location.replace("/superadmin");
            }}
          >
            <LogOut size={15} />
            Déconnexion admin
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
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

        {/* FEEDBACK TOAST */}
        {feedback && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "8px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: feedback.type === "success" ? "#e7f4ec" : "#fbe5e3",
              color: feedback.type === "success" ? "#2c694e" : "#9c3028",
              fontWeight: 600,
            }}
          >
            {feedback.type === "success" ? <Check size={18} /> : <X size={18} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* OVERVIEW SECTION */}
        {section === "overview" && (
          <>
            <div className="admin-kpis">
              <Kpi label="Chiffre d’affaires" value={money(revenue)} note={`${data.orders.length} commandes`} />
              <Kpi
                label="Boutiques actives"
                value={String(data.stores.filter((s) => s.status === "active").length)}
                note={`${pendingStores} en attente`}
              />
              <Kpi
                label="Produits en vente"
                value={String(data.products.filter((p) => p.status === "active").length)}
                note={`${pendingProducts} à modérer`}
              />
              <Kpi
                label="Utilisateurs inscrits"
                value={String(data.users.length)}
                note={`${data.users.filter((u) => u.role === "seller").length} vendeurs`}
              />
            </div>
            <div className="admin-columns">
              <article className="admin-panel">
                <h2>Actions prioritaires</h2>
                {[
                  ["Boutiques en attente", pendingStores, "stores"],
                  ["Produits à modérer", pendingProducts, "products"],
                  ["Utilisateurs à gérer", data.users.length, "users"],
                  ["Demandes non résolues", data.requests.filter((r) => r.status !== "resolved").length, "services"],
                ].map(([label, count, target]) => (
                  <button key={String(label)} onClick={() => setSection(String(target))}>
                    <span>{label}</span>
                    <b>{count}</b>
                  </button>
                ))}
              </article>
              <article className="admin-panel">
                <h2>Santé de la plateforme</h2>
                <div className="health-row">
                  <span>Base de données</span>
                  <b className="healthy">Connectée</b>
                </div>
                <div className="health-row">
                  <span>Service Email (SMTP)</span>
                  <b className="healthy">Opérationnel</b>
                </div>
                <div className="health-row">
                  <span>Sessions & Authentification</span>
                  <b className="healthy">Sécurisées</b>
                </div>
                <div className="health-row">
                  <span>Catalogue d'articles</span>
                  <b>{data.products.length} articles répertoriés</b>
                </div>
              </article>
            </div>
          </>
        )}

        {/* BOUTIQUES / STORES SECTION */}
        {section === "stores" && (
          <>
            <div className="admin-toolbar" style={{ flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "280px" }}>
                <input
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--sd-line, #e2d7d0)", background: "#fff" }}
                  placeholder="Rechercher boutique, gérant, téléphone, gouvernorat…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Statut :</label>
                <select
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff" }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous ({data.stores.length})</option>
                  <option value="pending">En attente ({pendingStores})</option>
                  <option value="active">Actives ({data.stores.filter((s) => s.status === "active").length})</option>
                  <option value="suspended">Suspendues ({data.stores.filter((s) => s.status === "suspended").length})</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => exportExcel("boutiques.xlsx", [
                  ["Nom", "Statut", "Email gérant", "Téléphone", "Gouvernorat", "Adresse", "WhatsApp", "Produits", "Slug"],
                  ...filteredStores.map((s) => [
                    s.name, s.status, s.owner_email || "", s.phone || "",
                    s.governorate || "", s.address || "", s.whatsapp || "",
                    String(s.product_count ?? 0), s.slug || "",
                  ]),
                ])}>
                  <Download size={14} /> Exporter Excel
                </Button>
              </div>
            </div>

            <AdminTable title={`Gestion des boutiques (${filteredStores.length})`} headers={["Boutique", "Gérant & Contact", "Gouvernorat", "Produits", "Statut", "Actions"]}>
              {filteredStores.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {s.logo ? (
                        <img src={s.logo} alt={s.name} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "1px solid #ddd" }} />
                      ) : (
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#f6ece5", display: "grid", placeItems: "center", color: "#812c2c" }}>
                          <Store size={18} />
                        </div>
                      )}
                      <div>
                        <strong>{s.name}</strong>
                        {s.slug && (
                          <div style={{ marginTop: "2px" }}>
                            <Link href={`/boutique/${s.slug}`} target="_blank" style={{ fontSize: "12px", color: "#812c2c", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              Voir boutique <ExternalLink size={12} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      {s.owner_email && <div style={{ fontSize: "13px" }}>{s.owner_email}</div>}
                      {s.phone && <div style={{ fontSize: "12px", color: "#666" }}>Tel: {s.phone}</div>}
                    </div>
                  </td>
                  <td>{s.governorate || "—"}</td>
                  <td>
                    <strong style={{ color: "#812c2c" }}>{s.product_count ?? 0}</strong>
                  </td>
                  <td>
                    <Status value={s.status} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                      <Button size="sm" variant="outline" onClick={() => setSelectedStore(s)}>
                        <Edit size={14} /> Voir / Modifier
                      </Button>
                      {s.status === "pending" && (
                        <Button size="sm" variant="primary" disabled={busy} onClick={() => handleModerateStore(s, "active")}>
                          Valider
                        </Button>
                      )}
                      {s.status === "active" && (
                        <Button size="sm" variant="soft" disabled={busy} onClick={() => handleModerateStore(s, "suspended")}>
                          Suspendre
                        </Button>
                      )}
                      {s.status === "suspended" && (
                        <Button size="sm" variant="primary" disabled={busy} onClick={() => handleModerateStore(s, "active")}>
                          Réactiver
                        </Button>
                      )}
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => handleDeleteStore(s)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredStores.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#888" }}>
                    Aucune boutique trouvée pour ces critères.
                  </td>
                </tr>
              )}
            </AdminTable>
          </>
        )}

        {/* PRODUITS / PRODUCTS SECTION */}
        {section === "products" && (
          <>
            <div className="admin-toolbar" style={{ flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px" }}>
                <input
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--sd-line, #e2d7d0)", background: "#fff" }}
                  placeholder="Rechercher produit, boutique, catégorie…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <select
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff" }}
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                >
                  <option value="all">Toutes catégories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff" }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous statuts ({data.products.length})</option>
                  <option value="pending">En attente ({pendingProducts})</option>
                  <option value="active">Publiés ({data.products.filter((p) => p.status === "active").length})</option>
                  <option value="suspended">Masqués ({data.products.filter((p) => p.status === "suspended").length})</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => act({ action: "seedDemo" })}>
                  <Boxes size={14} /> Données démo
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportExcel("produits.xlsx", [
                  ["Nom", "Boutique", "Prix DT", "Stock", "Catégorie", "État", "Statut", "Description", "Slug"],
                  ...filteredProducts.map((p) => [
                    p.name, p.store, String((p.price / 1000).toFixed(2)), String(p.stock),
                    p.category || "", p.condition || "", p.status,
                    p.description || "", p.slug || "",
                  ]),
                ])}>
                  <Download size={14} /> Exporter Excel
                </Button>
              </div>
            </div>

            <AdminTable title={`Catalogue & Modération (${filteredProducts.length} articles)`} headers={["Article", "Boutique", "Prix", "Stock", "Catégorie", "Statut", "Actions"]}>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {p.image ? (
                        <img src={p.image} alt={p.name} style={{ width: 44, height: 44, borderRadius: "6px", objectFit: "cover", border: "1px solid #eee" }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: "6px", background: "#fff0df", display: "grid", placeItems: "center", color: "#c38961" }}>
                          <ShoppingBag size={20} />
                        </div>
                      )}
                      <div>
                        {p.slug ? (
                          <Link href={`/produit/${p.slug}`} target="_blank" style={{ fontWeight: 700, color: "var(--sd-wine, #812c2c)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            {p.name} <ExternalLink size={13} />
                          </Link>
                        ) : (
                          <strong>{p.name}</strong>
                        )}
                        <div style={{ fontSize: "11px", color: "#888" }}>{p.condition || "Très bon état"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {p.store_slug ? (
                      <Link href={`/boutique/${p.store_slug}`} target="_blank" style={{ color: "#555", textDecoration: "none", fontSize: "13px" }}>
                        {p.store}
                      </Link>
                    ) : (
                      <span style={{ fontSize: "13px" }}>{p.store}</span>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: "var(--sd-wine, #812c2c)" }}>{money(p.price)}</strong>
                  </td>
                  <td>{p.stock}</td>
                  <td>
                    <span style={{ padding: "3px 8px", borderRadius: "12px", background: "#f5f0ec", fontSize: "12px" }}>{p.category || "Mode"}</span>
                  </td>
                  <td>
                    <Status value={p.status} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                      <Button size="sm" variant="outline" onClick={() => setSelectedProduct(p)}>
                        <Edit size={14} /> Voir / Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant={p.status === "active" ? "soft" : "primary"}
                        disabled={busy}
                        onClick={() => handleModerateProduct(p, p.status === "active" ? "suspended" : "active")}
                      >
                        {p.status === "active" ? "Masquer" : "Publier"}
                      </Button>
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => handleDeleteProduct(p)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredProducts.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#888" }}>
                    Aucun produit trouvé.
                  </td>
                </tr>
              )}
            </AdminTable>
          </>
        )}

        {/* UTILISATEURS / USERS SECTION */}
        {section === "users" && (
          <>
            <div className="admin-toolbar" style={{ flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px" }}>
                <input
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--sd-line, #e2d7d0)", background: "#fff" }}
                  placeholder="Rechercher par adresse e-mail, rôle, boutique…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <select
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff" }}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">Tous les rôles ({data.users.length})</option>
                  <option value="seller">Vendeurs ({data.users.filter((u) => u.role === "seller").length})</option>
                  <option value="customer">Clients ({data.users.filter((u) => u.role === "customer").length})</option>
                  <option value="superadmin">Superadmin ({data.users.filter((u) => u.role === "superadmin").length})</option>
                </select>
                <Button size="sm" variant="primary" onClick={() => setCreateUserOpen(true)}>
                  <Plus size={14} /> Créer utilisateur
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportExcel("utilisateurs.xlsx", [
                  ["Email", "Nom", "Prénom", "Rôle", "Boutique liée", "Date création", "ID"],
                  ...filteredUsers.map((u) => [
                    u.email,
                    u.nom || "",
                    u.prenom || "",
                    u.role,
                    u.store_name || "",
                    u.created ? new Date(u.created).toLocaleDateString("fr-FR") : "",
                    u.id,
                  ]),
                ])}>
                  <Download size={14} /> Exporter Excel
                </Button>
              </div>
            </div>

            <AdminTable title={`Gestion des comptes utilisateurs (${filteredUsers.length})`} headers={["Utilisateur / E-mail", "Nom & Prénom", "Rôle", "Boutique liée", "Date création", "Actions"]}>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f0ece9", display: "grid", placeItems: "center", color: "#665" }}>
                        <Mail size={16} />
                      </div>
                      <div>
                        <strong>{u.email}</strong>
                        <div style={{ fontSize: "11px", color: "#888" }}>ID: {u.id.slice(0, 12)}…</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {u.nom || u.prenom ? (
                      <strong>{`${u.prenom || ""} ${u.nom || ""}`.trim()}</strong>
                    ) : (
                      <span style={{ color: "#999", fontStyle: "italic" }}>—</span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "4px 9px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: u.role === "superadmin" ? "#fce7bd" : u.role === "seller" ? "#e6eff9" : "#eee",
                        color: u.role === "superadmin" ? "#8b6522" : u.role === "seller" ? "#215d9c" : "#555",
                      }}
                    >
                      {u.role === "superadmin" ? "Super Admin" : u.role === "seller" ? "Vendeur" : "Client"}
                    </span>
                  </td>
                  <td>
                    {u.store_name ? (
                      u.store_slug ? (
                        <Link href={`/boutique/${u.store_slug}`} target="_blank" style={{ color: "var(--sd-wine, #812c2c)", textDecoration: "none", fontWeight: 600 }}>
                          {u.store_name} <ExternalLink size={12} style={{ display: "inline" }} />
                        </Link>
                      ) : (
                        <span>{u.store_name}</span>
                      )
                    ) : (
                      <span style={{ color: "#999", fontStyle: "italic" }}>Aucune</span>
                    )}
                  </td>
                  <td style={{ fontSize: "13px", color: "#666" }}>{u.created ? new Date(u.created).toLocaleDateString("fr-FR") : "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                      <Button size="sm" variant="outline" onClick={() => setSelectedUser(u)}>
                        <Edit size={14} /> Modifier
                      </Button>
                      <Button size="sm" variant="soft" onClick={() => setPasswordUser(u)}>
                        <KeyRound size={14} /> Mot de passe
                      </Button>
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => handleDeleteUser(u)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredUsers.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#888" }}>
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </AdminTable>
          </>
        )}

        {/* COMMANDES / ORDERS SECTION */}
        {section === "orders" && (
          <>
            <div className="admin-toolbar" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                aria-label="Rechercher une commande"
                placeholder="Référence ou client…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ minWidth: "260px", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--sd-line, #e2d7d0)", background: "#fff", flex: 1 }}
              />
              <Button variant="outline" size="sm" onClick={() => {
                const filteredOrders = data.orders.filter((o) =>
                  `${o.ref || o.id} ${o.customer}`.toLowerCase().includes(query.toLowerCase())
                );
                exportExcel("commandes.xlsx", [
                  ["Référence", "Client", "Total DT", "Statut", "Date"],
                  ...filteredOrders.map((o) => [
                    o.ref || o.id.slice(0, 8), o.customer,
                    String((o.total / 1000).toFixed(2)), o.status,
                    o.created ? new Date(o.created).toLocaleDateString("fr-FR") : "",
                  ]),
                ]);
              }}>
                <Download size={14} /> Exporter Excel
              </Button>
            </div>
            <AdminTable title={`Commandes de la plateforme (${data.orders.length})`} headers={["Référence", "Client", "Total", "Statut actuel", "Changer le statut"]}>
              {data.orders
                .filter((o) => `${o.ref || o.id} ${o.customer}`.toLowerCase().includes(query.toLowerCase()))
                .map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.ref || o.id.slice(0, 8)}</strong>
                    </td>
                    <td>{o.customer}</td>
                    <td>
                      <strong style={{ color: "var(--sd-wine, #812c2c)" }}>{money(o.total)}</strong>
                    </td>
                    <td>
                      <Status value={o.status} />
                    </td>
                    <td>
                      <select
                        style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", fontSize: "13px" }}
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
                          <option key={s} value={s}>
                            Passer à : {STATUS_FR[s] || s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              {!data.orders.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#888" }}>
                    Aucune commande enregistrée.
                  </td>
                </tr>
              )}
            </AdminTable>
          </>
        )}

        {/* SERVICES SECTION */}
        {section === "services" && <Operations key="services" data={data} act={act} initialTab="Demandes" />}

        {/* SETTINGS SECTION */}
        {section === "settings" && <Operations key="settings" data={data} act={act} initialTab="Paramètres" />}

        {/* ANALYTICS SECTION */}
        {section === "analytics" && (
          <div className="admin-kpis">
            <Kpi label="Panier moyen" value={data.orders.length ? money(revenue / data.orders.length) : "0 DT"} note="Toutes boutiques" />
            <Kpi
              label="Taux boutiques actives"
              value={`${data.stores.length ? Math.round((data.stores.filter((s) => s.status === "active").length / data.stores.length) * 100) : 0}%`}
              note="Vérifiées"
            />
            <Kpi label="Stock disponible" value={String(data.products.reduce((s, p) => s + p.stock, 0))} note="Unités cumulées" />
            <Kpi label="Commission plateforme" value={`${data.config.commission}%`} note="Paramètre général" />
          </div>
        )}
      </section>

      {/* ================= MODALS ================= */}

      {/* 1. EDIT USER MODAL */}
      <Dialog.Root open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="p-overlay" />
          <Dialog.Content className="p-dialog">
            <Dialog.Title>Modifier l'utilisateur</Dialog.Title>
            <Dialog.Close className="p-close" aria-label="Fermer">
              <X size={18} />
            </Dialog.Close>
            {selectedUser && (
              <form onSubmit={handleEditUser}>
                <label>
                  Adresse e-mail
                  <input name="email" type="email" defaultValue={selectedUser.email} required />
                </label>
                <label>
                  Rôle de l'utilisateur
                  <select name="role" defaultValue={selectedUser.role}>
                    <option value="customer">Client (Acheteur)</option>
                    <option value="seller">Vendeur (Boutique)</option>
                    <option value="superadmin">Super Administrateur</option>
                  </select>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Nom
                    <input name="nom" defaultValue={selectedUser.nom || ""} maxLength={100} placeholder="Nom" />
                  </label>
                  <label>
                    Prénom
                    <input name="prenom" defaultValue={selectedUser.prenom || ""} maxLength={100} placeholder="Prénom" />
                  </label>
                </div>
                <div style={{ padding: "10px", background: "#f8f6f4", borderRadius: "8px", fontSize: "12px", color: "#666" }}>
                  <strong>ID:</strong> {selectedUser.id}
                  <br />
                  <strong>Inscrit le:</strong> {selectedUser.created || "—"}
                  {selectedUser.store_name && (
                    <>
                      <br />
                      <strong>Boutique associée:</strong> {selectedUser.store_name}
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                  <Button type="button" variant="outline" onClick={() => setSelectedUser(null)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={busy}>
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 2. RESET USER PASSWORD MODAL */}
      <Dialog.Root open={!!passwordUser} onOpenChange={(open) => !open && setPasswordUser(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="p-overlay" />
          <Dialog.Content className="p-dialog">
            <Dialog.Title>Réinitialiser le mot de passe</Dialog.Title>
            <Dialog.Close className="p-close" aria-label="Fermer">
              <X size={18} />
            </Dialog.Close>
            {passwordUser && (
              <form onSubmit={handleResetPassword}>
                <p style={{ margin: "0 0 14px", fontSize: "14px", color: "#666" }}>
                  Définissez un nouveau mot de passe pour le compte <strong>{passwordUser.email}</strong>.
                </p>
                <label>
                  Nouveau mot de passe
                  <input name="password" type="text" placeholder="Entrez au moins 6 caractères" minLength={6} required />
                </label>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                  <Button type="button" variant="outline" onClick={() => setPasswordUser(null)}>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" disabled={busy}>
                    Appliquer le mot de passe
                  </Button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 3. CREATE USER MODAL */}
      <Dialog.Root open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="p-overlay" />
          <Dialog.Content className="p-dialog">
            <Dialog.Title>Créer un nouvel utilisateur</Dialog.Title>
            <Dialog.Close className="p-close" aria-label="Fermer">
              <X size={18} />
            </Dialog.Close>
            <form onSubmit={handleCreateUser}>
              <label>
                Adresse e-mail
                <input name="email" type="email" placeholder="utilisateur@domaine.tn" required />
              </label>
              <label>
                Rôle
                <select name="role" defaultValue="seller">
                  <option value="seller">Vendeur</option>
                  <option value="customer">Client</option>
                  <option value="superadmin">Super Administrateur</option>
                </select>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label>
                  Nom
                  <input name="nom" placeholder="Nom de famille" maxLength={100} />
                </label>
                <label>
                  Prénom
                  <input name="prenom" placeholder="Prénom" maxLength={100} />
                </label>
              </div>
              <label>
                Mot de passe initial
                <input name="password" type="text" minLength={6} placeholder="Au moins 6 caractères" required />
              </label>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                <Button type="button" variant="outline" onClick={() => setCreateUserOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={busy}>
                  Créer le compte
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 4. VIEW / EDIT BOUTIQUE MODAL */}
      <Dialog.Root open={!!selectedStore} onOpenChange={(open) => !open && setSelectedStore(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="p-overlay" />
          <Dialog.Content className="p-dialog" style={{ width: "min(680px, 95vw)" }}>
            <Dialog.Title>Détails & Gestion de la boutique</Dialog.Title>
            <Dialog.Close className="p-close" aria-label="Fermer">
              <X size={18} />
            </Dialog.Close>
            {selectedStore && (
              <form onSubmit={handleEditStore}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", padding: "10px 14px", background: "#f8f5f2", borderRadius: "8px", marginBottom: "12px", fontSize: "13px", color: "#444" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Mail size={14} />
                    <strong>Gérant :</strong>
                    <span>{selectedStore.owner_email || "—"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShoppingBag size={14} />
                    <strong>Produits :</strong>
                    <span>{selectedStore.product_count ?? 0}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#888" }}>
                    <strong>ID :</strong>
                    <span>{selectedStore.id}</span>
                  </div>
                </div>
                {selectedStore.slug && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f9f6f3", borderRadius: "8px" }}>
                    <span>Lien public vers la boutique :</span>
                    <Link
                      href={`/boutique/${selectedStore.slug}`}
                      target="_blank"
                      style={{ color: "var(--sd-wine, #812c2c)", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      Ouvrir la page boutique <ExternalLink size={15} />
                    </Link>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Nom de la boutique
                    <input name="name" defaultValue={selectedStore.name} required />
                  </label>
                  <label>
                    Statut de la boutique
                    <select name="status" defaultValue={selectedStore.status}>
                      <option value="pending">En attente (Non publiée)</option>
                      <option value="active">Active (Publiée et visible)</option>
                      <option value="suspended">Suspendue (Masquée)</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Téléphone
                    <input name="phone" defaultValue={selectedStore.phone || ""} />
                  </label>
                  <label>
                    Gouvernorat
                    <input name="governorate" defaultValue={selectedStore.governorate || ""} placeholder="ex: Tunis, Sousse, Sfax…" />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Adresse physique
                    <input name="address" defaultValue={selectedStore.address || ""} placeholder="Adresse de l'atelier ou magasin" />
                  </label>
                  <label>
                    WhatsApp
                    <input name="whatsapp" defaultValue={selectedStore.whatsapp || ""} placeholder="+216..." />
                  </label>
                </div>

                <label>
                  Description
                  <textarea name="description" defaultValue={selectedStore.description || ""} rows={3} />
                </label>

                {/* Previews */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center", padding: "10px 0" }}>
                  {selectedStore.logo && (
                    <div>
                      <small style={{ display: "block", color: "#666", marginBottom: "4px" }}>Logo :</small>
                      <img src={selectedStore.logo} alt="Logo" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "1px solid #ccc" }} />
                    </div>
                  )}
                  {selectedStore.cover && (
                    <div style={{ flex: 1 }}>
                      <small style={{ display: "block", color: "#666", marginBottom: "4px" }}>Couverture :</small>
                      <img src={selectedStore.cover} alt="Cover" style={{ width: "100%", height: 60, borderRadius: "6px", objectFit: "cover", border: "1px solid #ccc" }} />
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #eee" }}>
                  <Button type="button" variant="danger" disabled={busy} onClick={() => handleDeleteStore(selectedStore)}>
                    <Trash2 size={15} /> Supprimer la boutique
                  </Button>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Button type="button" variant="outline" onClick={() => setSelectedStore(null)}>
                      Fermer
                    </Button>
                    <Button type="submit" variant="primary" disabled={busy}>
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 5. VIEW / EDIT PRODUCT MODAL */}
      <Dialog.Root open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="p-overlay" />
          <Dialog.Content className="p-dialog" style={{ width: "min(680px, 95vw)" }}>
            <Dialog.Title>Détails & Modification du Produit</Dialog.Title>
            <Dialog.Close className="p-close" aria-label="Fermer">
              <X size={18} />
            </Dialog.Close>
            {selectedProduct && (
              <form onSubmit={handleEditProduct}>
                {selectedProduct.slug && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f9f6f3", borderRadius: "8px" }}>
                    <span>Lien public vers la fiche article :</span>
                    <Link
                      href={`/produit/${selectedProduct.slug}`}
                      target="_blank"
                      style={{ color: "var(--sd-wine, #812c2c)", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      Voir le produit en boutique <ExternalLink size={15} />
                    </Link>
                  </div>
                )}

                <div style={{ display: "flex", gap: "14px", alignItems: "center", margin: "10px 0" }}>
                  {selectedProduct.image && (
                    <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: 70, height: 70, borderRadius: "8px", objectFit: "cover", border: "1px solid #ddd" }} />
                  )}
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "17px" }}>{selectedProduct.name}</h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
                      Boutique :{" "}
                      {selectedProduct.store_slug ? (
                        <Link href={"/boutique/" + selectedProduct.store_slug} target="_blank" style={{ color: "var(--sd-wine, #812c2c)", textDecoration: "none", fontWeight: 600 }}>
                          {selectedProduct.store} <ExternalLink size={12} style={{ display: "inline" }} />
                        </Link>
                      ) : (
                        selectedProduct.store
                      )}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#aaa" }}>ID : {selectedProduct.id}</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
                  <label>
                    Nom de la pièce
                    <input name="name" defaultValue={selectedProduct.name} required />
                  </label>
                  <label>
                    Statut de publication
                    <select name="status" defaultValue={selectedProduct.status}>
                      <option value="pending">En attente de modération</option>
                      <option value="active">Publié (Actif et achetable)</option>
                      <option value="suspended">Masqué (Suspendu)</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Prix en DT (ex: 45.50)
                    <input name="price" type="number" step="0.1" defaultValue={selectedProduct.price / 1000} required />
                  </label>
                  <label>
                    Stock disponible
                    <input name="stock" type="number" min={0} defaultValue={selectedProduct.stock} required />
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Catégorie
                    <select name="category" defaultValue={selectedProduct.category || "Mode"}>
                      <option value="Femme">Femme</option>
                      <option value="Homme">Homme</option>
                      <option value="Accessoires">Accessoires</option>
                      <option value="Maison">Maison</option>
                      <option value="Mode">Mode</option>
                    </select>
                  </label>
                  <label>
                    État du produit
                    <input name="condition" defaultValue={selectedProduct.condition || "Très bon état"} />
                  </label>
                </div>

                <label>
                  Description du produit
                  <textarea name="description" defaultValue={selectedProduct.description || ""} rows={3} />
                </label>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #eee" }}>
                  <Button type="button" variant="danger" disabled={busy} onClick={() => handleDeleteProduct(selectedProduct)}>
                    <Trash2 size={15} /> Supprimer le produit
                  </Button>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Button type="button" variant="outline" onClick={() => setSelectedProduct(null)}>
                      Fermer
                    </Button>
                    <Button type="submit" variant="primary" disabled={busy}>
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

const transitions: Record<string, string[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["shipped"],
  shipped: ["delivered"],
};

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Status({ value }: { value: string }) {
  const labels: Record<string, string> = {
    active: "Active / Publiée",
    pending: "En attente",
    suspended: "Suspendue / Masquée",
    archived: "Archivé",
    ...STATUS_FR,
  };
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

