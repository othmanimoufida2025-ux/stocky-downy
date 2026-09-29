"use client";

import { useState } from "react";
import { Check, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money } from "@/components/product-card";
import { ORDER_STEPS, STATUS_FR } from "@/lib/order-ref";

type TrackedOrder = { ref: string; status: string; total: number; items: string; created: string };
export function TrackingPage({ initialRef = "" }: { initialRef?: string }) {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); try { const values = Object.fromEntries(new FormData(event.currentTarget)); const response = await fetch("/api/platform", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "track", ...values }) }); const result = await response.json(); if (!response.ok) throw Error(result.error); setOrder(result.order); } catch (e) { setOrder(null); setError(e instanceof Error ? e.message : "Commande introuvable"); } finally { setBusy(false); } }
  const current = order ? ORDER_STEPS.indexOf(order.status) : -1;
  const items = order ? JSON.parse(String(order.items || "[]")) as { name: string; quantity: number; price: number }[] : [];
  return <div className="tracking-wrap"><div className="sf-page-head"><span>Où en est mon colis ?</span><h1>Suivre ma commande</h1><p>Utilisez la référence courte reçue après votre achat et votre numéro de téléphone.</p></div><form className="tracking-form" onSubmit={submit}><label><span>Référence</span><input name="ref" defaultValue={initialRef} placeholder="SD-ABC234" pattern="SD-[A-Z0-9]{6}" autoCapitalize="characters" required /></label><label><span>Téléphone</span><input name="phone" type="tel" inputMode="tel" placeholder="22 123 456" required /></label><Button disabled={busy}><PackageSearch />{busy ? "Recherche…" : "Afficher le suivi"}</Button></form>{error && <p className="form-error">{error}</p>}{order && <section className="tracking-result"><div className="tracking-title"><div><span>Commande {order.ref}</span><h2>{STATUS_FR[order.status] || order.status}</h2></div><strong>{money(order.total)}</strong></div>{order.status === "cancelled" ? <div className="cancelled">Cette commande a été annulée.</div> : <ol className="timeline">{ORDER_STEPS.map((step, index) => <li className={index <= current ? "done" : ""} key={step}><i>{index < current ? <Check /> : index + 1}</i><span>{STATUS_FR[step]}</span></li>)}</ol>}<div className="tracked-items">{items.map((item, index) => <div key={`${item.name}-${index}`}><span>{item.name} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></div>)}</div></section>}</div>;
}
