"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddToCart({ id, stock, compact = false }: { id: string; stock: number; compact?: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  function add() {
    const cart = JSON.parse(localStorage.getItem("stocky-basket-v2") || "{}") as Record<string, number>;
    cart[id] = Math.min(stock, (cart[id] || 0) + quantity);
    localStorage.setItem("stocky-basket-v2", JSON.stringify(cart));
    window.dispatchEvent(new Event("stocky-cart"));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }
  if (compact) return <Button disabled={!stock} onClick={add}>{added ? <><Check />Ajouté</> : <><ShoppingBag />{stock ? "Ajouter" : "Épuisé"}</>}</Button>;
  return <div className="buy-controls"><div className="quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Diminuer"><Minus /></button><output>{quantity}</output><button onClick={() => setQuantity(Math.min(stock, quantity + 1))} aria-label="Augmenter"><Plus /></button></div><Button disabled={!stock} onClick={add}>{added ? <><Check />Ajouté au panier</> : <><ShoppingBag />Ajouter au panier</>}</Button></div>;
}
