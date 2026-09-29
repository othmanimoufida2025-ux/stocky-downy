"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

const countCart = () => {
  try {
    return Object.values(JSON.parse(localStorage.getItem("stocky-basket-v2") || "{}") as Record<string, number>)
      .reduce((sum, quantity) => sum + quantity, 0);
  } catch {
    return 0;
  }
};

export function CartButton() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const refresh = () => setCount(countCart());
    refresh();
    window.addEventListener("stocky-cart", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("stocky-cart", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return <Link className="sf-cart" href="/panier"><ShoppingBag /> Panier {count > 0 && <b>{count}</b>}</Link>;
}
