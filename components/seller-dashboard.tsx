"use client";

import { useState, useMemo, useEffect, FormEvent, useRef } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  LayoutDashboard,
  PackageCheck,
  Boxes,
  ClipboardList,
  Store,
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Camera,
  UploadCloud,
  Check,
  X,
  Phone,
  MessageCircle,
  MapPin,
  Truck,
  Eye,
  Star,
  Download,
  LogOut,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Minus,
  RefreshCw,
} from "lucide-react";
import { Button } from "./ui/button";
import { STATUS_FR } from "@/lib/order-ref";

export type Product = {
  id: string;
  store_id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  store: string;
  slug?: string;
  store_slug?: string;
  category: string;
  description: string;
  image?: string;
  images?: string[];
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
  product_count?: number;
};

export type Order = {
  id: string;
  ref?: string;
  store_id?: string;
  customer: string;
  phone?: string;
  address?: string;
  governorate?: string;
  notes?: string;
  items?: string;
  subtotal?: number;
  delivery_fee?: number;
  commission_rate?: number;
  commission_amount?: number;
  total: number;
  status: string;
  created?: string;
  updated?: string;
};

export type SellerData = {
  user: {
    id: string;
    email: string;
    role: string;
    nom?: string;
    prenom?: string;
  } | null;
  products: Product[];
  stores: Shop[];
  orders: Order[];
  config?: {
    deliveryFee?: number;
  };
};

export const TUNISIAN_GOVERNORATES = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Kef",
  "Siliana",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Gabès",
  "Médenine",
  "Tataouine",
  "Gafsa",
  "Tozeur",
  "Kébili",
];

export const CIRCULAR_CATEGORIES = [
  "Femme",
  "Homme",
  "Enfant & Bébé",
  "Chaussures",
  "Sacs & Maroquinerie",
  "Accessoires & Bijoux",
  "Vintage & Rétro",
  "Luxe & Créateurs",
  "Upcycling & Créations",
  "Maison & Déco",
];

export const CONDITIONS = [
  "Neuf avec étiquette",
  "Comme neuf",
  "Très bon état",
  "Bon état",
  "À retoucher / Upcycling",
];

const money = (val: number) => `${(val / 1000).toFixed(2)} DT`;

function exportExcel(filename: string, rows: (string | number)[][]) {
  import("xlsx").then((XLSX) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Données");
    XLSX.writeFile(wb, filename);
  });
}

const navItems = [
  ["overview", "Vue générale", LayoutDashboard],
  ["products", "Mes Produits", PackageCheck],
  ["categories", "Catégories", Boxes],
  ["orders", "Commandes", ClipboardList],
  ["shop", "Ma Boutique", Store],
  ["analytics", "Statistiques & Ventes", BarChart3],
] as const;

export function SellerDashboard({
  data,
  act,
  busy,
  refresh,
}: {
  data: SellerData;
  act: (body: Record<string, unknown>) => Promise<unknown>;
  busy: boolean;
  refresh?: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"overview" | "products" | "categories" | "orders" | "shop" | "analytics">("overview");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.includes("/produits")) setTab("products");
      else if (path.includes("/commandes")) setTab("orders");
      else if (path.includes("/categories")) setTab("categories");
    }
  }, []);

  // Store owned by user
  const own = data.stores.find((s) => s.owner === data.user?.id);

  // Products belonging to user's boutique
  const myProducts = useMemo(() => {
    if (!own) return [];
    return data.products.filter((p) => String(p.store_id) === String(own.id));
  }, [data.products, own]);

  // Orders for this boutique
  const myOrders = useMemo(() => {
    if (!own) return [];
    return data.orders.filter((o) => !o.store_id || String(o.store_id) === String(own.id));
  }, [data.orders, own]);

  // Filters for products
  const [prodSearch, setProdSearch] = useState("");
  const [prodCategoryFilter, setProdCategoryFilter] = useState("all");
  const [prodStockFilter, setProdStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");

  // Filters for orders
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  // Modals state
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [setupShopOpen, setSetupShopOpen] = useState(false);

  // Form image upload states
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [prefilledCategory, setPrefilledCategory] = useState<string>("");

  // Boutique settings logos
  const [shopLogo, setShopLogo] = useState<string>(own?.logo || "");
  const [shopCover, setShopCover] = useState<string>(own?.cover || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (message: string, isError = false) => {
    setFeedback({ type: isError ? "error" : "success", message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // KPIs
  const totalSales = useMemo(() => {
    return myOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((acc, o) => acc + Number(o.total || 0), 0);
  }, [myOrders]);

  const activeProductsCount = myProducts.filter((p) => p.status === "active").length;
  const outOfStockCount = myProducts.filter((p) => Number(p.stock) <= 0).length;
  const lowStockCount = myProducts.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 2).length;
  const pendingOrdersCount = myOrders.filter((o) => o.status === "new" || o.status === "confirmed").length;

  // Categories aggregated from products + defaults
  const categoriesStats = useMemo(() => {
    const map = new Map<string, { count: number; stock: number; value: number }>();
    CIRCULAR_CATEGORIES.forEach((c) => {
      map.set(c, { count: 0, stock: 0, value: 0 });
    });

    myProducts.forEach((p) => {
      const cat = p.category || "Mode";
      const current = map.get(cat) || { count: 0, stock: 0, value: 0 };
      map.set(cat, {
        count: current.count + 1,
        stock: current.stock + Number(p.stock || 0),
        value: current.value + Number(p.price || 0) * Number(p.stock || 0),
      });
    });

    return Array.from(map.entries()).map(([name, stat]) => ({
      name,
      ...stat,
    }));
  }, [myProducts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = prodSearch.trim().toLowerCase();
    return myProducts.filter((p) => {
      if (prodCategoryFilter !== "all" && p.category !== prodCategoryFilter) return false;
      if (prodStockFilter === "in_stock" && Number(p.stock) <= 0) return false;
      if (prodStockFilter === "out_of_stock" && Number(p.stock) > 0) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });
  }, [myProducts, prodSearch, prodCategoryFilter, prodStockFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return myOrders.filter((o) => {
      if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
      if (!q) return true;
      return (
        (o.customer && o.customer.toLowerCase().includes(q)) ||
        (o.ref && o.ref.toLowerCase().includes(q)) ||
        (o.phone && o.phone.includes(q)) ||
        (o.governorate && o.governorate.toLowerCase().includes(q))
      );
    });
  }, [myOrders, orderSearch, orderStatusFilter]);

  // Handle multiple file upload to /api/media
  async function handleFileUpload(files: FileList | File[]) {
    setUploadingImage(true);
    const newUrls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (file.size > 1500000) {
          notify(`L'image "${file.name}" dépasse 1.5 Mo. Choisissez une image plus légère.`, true);
          continue;
        }
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/media", { method: "POST", body: fd });
        const json = await res.json();
        if (json.url) {
          newUrls.push(json.url);
        } else {
          notify(json.error || `Erreur d'envoi pour ${file.name}`, true);
        }
      }
      if (newUrls.length > 0) {
        setUploadedImages((prev) => [...prev, ...newUrls]);
        notify(`${newUrls.length} photo(s) ajoutée(s) avec succès !`);
      }
    } catch {
      notify("Erreur de connexion lors de l'envoi des photos.", true);
    } finally {
      setUploadingImage(false);
    }
  }

  // Handle single logo / cover upload
  async function handleSingleUpload(file: File, type: "logo" | "cover") {
    if (file.size > 1500000) {
      notify(`L'image "${file.name}" dépasse la limite de 1.5 Mo.`, true);
      return;
    }
    const setter = type === "logo" ? setUploadingLogo : setUploadingCover;
    setter(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) {
        if (type === "logo") setShopLogo(json.url);
        else setShopCover(json.url);
        notify(`${type === "logo" ? "Logo" : "Bannière"} mis(e) à jour.`);
      } else {
        notify(json.error || "Erreur lors du téléchargement.", true);
      }
    } catch {
      notify("Erreur lors de l'envoi.", true);
    } finally {
      setter(false);
    }
  }

  // Handle Create Product
  async function handleCreateProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!own) {
      notify("Veuillez d'abord créer votre boutique.", true);
      return;
    }
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const price = Number(fd.get("price"));
    const stock = Number(fd.get("stock"));
    const category = String(fd.get("category") || "Mode").trim();
    const condition = String(fd.get("condition") || "Très bon état").trim();
    const description = String(fd.get("description") || "").trim();

    if (!name || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
      notify("Vérifiez le nom, le prix et la quantité en stock.", true);
      return;
    }

    const res = await act({
      action: "product",
      name,
      price,
      stock,
      category,
      condition,
      description,
      images: uploadedImages,
      image: uploadedImages[0] || "",
    });

    if (res) {
      notify(`Pièce "${name}" ajoutée à votre catalogue avec succès !`);
      setCreateProductOpen(false);
      setUploadedImages([]);
    } else {
      notify("Erreur lors de l'ajout de la pièce.", true);
    }
  }

  // Handle Edit Product
  async function handleEditProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editProduct) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const price = Number(fd.get("price"));
    const stock = Number(fd.get("stock"));
    const category = String(fd.get("category") || editProduct.category).trim();
    const condition = String(fd.get("condition") || editProduct.condition).trim();
    const description = String(fd.get("description") || "").trim();

    if (!name || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
      notify("Vérifiez le nom, le prix et le stock.", true);
      return;
    }

    const res = await act({
      action: "sellerEditProduct",
      id: editProduct.id,
      name,
      price,
      stock,
      category,
      condition,
      description,
      images: uploadedImages,
      image: uploadedImages[0] || editProduct.image || "",
    });

    if (res) {
      notify(`Pièce "${name}" mise à jour avec succès.`);
      setEditProduct(null);
      setUploadedImages([]);
    } else {
      notify("Erreur lors de la modification du produit.", true);
    }
  }

  // Handle Delete Product
  async function handleDeleteProduct() {
    if (!deleteProduct) return;
    const res = await act({
      action: "sellerDeleteProduct",
      id: deleteProduct.id,
    });
    if (res) {
      notify(`Pièce "${deleteProduct.name}" supprimée de votre boutique.`);
      setDeleteProduct(null);
    } else {
      notify("Impossible de supprimer cette pièce.", true);
    }
  }

  // Handle Quick Stock Adjust
  async function handleStockChange(product: Product, delta: number) {
    const nextStock = Math.max(0, Number(product.stock) + delta);
    const res = await act({
      action: "inventory",
      id: product.id,
      stock: nextStock,
    });
    if (res) {
      notify(`Stock de "${product.name}" ajusté à ${nextStock}.`);
    } else {
      notify("Erreur lors de l'ajustement du stock.", true);
    }
  }

  // Handle Save Boutique Details
  async function handleSaveShop(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const whatsapp = String(fd.get("whatsapp") || "").trim();
    const governorate = String(fd.get("governorate") || "").trim();
    const address = String(fd.get("address") || "").trim();
    const description = String(fd.get("description") || "").trim();

    if (!name || !phone) {
      notify("Le nom de la boutique et le téléphone sont obligatoires.", true);
      return;
    }

    const res = await act({
      action: "store",
      name,
      phone,
      whatsapp,
      governorate,
      address,
      description,
      logo: shopLogo,
      cover: shopCover,
    });

    if (res) {
      notify("Informations de votre boutique enregistrées avec succès !");
      setSetupShopOpen(false);
    } else {
      notify("Erreur lors de l'enregistrement de la boutique.", true);
    }
  }

  // Handle Order Status Change
  async function handleOrderStatus(orderId: string, status: string) {
    const res = await act({
      action: "orderStatus",
      id: orderId,
      status,
    });
    if (res) {
      notify(`Statut de la commande mis à jour : ${STATUS_FR[status] || status}`);
      if (viewOrder && viewOrder.id === orderId) {
        setViewOrder({ ...viewOrder, status });
      }
    } else {
      notify("Erreur lors du changement de statut.", true);
    }
  }

  return (
    <div className="admin-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">
          <img src="/stocky-logo.svg" alt="Stocky Downy" />
        </a>
        <p style={{ letterSpacing: "0.12em", fontWeight: 700, color: "#e8ded8", fontSize: "11px" }}>
          ESPACE VENDEUR
        </p>

        <nav>
          {navItems.map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              className={tab === key ? "active" : ""}
              onClick={() => {
                setTab(key as typeof tab);
              }}
            >
              <Icon />
              {label}
              {key === "products" && myProducts.length > 0 && <b>{myProducts.length}</b>}
              {key === "orders" && pendingOrdersCount > 0 && <b>{pendingOrdersCount}</b>}
            </button>
          ))}
        </nav>

        <div style={{ position: "absolute", bottom: "16px", left: "14px", right: "14px", display: "grid", gap: "6px" }}>
          {own && (
            <a
              href={`/boutique/${own.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                color: "#ffdfbe",
                textDecoration: "none",
                fontSize: "13px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "8px",
              }}
            >
              <ExternalLink size={15} />
              Voir ma boutique en ligne
            </a>
          )}
          <button
            type="button"
            disabled={busy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ffb4a8",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              width: "100%",
              textAlign: "left",
            }}
            onClick={async () => {
              await act({ action: "logout" });
              try {
                sessionStorage.clear();
              } catch {}
              window.location.replace("/connexion");
            }}
          >
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-content">
        {/* TOP STATUS BAR */}
        <div className="admin-top">
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {own ? own.name : "Bienvenue sur Stocky Vendeur"}
              {own && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background:
                      own.status === "active"
                        ? "#e7f4ec"
                        : own.status === "pending"
                        ? "#fff2d7"
                        : "#fbe5e3",
                    color:
                      own.status === "active"
                        ? "#2c694e"
                        : own.status === "pending"
                        ? "#8a6226"
                        : "#9c3028",
                  }}
                >
                  {own.status === "active"
                    ? "✓ Boutique vérifiée"
                    : own.status === "pending"
                    ? "⏳ En attente de validation"
                    : "✕ Boutique suspendue"}
                </span>
              )}
            </h1>
            <p style={{ margin: "4px 0 0", color: "#8a756e", fontSize: "14px" }}>
              Gérez votre catalogue de friperie & mode circulaire, vos commandes et vos paramètres.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {refresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh()}
                disabled={busy}
                title="Actualiser les données"
              >
                <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
                Actualiser
              </Button>
            )}
            {own && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setUploadedImages([]);
                  setPrefilledCategory("");
                  setCreateProductOpen(true);
                }}
              >
                <Plus size={15} />
                Ajouter une pièce
              </Button>
            )}
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {feedback && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "10px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: feedback.type === "success" ? "#e7f4ec" : "#fbe5e3",
              color: feedback.type === "success" ? "#20553d" : "#892722",
              border: `1px solid ${feedback.type === "success" ? "#bde3cd" : "#f5c5c0"}`,
              fontWeight: 500,
              fontSize: "14px",
            }}
          >
            {feedback.type === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* IF USER HAS NO STORE YET -> ONBOARDING BANNER */}
        {!own && (
          <div
            style={{
              background: "linear-gradient(135deg, #fff7ef, #ffe6d3)",
              border: "1px solid #ebd3c0",
              borderRadius: "16px",
              padding: "36px",
              marginBottom: "30px",
              boxShadow: "0 10px 30px rgba(129,44,44,0.06)",
            }}
          >
            <div style={{ maxWidth: "700px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  background: "#812c2c",
                  color: "#fff",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                ÉTAPE 1 SUR 1
              </span>
              <h2 style={{ fontSize: "28px", margin: "0 0 12px", color: "#3a1919" }}>
                Activez votre boutique Stocky Downy
              </h2>
              <p style={{ color: "#6e524b", fontSize: "15px", lineHeight: "1.6", marginBottom: "22px" }}>
                Donnez un nom à votre boutique de seconde main ou friperie, renseignez votre gouvernorat et
                votre contact WhatsApp pour recevoir directement les commandes de toute la Tunisie.
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  setShopLogo("");
                  setShopCover("");
                  setSetupShopOpen(true);
                }}
              >
                <Store size={16} />
                Configurer ma boutique en 2 minutes
              </Button>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {tab === "overview" && (
          <div>
            {/* KPI STATS CARDS */}
            <div className="admin-kpis">
              <article>
                <span>Chiffre d’affaires total</span>
                <strong>{money(totalSales)}</strong>
                <small>Commandes confirmées & livrées</small>
              </article>

              <article>
                <span>Commandes reçues</span>
                <strong>{myOrders.length}</strong>
                <small>
                  {pendingOrdersCount > 0 ? (
                    <span style={{ color: "#8a6226", fontWeight: 700 }}>
                      ⚠️ {pendingOrdersCount} à traiter
                    </span>
                  ) : (
                    "Toutes traitées"
                  )}
                </small>
              </article>

              <article>
                <span>Pièces en vente</span>
                <strong>{myProducts.length}</strong>
                <small>{activeProductsCount} visibles sur le site</small>
              </article>

              <article>
                <span>Alertes de stock</span>
                <strong style={{ color: outOfStockCount > 0 ? "#9c3028" : "#812c2c" }}>
                  {outOfStockCount}
                </strong>
                <small>
                  {outOfStockCount > 0 ? "Pièces épuisées (stock = 0)" : "Tous les articles sont en stock"}
                </small>
              </article>
            </div>

            {/* QUICK ACTIONS & RECENT ORDERS */}
            <div className="admin-columns">
              {/* RECENT ORDERS PANEL */}
              <section className="admin-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h2 style={{ margin: 0, fontSize: "18px" }}>Dernières commandes</h2>
                  <Button variant="outline" size="sm" onClick={() => setTab("orders")}>
                    Voir tout ({myOrders.length})
                  </Button>
                </div>

                {myOrders.length === 0 ? (
                  <p style={{ color: "#8a756e", padding: "20px 0" }}>Aucune commande pour le moment.</p>
                ) : (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {myOrders.slice(0, 5).map((o) => (
                      <div
                        key={o.id}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "10px",
                          border: "1px solid #ebdcd5",
                          background: "#fff",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <strong>{o.customer}</strong>
                          <div style={{ fontSize: "12px", color: "#8a756e", marginTop: "2px" }}>
                            {o.ref || o.id.slice(0, 8)} • {o.governorate || "Tunis"}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontWeight: 700, color: "#812c2c", display: "block" }}>
                            {money(o.total)}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              background:
                                o.status === "delivered"
                                  ? "#e7f4ec"
                                  : o.status === "shipped"
                                  ? "#e3effa"
                                  : o.status === "preparing"
                                  ? "#fff0df"
                                  : "#f4f1f0",
                              color:
                                o.status === "delivered"
                                  ? "#2c694e"
                                  : o.status === "shipped"
                                  ? "#1d5893"
                                  : o.status === "preparing"
                                  ? "#8c5319"
                                  : "#5c4d49",
                            }}
                          >
                            {STATUS_FR[o.status] || o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* STORE STATUS & QUICK TOOLS */}
              <section className="admin-panel">
                <h2 style={{ margin: "0 0 14px", fontSize: "18px" }}>État de votre boutique</h2>

                {own ? (
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#fbf8f6", borderRadius: "10px" }}>
                      {own.logo ? (
                        <img
                          src={own.logo}
                          alt={own.name}
                          style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "8px",
                            background: "#812c2c",
                            color: "#fff",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700,
                          }}
                        >
                          {own.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <strong>{own.name}</strong>
                        <div style={{ fontSize: "12px", color: "#8a756e" }}>
                          {own.governorate || "Tunis"} • {own.phone}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px" }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadedImages([]);
                          setPrefilledCategory("");
                          setCreateProductOpen(true);
                        }}
                      >
                        <Plus size={14} /> Nouveau produit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setTab("shop")}>
                        <Edit size={14} /> Gérer la boutique
                      </Button>
                    </div>

                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() =>
                        exportExcel("mes_produits.xlsx", [
                          ["Nom", "Prix DT", "Stock", "Catégorie", "État", "Statut", "Photos", "Description"],
                          ...myProducts.map((p) => [
                            p.name,
                            (p.price / 1000).toFixed(2),
                            p.stock,
                            p.category,
                            p.condition || "",
                            p.status,
                            p.images?.length || (p.image ? 1 : 0),
                            p.description,
                          ]),
                        ])
                      }
                    >
                      <Download size={14} /> Exporter mon catalogue (.xlsx)
                    </Button>
                  </div>
                ) : (
                  <p style={{ color: "#8a756e" }}>Créez votre boutique pour voir son état ici.</p>
                )}
              </section>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGER (CRUD + MULTI-IMAGE) */}
        {tab === "products" && (
          <div>
            {/* TOOLBAR */}
            <div className="admin-toolbar" style={{ flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1, minWidth: "260px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#8a756e" }} />
                  <input
                    type="search"
                    placeholder="Rechercher par nom, matière, description..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 32px",
                      borderRadius: "8px",
                      border: "1px solid #ebdcd5",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <select
                  value={prodCategoryFilter}
                  onChange={(e) => setProdCategoryFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #ebdcd5",
                    fontSize: "14px",
                    background: "#fff",
                  }}
                >
                  <option value="all">Toutes catégories</option>
                  {CIRCULAR_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={prodStockFilter}
                  onChange={(e) => setProdStockFilter(e.target.value as typeof prodStockFilter)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #ebdcd5",
                    fontSize: "14px",
                    background: "#fff",
                  }}
                >
                  <option value="all">Tous les stocks</option>
                  <option value="in_stock">En stock ({myProducts.filter((p) => Number(p.stock) > 0).length})</option>
                  <option value="out_of_stock">Rupture ({outOfStockCount})</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportExcel("mes_produits.xlsx", [
                      ["Nom", "Prix DT", "Stock", "Catégorie", "État", "Statut", "Photos", "Description"],
                      ...filteredProducts.map((p) => [
                        p.name,
                        (p.price / 1000).toFixed(2),
                        p.stock,
                        p.category,
                        p.condition || "",
                        p.status,
                        p.images?.length || (p.image ? 1 : 0),
                        p.description,
                      ]),
                    ])
                  }
                >
                  <Download size={14} /> Exporter Excel
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setUploadedImages([]);
                    setPrefilledCategory("");
                    setCreateProductOpen(true);
                  }}
                >
                  <Plus size={14} /> Ajouter une pièce
                </Button>
              </div>
            </div>

            {/* PRODUCTS TABLE */}
            <div className="admin-panel admin-table">
              <div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>Photo</th>
                      <th>Pièce</th>
                      <th>Catégorie</th>
                      <th>Prix</th>
                      <th>Stock</th>
                      <th>État</th>
                      <th>Statut</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const imageCount = p.images?.length || (p.image ? 1 : 0);
                      const thumb = p.images?.[0] || p.image || "/demo-fashion.svg";
                      return (
                        <tr key={p.id}>
                          <td>
                            <div style={{ position: "relative", width: "48px", height: "48px" }}>
                              <img
                                src={thumb}
                                alt={p.name}
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  borderRadius: "6px",
                                  objectFit: "cover",
                                  border: "1px solid #ebdcd5",
                                }}
                              />
                              {imageCount > 1 && (
                                <span
                                  style={{
                                    position: "absolute",
                                    bottom: "-4px",
                                    right: "-4px",
                                    background: "#812c2c",
                                    color: "#fff",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    borderRadius: "999px",
                                    padding: "1px 5px",
                                  }}
                                  title={`${imageCount} photos enregistrées`}
                                >
                                  {imageCount}
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <strong style={{ display: "block" }}>{p.name}</strong>
                            <small style={{ color: "#8a756e" }}>
                              {p.description ? p.description.slice(0, 45) + (p.description.length > 45 ? "..." : "") : "Sans description"}
                            </small>
                          </td>

                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                background: "#f5eee9",
                                color: "#5e423a",
                                fontSize: "12px",
                              }}
                            >
                              {p.category}
                            </span>
                          </td>

                          <td>
                            <strong style={{ color: "#812c2c" }}>{money(p.price)}</strong>
                          </td>

                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <button
                                type="button"
                                disabled={busy || Number(p.stock) <= 0}
                                onClick={() => handleStockChange(p, -1)}
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "4px",
                                  border: "1px solid #ebdcd5",
                                  background: "#fff",
                                  cursor: "pointer",
                                  display: "grid",
                                  placeItems: "center",
                                }}
                                title="Diminuer stock (-1)"
                              >
                                <Minus size={11} />
                              </button>
                              <span
                                style={{
                                  fontWeight: 700,
                                  minWidth: "24px",
                                  textAlign: "center",
                                  color: Number(p.stock) <= 0 ? "#9c3028" : "#2e2421",
                                }}
                              >
                                {p.stock}
                              </span>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleStockChange(p, 1)}
                                style={{
                                  width: "22px",
                                  height: "22px",
                                  borderRadius: "4px",
                                  border: "1px solid #ebdcd5",
                                  background: "#fff",
                                  cursor: "pointer",
                                  display: "grid",
                                  placeItems: "center",
                                }}
                                title="Augmenter stock (+1)"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          </td>

                          <td>
                            <small style={{ color: "#6a544e" }}>{p.condition || "Très bon état"}</small>
                          </td>

                          <td>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "2px 8px",
                                borderRadius: "999px",
                                background:
                                  p.status === "active"
                                    ? "#e7f4ec"
                                    : p.status === "pending"
                                    ? "#fff2d7"
                                    : "#fbe5e3",
                                color:
                                  p.status === "active"
                                    ? "#2c694e"
                                    : p.status === "pending"
                                    ? "#8a6226"
                                    : "#9c3028",
                              }}
                            >
                              {p.status === "active"
                                ? "En ligne"
                                : p.status === "pending"
                                ? "En modération"
                                : "Masqué"}
                            </span>
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              {p.slug && (
                                <a
                                  href={`/produit/${p.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: "6px",
                                    borderRadius: "6px",
                                    border: "1px solid #ebdcd5",
                                    background: "#fff",
                                    color: "#6a544e",
                                    display: "inline-flex",
                                  }}
                                  title="Voir la page produit"
                                >
                                  <Eye size={14} />
                                </a>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditProduct(p);
                                  setUploadedImages(p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []));
                                }}
                                title="Modifier cette pièce"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setDeleteProduct(p)}
                                title="Supprimer cette pièce"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredProducts.length === 0 && (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#8a756e" }}>
                    <PackageCheck size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: "15px" }}>Aucune pièce ne correspond à vos filtres.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES MANAGER */}
        {tab === "categories" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: "22px" }}>Catégories de votre boutique</h2>
              <p style={{ margin: 0, color: "#8a756e", fontSize: "14px" }}>
                Explorez vos pièces par rayon circulaire et ajoutez rapidement de nouveaux arrivages dans chaque catégorie.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {categoriesStats.map((c) => (
                <div
                  key={c.name}
                  style={{
                    padding: "20px",
                    borderRadius: "14px",
                    border: "1px solid #ebdcd5",
                    background: "#fff",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "17px", color: "#2e2421" }}>{c.name}</strong>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: c.count > 0 ? "#812c2c" : "#eee",
                          color: c.count > 0 ? "#fff" : "#888",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {c.count} pièce{c.count > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div style={{ marginTop: "14px", fontSize: "13px", color: "#6a544e", display: "grid", gap: "4px" }}>
                      <div>Quantité en stock : <strong>{c.stock}</strong></div>
                      <div>Valeur du rayon : <strong>{money(c.value)}</strong></div>
                    </div>
                  </div>

                  <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid #f2e9e4", display: "flex", gap: "8px" }}>
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setProdCategoryFilter(c.name);
                        setTab("products");
                      }}
                    >
                      Voir les pièces
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setUploadedImages([]);
                        setPrefilledCategory(c.name);
                        setCreateProductOpen(true);
                      }}
                      title={`Ajouter un produit dans ${c.name}`}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS MANAGER */}
        {tab === "orders" && (
          <div>
            {/* TOOLBAR */}
            <div className="admin-toolbar" style={{ flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1, minWidth: "260px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#8a756e" }} />
                  <input
                    type="search"
                    placeholder="Rechercher par client, référence, téléphone..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 32px",
                      borderRadius: "8px",
                      border: "1px solid #ebdcd5",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #ebdcd5",
                    fontSize: "14px",
                    background: "#fff",
                  }}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="new">Nouvelles ({myOrders.filter((o) => o.status === "new").length})</option>
                  <option value="confirmed">Confirmées ({myOrders.filter((o) => o.status === "confirmed").length})</option>
                  <option value="preparing">En préparation ({myOrders.filter((o) => o.status === "preparing").length})</option>
                  <option value="shipped">Expédiées ({myOrders.filter((o) => o.status === "shipped").length})</option>
                  <option value="delivered">Livrées ({myOrders.filter((o) => o.status === "delivered").length})</option>
                  <option value="cancelled">Annulées ({myOrders.filter((o) => o.status === "cancelled").length})</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportExcel("commandes_boutique.xlsx", [
                    ["Réf", "Date", "Client", "Téléphone", "Gouvernorat", "Adresse", "Statut", "Total DT"],
                    ...filteredOrders.map((o) => [
                      o.ref || o.id.slice(0, 8),
                      o.created ? new Date(o.created).toLocaleDateString("fr-FR") : "",
                      o.customer,
                      o.phone || "",
                      o.governorate || "",
                      o.address || "",
                      STATUS_FR[o.status] || o.status,
                      (Number(o.total || 0) / 1000).toFixed(2),
                    ]),
                  ])
                }
              >
                <Download size={14} /> Exporter les commandes (.xlsx)
              </Button>
            </div>

            {/* ORDERS TABLE */}
            <div className="admin-panel admin-table">
              <div>
                <table>
                  <thead>
                    <tr>
                      <th>Réf.</th>
                      <th>Date</th>
                      <th>Client</th>
                      <th>Gouvernorat</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <strong>{o.ref || o.id.slice(0, 8)}</strong>
                        </td>
                        <td>
                          <small style={{ color: "#8a756e" }}>
                            {o.created ? new Date(o.created).toLocaleDateString("fr-FR") : "-"}
                          </small>
                        </td>
                        <td>
                          <div>
                            <strong>{o.customer}</strong>
                            {o.phone && (
                              <div style={{ fontSize: "12px", color: "#6a544e", display: "flex", gap: "6px" }}>
                                <a href={`tel:${o.phone}`} style={{ color: "#812c2c", textDecoration: "none" }}>
                                  {o.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{o.governorate || "Tunis"}</td>
                        <td>
                          <strong style={{ color: "#812c2c" }}>{money(o.total)}</strong>
                        </td>
                        <td>
                          <select
                            value={o.status}
                            disabled={busy}
                            onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background:
                                o.status === "delivered"
                                  ? "#e7f4ec"
                                  : o.status === "shipped"
                                  ? "#e3effa"
                                  : o.status === "preparing"
                                  ? "#fff0df"
                                  : "#f4f1f0",
                              color:
                                o.status === "delivered"
                                  ? "#2c694e"
                                  : o.status === "shipped"
                                  ? "#1d5893"
                                  : o.status === "preparing"
                                  ? "#8c5319"
                                  : "#5c4d49",
                              border: "1px solid #ddd",
                            }}
                          >
                            <option value="new">Reçue</option>
                            <option value="confirmed">Confirmée</option>
                            <option value="preparing">En préparation</option>
                            <option value="shipped">Expédiée</option>
                            <option value="delivered">Livrée</option>
                            <option value="cancelled">Annulée</option>
                          </select>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Button variant="outline" size="sm" onClick={() => setViewOrder(o)}>
                            Détails
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredOrders.length === 0 && (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#8a756e" }}>
                    <ClipboardList size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: "15px" }}>Aucune commande trouvée.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BOUTIQUE SETTINGS */}
        {tab === "shop" && (
          <div style={{ maxWidth: "800px" }}>
            <div style={{ marginBottom: "22px" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: "22px" }}>Profil de votre boutique</h2>
              <p style={{ margin: 0, color: "#8a756e", fontSize: "14px" }}>
                Ces informations apparaissent sur votre vitrine publique accessible à tous les acheteurs.
              </p>
            </div>

            <form onSubmit={handleSaveShop} className="admin-panel" style={{ display: "grid", gap: "18px" }}>
              {/* BRANDING: LOGO & COVER */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
                {/* LOGO */}
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
                    Logo de la boutique
                  </label>
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "12px",
                      border: "2px dashed #ebdcd5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                      background: "#faf6f4",
                    }}
                  >
                    {shopLogo ? (
                      <img src={shopLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Camera size={28} style={{ color: "#a8948d" }} />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    id="shop-logo-upload"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSingleUpload(f, "logo");
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    style={{ marginTop: "8px" }}
                    disabled={uploadingLogo}
                    onClick={() => document.getElementById("shop-logo-upload")?.click()}
                  >
                    {uploadingLogo ? "Envoi..." : "Changer le logo"}
                  </Button>
                </div>

                {/* COVER */}
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
                    Bannière de couverture
                  </label>
                  <div
                    style={{
                      height: "120px",
                      borderRadius: "12px",
                      border: "2px dashed #ebdcd5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                      background: "#faf6f4",
                    }}
                  >
                    {shopCover ? (
                      <img src={shopCover} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ textAlign: "center", color: "#a8948d" }}>
                        <UploadCloud size={28} style={{ margin: "0 auto 4px" }} />
                        <span style={{ fontSize: "12px" }}>Bannière boutique (format paysage)</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    id="shop-cover-upload"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleSingleUpload(f, "cover");
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    style={{ marginTop: "8px" }}
                    disabled={uploadingCover}
                    onClick={() => document.getElementById("shop-cover-upload")?.click()}
                  >
                    {uploadingCover ? "Envoi..." : "Changer la couverture"}
                  </Button>
                </div>
              </div>

              {/* BOUTIQUE NAME & SLUG */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                    Nom de la boutique *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={own?.name || ""}
                    placeholder="Ex: Friperie Vintage Tunis"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #ebdcd5",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                    Gouvernorat *
                  </label>
                  <select
                    name="governorate"
                    defaultValue={own?.governorate || "Tunis"}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #ebdcd5",
                      fontSize: "14px",
                      background: "#fff",
                    }}
                  >
                    {TUNISIAN_GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PHONE & WHATSAPP */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                    Numéro de téléphone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    defaultValue={own?.phone || ""}
                    placeholder="Ex: 20 123 456"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #ebdcd5",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                    WhatsApp commercial
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    defaultValue={own?.whatsapp || ""}
                    placeholder="Ex: 21620123456"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #ebdcd5",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              {/* PHYSICAL ADDRESS */}
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                  Adresse physique / Lieu de ramassage
                </label>
                <input
                  type="text"
                  name="address"
                  defaultValue={own?.address || ""}
                  placeholder="Ex: Rue Habib Bourguiba, La Marsa"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #ebdcd5",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* BIO / DESCRIPTION */}
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                  Description & Histoire de la boutique
                </label>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={own?.description || ""}
                  placeholder="Présentez votre univers, vos engagements éco-responsables, vos spécialités (vintage 90s, streetwear, créations upcyclées...)"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #ebdcd5",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <Button type="submit" variant="primary" disabled={busy}>
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: ANALYTICS & REPORTS */}
        {tab === "analytics" && (
          <div>
            <div style={{ marginBottom: "22px" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: "22px" }}>Performances & Statistiques</h2>
              <p style={{ margin: 0, color: "#8a756e", fontSize: "14px" }}>
                Consultez la santé de vos ventes et téléchargez vos bilans pour la comptabilité.
              </p>
            </div>

            <div className="admin-kpis">
              <article>
                <span>Panier moyen</span>
                <strong>
                  {myOrders.length > 0
                    ? money(totalSales / myOrders.length)
                    : "0.00 DT"}
                </strong>
                <small>Par commande passée</small>
              </article>

              <article>
                <span>Valeur totale du stock</span>
                <strong>
                  {money(
                    myProducts.reduce(
                      (acc, p) => acc + Number(p.price || 0) * Number(p.stock || 0),
                      0
                    )
                  )}
                </strong>
                <small>Prix de vente cumulé</small>
              </article>

              <article>
                <span>Taux de conversion commandes</span>
                <strong>
                  {myOrders.length > 0
                    ? `${(
                        (myOrders.filter((o) => o.status === "delivered").length /
                          myOrders.length) *
                        100
                      ).toFixed(0)}%`
                    : "0%"}
                </strong>
                <small>Commandes livrées avec succès</small>
              </article>

              <article>
                <span>Articles faibles stocks (&le; 2)</span>
                <strong style={{ color: lowStockCount > 0 ? "#8a6226" : "#2c694e" }}>
                  {lowStockCount}
                </strong>
                <small>À réapprovisionner</small>
              </article>
            </div>

            <div className="admin-columns">
              <section className="admin-panel">
                <h2 style={{ margin: "0 0 14px", fontSize: "18px" }}>Répartition du catalogue par catégorie</h2>
                <div style={{ display: "grid", gap: "10px" }}>
                  {categoriesStats
                    .filter((c) => c.count > 0)
                    .map((c) => {
                      const pct = myProducts.length > 0 ? (c.count / myProducts.length) * 100 : 0;
                      return (
                        <div key={c.name}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                            <span>{c.name}</span>
                            <strong>{c.count} ({pct.toFixed(0)}%)</strong>
                          </div>
                          <div style={{ height: "8px", background: "#f2eae5", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "#812c2c" }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>

              <section className="admin-panel">
                <h2 style={{ margin: "0 0 14px", fontSize: "18px" }}>Centre d'exportation de données</h2>
                <p style={{ fontSize: "13px", color: "#6a544e", lineHeight: "1.6" }}>
                  Générez instantanément vos classeurs Excel pour gérer vos inventaires et expéditions.
                </p>

                <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
                  <Button
                    variant="outline"
                    onClick={() =>
                      exportExcel("catalogue_complet.xlsx", [
                        ["Nom du produit", "Prix DT", "Stock", "Catégorie", "État", "Statut", "Photos", "Description"],
                        ...myProducts.map((p) => [
                          p.name,
                          (p.price / 1000).toFixed(2),
                          p.stock,
                          p.category,
                          p.condition || "",
                          p.status,
                          p.images?.length || (p.image ? 1 : 0),
                          p.description,
                        ]),
                      ])
                    }
                  >
                    <Download size={15} /> Télécharger le catalogue complet (.xlsx)
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      exportExcel("historique_commandes.xlsx", [
                        ["Réf", "Date", "Client", "Téléphone", "Gouvernorat", "Adresse", "Statut", "Total DT"],
                        ...myOrders.map((o) => [
                          o.ref || o.id.slice(0, 8),
                          o.created ? new Date(o.created).toLocaleDateString("fr-FR") : "",
                          o.customer,
                          o.phone || "",
                          o.governorate || "",
                          o.address || "",
                          STATUS_FR[o.status] || o.status,
                          (Number(o.total || 0) / 1000).toFixed(2),
                        ]),
                      ])
                    }
                  >
                    <Download size={15} /> Télécharger l'historique des ventes (.xlsx)
                  </Button>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: ADD PRODUCT (WITH MULTI-IMAGE UPLOADER) */}
      <Dialog.Root open={createProductOpen} onOpenChange={setCreateProductOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="p-overlay" />
          <Dialog.Content className="p-dialog" style={{ width: "min(720px, 95vw)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <Dialog.Title style={{ margin: 0, fontSize: "20px" }}>Ajouter une nouvelle pièce</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#8a756e" }}>
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description style={{ color: "#8a756e", fontSize: "14px", marginBottom: "18px" }}>
              Téléchargez une ou plusieurs photos (face, dos, détails) et renseignez les informations de la pièce.
            </Dialog.Description>

            <form onSubmit={handleCreateProduct} style={{ display: "grid", gap: "16px" }}>
              {/* MULTI-IMAGE UPLOADER */}
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
                  Photos du produit (1 ou plusieurs)
                </label>

                {/* THUMBNAIL GALLERY */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                  {uploadedImages.map((src, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: "80px",
                        height: "80px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: idx === 0 ? "2px solid #812c2c" : "1px solid #ebdcd5",
                      }}
                    >
                      <img src={src} alt={`Photo ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

                      {idx === 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: "2px",
                            left: "2px",
                            background: "#812c2c",
                            color: "#fff",
                            fontSize: "9px",
                            padding: "1px 4px",
                            borderRadius: "3px",
                            fontWeight: 700,
                          }}
                        >
                          ★ Couverture
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                        }}
                        title="Supprimer cette photo"
                      >
                        <X size={12} />
                      </button>

                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedImages((prev) => {
                              const arr = [...prev];
                              const [moved] = arr.splice(idx, 1);
                              return [moved, ...arr];
                            });
                          }}
                          style={{
                            position: "absolute",
                            bottom: "2px",
                            left: "2px",
                            background: "rgba(35,17,26,0.8)",
                            color: "#ffdfbe",
                            border: "none",
                            borderRadius: "3px",
                            fontSize: "9px",
                            padding: "1px 4px",
                            cursor: "pointer",
                          }}
                          title="Définir comme photo principale"
                        >
                          Principale
                        </button>
                      )}
                    </div>
                  ))}

                  {/* UPLOAD TRIGGER BUTTON */}
                  <label
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "8px",
                      border: "2px dashed #ebdcd5",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      background: "#faf6f4",
                      color: "#8a756e",
                      fontSize: "11px",
                      textAlign: "center",
                      padding: "4px",
                    }}
                  >
                    <Plus size={20} />
                    <span>{uploadingImage ? "Envoi..." : "Ajouter"}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }}
                      disabled={uploadingImage}
                      onChange={(e) => {
                        if (e.target.files) handleFileUpload(e.target.files);
                      }}
                    />
                  </label>
                </div>

                <small style={{ color: "#8a756e", fontSize: "12px" }}>
                  Astuce : vous pouvez sélectionner plusieurs photos d'un coup. La première est la photo de couverture. Max 1.5 Mo par photo.
                </small>
              </div>

              {/* NAME */}
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                  Nom de la pièce *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ex: Blazer oversize en laine vintage 90s"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                />
              </div>

              {/* CATEGORY & CONDITION */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                    Catégorie *
                  </label>
                  <select
                    name="category"
                    defaultValue={prefilledCategory || "Femme"}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px", background: "#fff" }}
                  >
                    {CIRCULAR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                    État de la pièce *
                  </label>
                  <select
                    name="condition"
                    defaultValue="Très bon état"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px", background: "#fff" }}
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PRICE & STOCK */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                    Prix en DT *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    required
                    min="0.1"
                    placeholder="Ex: 45.00"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                    Quantité en stock *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min="0"
                    defaultValue="1"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                  Description détaillée
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Taille (S/M/L/40...), coupe, matière (coton, cuir, soie), mesures précises et détails particuliers."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                />
              </div>

              {/* ACTIONS */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <Button type="button" variant="outline" onClick={() => setCreateProductOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={busy || uploadingImage}>
                  Publier la pièce
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL 2: EDIT PRODUCT */}
      <Dialog.Root open={Boolean(editProduct)} onOpenChange={(open) => !open && setEditProduct(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="p-overlay" />
          <Dialog.Content className="p-dialog" style={{ width: "min(720px, 95vw)", maxHeight: "90vh", overflowY: "auto" }}>
            {editProduct && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <Dialog.Title style={{ margin: 0, fontSize: "20px" }}>Modifier la pièce</Dialog.Title>
                  <Dialog.Close asChild>
                    <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#8a756e" }}>
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleEditProduct} style={{ display: "grid", gap: "16px" }}>
                  {/* MULTI-IMAGE GALLERY MANAGER */}
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
                      Galerie photos ({uploadedImages.length})
                    </label>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {uploadedImages.map((src, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            width: "80px",
                            height: "80px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: idx === 0 ? "2px solid #812c2c" : "1px solid #ebdcd5",
                          }}
                        >
                          <img src={src} alt={`Photo ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

                          {idx === 0 && (
                            <span
                              style={{
                                position: "absolute",
                                top: "2px",
                                left: "2px",
                                background: "#812c2c",
                                color: "#fff",
                                fontSize: "9px",
                                padding: "1px 4px",
                                borderRadius: "3px",
                                fontWeight: 700,
                              }}
                            >
                              ★ Couverture
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              background: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              cursor: "pointer",
                              display: "grid",
                              placeItems: "center",
                            }}
                            title="Supprimer cette photo"
                          >
                            <X size={12} />
                          </button>

                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedImages((prev) => {
                                  const arr = [...prev];
                                  const [moved] = arr.splice(idx, 1);
                                  return [moved, ...arr];
                                });
                              }}
                              style={{
                                position: "absolute",
                                bottom: "2px",
                                left: "2px",
                                background: "rgba(35,17,26,0.8)",
                                color: "#ffdfbe",
                                border: "none",
                                borderRadius: "3px",
                                fontSize: "9px",
                                padding: "1px 4px",
                                cursor: "pointer",
                              }}
                              title="Définir comme photo principale"
                            >
                              Principale
                            </button>
                          )}
                        </div>
                      ))}

                      <label
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "8px",
                          border: "2px dashed #ebdcd5",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          background: "#faf6f4",
                          color: "#8a756e",
                          fontSize: "11px",
                          textAlign: "center",
                          padding: "4px",
                        }}
                      >
                        <Plus size={20} />
                        <span>{uploadingImage ? "Envoi..." : "Ajouter"}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,image/webp"
                          style={{ display: "none" }}
                          disabled={uploadingImage}
                          onChange={(e) => {
                            if (e.target.files) handleFileUpload(e.target.files);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* NAME */}
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                      Nom de la pièce *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editProduct.name}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                    />
                  </div>

                  {/* CATEGORY & CONDITION */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                        Catégorie *
                      </label>
                      <select
                        name="category"
                        defaultValue={editProduct.category}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px", background: "#fff" }}
                      >
                        {CIRCULAR_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                        État de la pièce *
                      </label>
                      <select
                        name="condition"
                        defaultValue={editProduct.condition || "Très bon état"}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px", background: "#fff" }}
                      >
                        {CONDITIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* PRICE & STOCK */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                        Prix en DT *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="price"
                        required
                        min="0.1"
                        defaultValue={(editProduct.price / 1000).toFixed(2)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                        Quantité en stock *
                      </label>
                      <input
                        type="number"
                        name="stock"
                        required
                        min="0"
                        defaultValue={editProduct.stock}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                      />
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                      Description détaillée
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={editProduct.description || ""}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                    />
                  </div>

                  {/* ACTIONS */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        setDeleteProduct(editProduct);
                        setEditProduct(null);
                      }}
                    >
                      <Trash2 size={14} /> Supprimer cette pièce
                    </Button>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <Button type="button" variant="outline" onClick={() => setEditProduct(null)}>
                        Annuler
                      </Button>
                      <Button type="submit" variant="primary" disabled={busy || uploadingImage}>
                        Enregistrer les modifications
                      </Button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL 3: DELETE CONFIRMATION */}
      <Dialog.Root open={Boolean(deleteProduct)} onOpenChange={(open) => !open && setDeleteProduct(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="p-overlay" />
          <Dialog.Content className="p-dialog" style={{ width: "min(440px, 95vw)" }}>
            <Dialog.Title style={{ margin: "0 0 10px", fontSize: "18px" }}>Confirmer la suppression</Dialog.Title>
            <Dialog.Description style={{ color: "#6a544e", fontSize: "14px", lineHeight: "1.5", marginBottom: "18px" }}>
              Êtes-vous sûr de vouloir supprimer définitivement la pièce{" "}
              <strong>"{deleteProduct?.name}"</strong> de votre catalogue ?
            </Dialog.Description>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button type="button" variant="outline" onClick={() => setDeleteProduct(null)}>
                Annuler
              </Button>
              <Button type="button" variant="danger" disabled={busy} onClick={handleDeleteProduct}>
                Supprimer définitivement
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL 4: ORDER DETAILS */}
      <Dialog.Root open={Boolean(viewOrder)} onOpenChange={(open) => !open && setViewOrder(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="p-overlay" />
          <Dialog.Content className="p-dialog" style={{ width: "min(600px, 95vw)" }}>
            {viewOrder && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <Dialog.Title style={{ margin: 0, fontSize: "18px" }}>
                    Commande {viewOrder.ref || viewOrder.id.slice(0, 8)}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#8a756e" }}>
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                <div style={{ display: "grid", gap: "14px", fontSize: "14px" }}>
                  <div style={{ padding: "12px", background: "#fbf8f6", borderRadius: "10px" }}>
                    <div style={{ fontWeight: 700, fontSize: "15px" }}>{viewOrder.customer}</div>
                    {viewOrder.phone && (
                      <div style={{ marginTop: "4px", display: "flex", gap: "12px", alignItems: "center" }}>
                        <a
                          href={`tel:${viewOrder.phone}`}
                          style={{ color: "#812c2c", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                        >
                          <Phone size={14} /> {viewOrder.phone}
                        </a>
                        <a
                          href={`https://wa.me/${viewOrder.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#25D366", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                        >
                          <MessageCircle size={14} /> Contacter sur WhatsApp
                        </a>
                      </div>
                    )}
                    <div style={{ marginTop: "6px", color: "#6a544e" }}>
                      📍 {viewOrder.address || "Adresse non renseignée"} ({viewOrder.governorate || "Tunis"})
                    </div>
                    {viewOrder.notes && (
                      <div style={{ marginTop: "6px", fontStyle: "italic", color: "#8a756e" }}>
                        Note client : {viewOrder.notes}
                      </div>
                    )}
                  </div>

                  {/* FINANCIAL BREAKDOWN */}
                  <div style={{ border: "1px solid #ebdcd5", borderRadius: "10px", padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Sous-total articles</span>
                      <strong>{money(Number(viewOrder.subtotal || viewOrder.total))}</strong>
                    </div>
                    {viewOrder.delivery_fee ? (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#6a544e" }}>
                        <span>Livraison</span>
                        <span>{money(viewOrder.delivery_fee)}</span>
                      </div>
                    ) : null}
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #f2eae5", fontSize: "16px" }}>
                      <strong>Total commande</strong>
                      <strong style={{ color: "#812c2c" }}>{money(viewOrder.total)}</strong>
                    </div>
                  </div>

                  {/* STATUS UPDATE */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Statut de la commande :</span>
                    <select
                      value={viewOrder.status}
                      disabled={busy}
                      onChange={(e) => handleOrderStatus(viewOrder.id, e.target.value)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "1px solid #ebdcd5",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      <option value="new">Reçue</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="preparing">En préparation</option>
                      <option value="shipped">Expédiée</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end" }}>
                  <Button variant="outline" onClick={() => setViewOrder(null)}>
                    Fermer
                  </Button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* MODAL 5: INITIAL SHOP ONBOARDING */}
      <Dialog.Root open={setupShopOpen} onOpenChange={setSetupShopOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="p-overlay" />
          <Dialog.Content className="p-dialog" style={{ width: "min(640px, 95vw)" }}>
            <Dialog.Title style={{ margin: "0 0 6px", fontSize: "20px" }}>
              Créer votre boutique sur Stocky Downy
            </Dialog.Title>
            <Dialog.Description style={{ color: "#8a756e", fontSize: "14px", marginBottom: "16px" }}>
              Configurez vos coordonnées pour commencer à vendre vos pièces dès aujourd'hui.
            </Dialog.Description>

            <form onSubmit={handleSaveShop} style={{ display: "grid", gap: "14px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                  Nom de la boutique *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ex: Mon Dressing Circulaire"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="Ex: 21 000 000"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                    Gouvernorat *
                  </label>
                  <select
                    name="governorate"
                    defaultValue="Tunis"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px", background: "#fff" }}
                  >
                    {TUNISIAN_GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                  Numéro WhatsApp commercial
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  placeholder="Ex: 21621000000"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                  Adresse physique / Ville
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Ex: Centre-ville, Tunis"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: 600, fontSize: "13px" }}>
                  Description de la boutique
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Quelques mots sur vos pièces, votre sélection vintage ou circulaire..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <Button type="button" variant="outline" onClick={() => setSetupShopOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={busy}>
                  Créer ma boutique
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
