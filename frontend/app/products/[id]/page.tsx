"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const GREEN = "#4f7032";
const GREEN_DARK = "#3d5828";
const CREAM = "#d7f7b3";
const CREAM_BG = "#f1f7c9";
const GOLD = "#bd9a52";
const DARK = "#2d2b27";

interface Variant { id: string; option_name: string; option_value: string; quantity: number; price_override?: number; }
interface Product {
  id: string; name_en: string; name_ar?: string;
  description_en?: string; description_ar?: string;
  price: number; old_price?: number;
  images?: string[]; main_image?: string;
  category_name?: string; category_name_ar?: string;
  stock?: number; is_active: boolean;
  variants?: Variant[];
}
interface CartItem {
  product: { id: string; name_ar: string; name_en: string; price: number; image_url?: string; };
  qty: number; size: string;
}

function getImg(product: Product): string[] {
  const all = [product.main_image, ...(product.images || [])].filter((i): i is string => !!i && (i.startsWith("http") || i.startsWith("data:")));
  const unique = [...new Set(all)];
  return unique.length > 0 ? unique : [`https://placehold.co/600x600/4f7032/fff?text=${encodeURIComponent((product.name_ar || product.name_en || "").slice(0, 4))}`];
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!params.id) { setError("لم يتم تحديد المنتج"); setLoading(false); return; }
    fetch(`${API_BASE}/products/${params.id}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setProduct(data.product);
        if (data.product?.variants?.length > 0) setSelectedVariant(data.product.variants[0]);
        setLoading(false);
      })
      .catch(() => { setError("المنتج غير موجود"); setLoading(false); });
  }, [params.id]);

  const addToCart = () => {
    if (!product) return;
    const imgs = getImg(product);
    const price = selectedVariant?.price_override || product.price;
    const item: CartItem = {
      product: { id: product.id, name_ar: product.name_ar || product.name_en, name_en: product.name_en, price, image_url: imgs[0] },
      qty, size: selectedVariant?.option_value || "One Size",
    };
    try {
      const saved = localStorage.getItem("cart");
      let cart: CartItem[] = saved ? JSON.parse(saved) : [];
      const key = product.id + (item.size || "");
      const idx = cart.findIndex(i => i.product.id === product.id && i.size === item.size);
      if (idx >= 0) cart[idx] = { ...cart[idx], qty: Math.min(10, cart[idx].qty + qty) };
      else cart = [...cart, item];
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {}
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: CREAM_BG }}>
      <div style={{ textAlign: "center", color: "#888", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>
        <div style={{ width: 48, height: 48, border: `4px solid ${CREAM}`, borderTop: `4px solid ${GREEN}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p>جاري التحميل...</p>
      </div>
    </div>
  );

  if (error || !product) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: CREAM_BG }}>
      <div style={{ textAlign: "center", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <span style={{ fontSize: 28, color: "#dc2626" }}>!</span>
        </div>
        <h1 style={{ fontSize: 22, color: DARK, marginBottom: 12 }}>{error || "المنتج غير موجود"}</h1>
        <Link href="/shop" style={{ padding: "12px 28px", borderRadius: 12, background: GREEN, color: "#fff", textDecoration: "none", fontWeight: 700 }}>عرض كل المنتجات</Link>
      </div>
    </div>
  );

  const imgs = getImg(product);
  const displayPrice = selectedVariant?.price_override || product.price;
  const hasDiscount = product.old_price && product.old_price > displayPrice;
  const discount = hasDiscount ? Math.round((1 - displayPrice / product.old_price!) * 100) : 0;
  const name = product.name_ar || product.name_en;
  const variantGroups = (product.variants || []).reduce<Record<string, Variant[]>>((acc, v) => {
    (acc[v.option_name] = acc[v.option_name] || []).push(v); return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", background: CREAM_BG, fontFamily: "'Readex Pro', 'Cairo', sans-serif", direction: "rtl" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&family=Cairo:wght@300;400;600;700;800;900&display=swap');
        * { font-family: 'Readex Pro', 'Cairo', sans-serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .variant-btn { transition: all .2s; }
        .variant-btn:hover { border-color: ${GREEN} !important; color: ${GREEN} !important; }
        @media(max-width:768px) {
          .product-grid { grid-template-columns: 1fr !important; }
          .product-img-main { height: 300px !important; }
        }
      `}</style>

      {/* مسار التنقل */}
      <div style={{ background: CREAM, padding: "12px 24px", borderBottom: "1px solid #c8d9b0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", fontSize: 13, color: "#6a8a5a", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: GREEN, textDecoration: "none", fontWeight: 600 }}>الرئيسية</Link>
          <span style={{ color: "#aaa" }}>←</span>
          <Link href="/shop" style={{ color: GREEN, textDecoration: "none", fontWeight: 600 }}>المنتجات</Link>
          <span style={{ color: "#aaa" }}>←</span>
          <span style={{ color: DARK, fontWeight: 700 }}>{name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px", animation: "fadeUp .5s ease both" }}>
        <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 4px 24px rgba(79,112,50,0.10)", border: "1px solid #e8f0e0" }}>

          {/* الصور */}
          <div>
            <div className="product-img-main" style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: CREAM_BG, marginBottom: 12, height: 440 }}>
              <img src={imgs[imgIdx]} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity .3s" }}
                onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/600x600/4f7032/fff?text=${encodeURIComponent(name.slice(0, 4))}`; }} />
              {hasDiscount && <span style={{ position: "absolute", top: 14, right: 14, background: "#ef4444", color: "#fff", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>-{discount}%</span>}
            </div>
            {imgs.length > 1 && (
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {imgs.map((img, idx) => (
                  <img key={idx} src={img} alt="" onClick={() => setImgIdx(idx)} style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", cursor: "pointer", border: `2px solid ${idx === imgIdx ? GREEN : "transparent"}`, opacity: idx === imgIdx ? 1 : 0.55, transition: "all .2s", flexShrink: 0 }} />
                ))}
              </div>
            )}
          </div>

          {/* التفاصيل */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {product.category_name_ar && (
              <span style={{ fontSize: 11, color: GREEN, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", background: CREAM, padding: "3px 12px", borderRadius: 20, display: "inline-block", width: "fit-content" }}>
                {product.category_name_ar}
              </span>
            )}
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: DARK, lineHeight: 1.4, fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>{name}</h1>

            {/* السعر */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderTop: "1px solid #e8edd0", borderBottom: "1px solid #e8edd0" }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: GREEN }}>{displayPrice} ج.م</span>
              {hasDiscount && (
                <>
                  <span style={{ fontSize: 18, color: "#bbb", textDecoration: "line-through" }}>{product.old_price} ج.م</span>
                  <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>وفر {discount}%</span>
                </>
              )}
            </div>

            {/* الوصف */}
            {(product.description_ar || product.description_en) && (
              <div style={{ fontSize: 14, lineHeight: 2, color: "#5a7050" }}
                dangerouslySetInnerHTML={{ __html: product.description_ar || product.description_en || "" }} />
            )}

            {/* المتغيرات */}
            {Object.entries(variantGroups).map(([optName, variants]) => (
              <div key={optName}>
                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: DARK }}>{optName}:</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {variants.map(v => (
                    <button key={v.id} className="variant-btn" onClick={() => setSelectedVariant(v)}
                      style={{ padding: "8px 18px", borderRadius: 10, border: `2px solid ${selectedVariant?.id === v.id ? GREEN : "#d0d9c8"}`, background: selectedVariant?.id === v.id ? GREEN : "#fff", color: selectedVariant?.id === v.id ? "#fff" : DARK, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      {v.option_value}
                      {v.price_override && v.price_override !== product.price ? ` — ${v.price_override} ج.م` : ""}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* التوفر */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, background: "#dcfce7", color: "#166534", width: "fit-content" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              متوفر في المخزون
            </div>

            {/* الكمية */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#5a7050" }}>الكمية:</span>
              <div style={{ display: "flex", alignItems: "center", border: "2px solid #c8d9b0", borderRadius: 12, overflow: "hidden" }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 38, height: 42, border: "none", background: "#f9fdf0", cursor: "pointer", fontSize: 20, fontWeight: 700, color: GREEN }}>−</button>
                <span style={{ width: 46, textAlign: "center", fontSize: 16, fontWeight: 800, color: DARK }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(10, q + 1))} style={{ width: 38, height: 42, border: "none", background: "#f9fdf0", cursor: "pointer", fontSize: 20, fontWeight: 700, color: GREEN }}>+</button>
              </div>
            </div>

            {/* أزرار */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: "auto" }}>
              <button onClick={addToCart}
                style={{ padding: "15px 20px", borderRadius: 14, border: "none", background: added ? "#22c55e" : GREEN, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Readex Pro', 'Cairo', sans-serif", transition: "all .2s", boxShadow: `0 4px 16px rgba(79,112,50,${added ? 0.4 : 0.3})` }}
                onMouseEnter={e => { if (!added) (e.currentTarget as HTMLButtonElement).style.background = GREEN_DARK; }}
                onMouseLeave={e => { if (!added) (e.currentTarget as HTMLButtonElement).style.background = GREEN; }}>
                {added ? "تمت الإضافة للسلة" : "أضف للسلة"}
              </button>
              <Link href="/checkout"
                style={{ display: "block", padding: "15px 20px", borderRadius: 14, border: `2px solid ${GREEN}`, color: GREEN, fontSize: 16, fontWeight: 800, cursor: "pointer", textAlign: "center", textDecoration: "none", transition: "all .2s", boxSizing: "border-box" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = GREEN; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = GREEN; }}>
                اشتري الآن
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
