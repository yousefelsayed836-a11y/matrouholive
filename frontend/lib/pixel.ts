export const FB_PIXEL_ID = "1441876790405084";

declare global {
  interface Window { fbq?: (...args: any[]) => void; }
}

export function trackEvent(event: string, data?: Record<string, any>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, data);
  }
}

export function trackAddToCart(product: { id: string; name_en: string; price: number }, qty: number) {
  trackEvent("AddToCart", {
    content_ids: [product.id],
    content_name: product.name_en,
    content_type: "product",
    value: product.price * qty,
    currency: "EGP",
    num_items: qty,
  });
}

export function trackInitiateCheckout(total: number, numItems: number) {
  trackEvent("InitiateCheckout", { value: total, currency: "EGP", num_items: numItems });
}

export function trackPurchase(orderId: string, total: number, items: { id: string; qty: number; price: number }[]) {
  trackEvent("Purchase", {
    content_ids: items.map(i => i.id),
    content_type: "product",
    value: total,
    currency: "EGP",
    num_items: items.reduce((s, i) => s + i.qty, 0),
    order_id: orderId,
  });
}
