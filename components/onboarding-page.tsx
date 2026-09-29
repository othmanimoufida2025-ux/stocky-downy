"use client";

import { useEffect, useState } from "react";
import { SellerOnboarding } from "@/components/seller-onboarding";

export function OnboardingPage() {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/me", { cache: "no-store" }).then(r => r.json()).then(data => { if (!data.user) location.href = "/connexion?next=/vendeur/demarrage"; else setReady(true); }).catch(() => setError("Impossible de vérifier votre session.")); }, []);
  async function act(body: Record<string, unknown>) { setBusy(true); setError(""); try { const response = await fetch("/api/platform", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) throw Error(result.error); return result; } catch (e) { setError(e instanceof Error ? e.message : "Action impossible"); return null; } finally { setBusy(false); } }
  if (!ready) return <div className="onboarding-loading">{error || "Préparation de votre espace…"}</div>;
  return <div className="onboarding-page"><aside><img src="/stocky-logo.svg" alt="Stocky Downy" /><span>Votre boutique prend forme</span><h1>Présentez votre univers, simplement.</h1><p>Chaque étape est enregistrée. La couverture reste facultative et votre premier produit peut être ajouté plus tard.</p><div className="preview-arch"><span>Aperçu boutique</span></div></aside><section><a href="/vendeur" className="back-dashboard">← Mon espace</a>{error && <p className="field-error">{error}</p>}<SellerOnboarding accountReady busy={busy} act={act} onComplete={() => location.href = "/vendeur"} /></section></div>;
}
