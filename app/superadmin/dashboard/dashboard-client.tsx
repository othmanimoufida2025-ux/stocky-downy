"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { AdminDashboard, type AdminData } from "@/components/admin-dashboard";
import { Button } from "@/components/ui/button";

const initialData: AdminData = {
  products: [],
  stores: [],
  orders: [],
  users: [],
  categories: [],
  requests: [],
  audit: [],
  config: {
    title: "Une nouvelle histoire pour chaque pièce.",
    deliveryFee: 0,
    commission: 10,
  },
};

export function SuperadminDashboardClient({
  isSuperadmin = false,
}: {
  isSuperadmin?: boolean;
}) {
  const [data, setData] = useState<AdminData>(initialData);
  const [authorized, setAuthorized] = useState(isSuperadmin);
  const [loading, setLoading] = useState(isSuperadmin);
  const [busy, setBusy] = useState(false);
  const [pinError, setPinError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, ordersRes, catRes] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/catalog", { cache: "no-store" }),
      ]);

      const [meJson, ordersJson, catJson] = await Promise.all([
        meRes.json(),
        ordersRes.json(),
        catRes.json(),
      ]);

      if (meJson.user && meJson.user.role === "superadmin") {
        setAuthorized(true);
        setData({
          products: meJson.products || [],
          stores: meJson.stores || [],
          orders: ordersJson.orders || [],
          users: meJson.users || [],
          categories: meJson.categories || [],
          requests: meJson.requests || [],
          audit: meJson.audit || [],
          config: catJson.config || initialData.config,
        });
      } else {
        setAuthorized(false);
      }
    } catch {
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperadmin) {
      loadData();
    }
  }, [isSuperadmin, loadData]);

  // Action dispatcher for AdminDashboard
  async function act(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "Action impossible");
      await loadData();
      return result;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur lors de l'action");
      return null;
    } finally {
      setBusy(false);
    }
  }

  // Handle PIN unlock
  async function handlePinLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setPinError("");
    const form = new FormData(e.currentTarget);
    const pin = String(form.get("pin") || "").trim();

    try {
      const r = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", pin }),
      });
      const res = await r.json();
      if (!r.ok) throw new Error(res.error || "PIN incorrect.");
      await loadData();
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setBusy(false);
    }
  }

  // While loading data for authorized superadmin
  if (loading) {
    return (
      <div className="admin-loading" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <img src="/stocky-logo.svg" alt="Stocky" width={140} style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "#8a756e", fontSize: "15px" }}>Chargement du centre de contrôle Superadmin…</p>
        </div>
      </div>
    );
  }

  // If not logged in as superadmin, show the dedicated PIN gate
  if (!authorized) {
    return (
      <main className="admin-gate" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "20px" }}>
        <section className="admin-gate-card" style={{ maxWidth: "420px", width: "100%" }}>
          <span className="admin-lock">🔒</span>
          <img src="/stocky-logo.svg" alt="Stocky" width={132} style={{ margin: "0 auto 12px" }} />
          <p className="eyebrow" style={{ color: "#812c2c", fontWeight: 700, letterSpacing: "0.1em" }}>
            ZONE SÉCURISÉE
          </p>
          <h1 style={{ fontSize: "26px", margin: "6px 0 10px" }}>Super administration</h1>
          <p style={{ color: "#6a544e", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>
            Entrez votre code PIN pour accéder au pilotage complet de la plateforme.
          </p>

          <form onSubmit={handlePinLogin} style={{ display: "grid", gap: "14px" }}>
            <label style={{ display: "block", textAlign: "left", fontSize: "13px", fontWeight: 600 }}>
              Code PIN
              <input
                name="pin"
                type="password"
                inputMode="numeric"
                required
                maxLength={32}
                autoFocus
                autoComplete="off"
                placeholder="Entrez votre PIN (ex: 123456)"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ebdcd5", fontSize: "16px", marginTop: "4px" }}
              />
            </label>

            <Button type="submit" disabled={busy} style={{ width: "100%", height: "44px" }}>
              {busy ? "Vérification en cours…" : "Accéder au tableau de bord"}
            </Button>

            {pinError && (
              <p className="p-error" role="alert" style={{ margin: "4px 0 0", color: "#9c3028", fontSize: "13px" }}>
                {pinError}
              </p>
            )}
          </form>

          <div style={{ marginTop: "16px", fontSize: "12px", color: "#8a756e" }}>
            PIN par défaut : <code style={{ background: "#f0eae6", padding: "2px 6px", borderRadius: "4px" }}>123456</code>
          </div>

          <div style={{ marginTop: "20px" }}>
            <a href="/" style={{ color: "#812c2c", textDecoration: "none", fontSize: "13px" }}>
              ← Retour à la boutique
            </a>
          </div>
        </section>
      </main>
    );
  }

  // Once authenticated -> Render full Admin Dashboard!
  return <AdminDashboard data={data} act={act} busy={busy} />;
}
