const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function orderRef() {
  return (
    "SD-" +
    Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) => ALPHABET[byte % ALPHABET.length]).join("")
  );
}

export const STATUS_FR: Record<string, string> = {
  new: "Reçue",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const ORDER_STEPS = ["new", "confirmed", "preparing", "shipped", "delivered"];
