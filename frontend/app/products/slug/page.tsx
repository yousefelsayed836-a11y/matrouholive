"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const GREEN = "#4f7032";
const CREAM = "#d7f7b3";
const GOLD = "#bd9a52";

interface Product {
  id: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  price: number;
  old_price?: number;
  images?: string[];
  main_image?: string;
  category_name?: string;
  category_name_ar?: string;
  stock?: number;
  is_active: boolean;
  variants?: Array<{ id: string; option_name: string; option_value: string; quantity: number; price_override?: number; }>;
}

interface CartItem {
  product: { id: string; name_ar: string; name_en: string; price: number; image_url?: string; };
  qty: number;
  size: string;
}

function ProductContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id") || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!productId) { setError("لم يتم تحديد المنتج"); setLoading(false); return; }
    fetch(`${API_BASE}/products/${productId}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setProduct(data.product); setLoading(false); })
      .catch(() => { setError("المنتج غير موجود"); setLoading(false); });
  }, [productId]);

  const addToCart = () => {
    if (!product) return;
    const imgs = product.images?.filter(i => i?.startsWith("http")) || [];
    const imgUrl = product.main_image || imgs[0] || "";
    const item: CartItem = { product: { id: product.id, name_ar: product.name_ar || product.name_en, name_en: product.name_en, price: product.price, image_url: imgUrl }, qty, size: "One Size" };
    try {
      const saved = localStorage.getItem("cart");
      let cart: CartItem[] = saved ? JSON.parse(saved) : [];
      const idx = cart.findIndex(i => i.product.id === product.id);
      if (idx >= 0) { cart[idx] = { ...cart[idx], qty: Math.min(10, cart[idx].qty + qty) }; }
      else { cart = [...cart, item]; }
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {}
  };

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>
      <div style={{ textAlign: "center", color: "#888" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <p>جاري التحميل...</p>
      </div>
    </div>
  );

  if (error || !product) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h1 style={{ fontSize: 22, color: "#2a3a20", marginBottom: 12 }}>{error || "المنتج غير موجود"}</h1>
        <Link href="/shop" style={{ padding: "12px 24px", borderRadius: 12, background: GREEN, color: "#fff", textDecoration: "none", fontWeight: 700, fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>
          ← عرض كل المنتجات
        </Link>
      </div>
    </div>
  );

  const imgs = [product.main_image, ...(product.images || [])].filter((i): i is string => !!i && i.startsWith("http"));
  const uniqueImgs = [...new Set(imgs)];
  const displayImgs = uniqueImgs.length > 0 ? uniqueImgs : [`https://placehold.co/600x600/4B6741/fff?text=${encodeURIComponent((product.name_ar || product.name_en).slice(0, 4))}`];
  const hasDiscount = product.old_price && product.old_price > product.price;
  const discount = hasDiscount ? Math.round((1 - product.price / product.old_price!) * 100) : 0;
  const inStock = true;
  const name = product.name_ar || product.name_en;

  return (
    <div style={{ minHeight: "100vh", background: "#f1f7c9", fontFamily: "'Readex Pro', 'Cairo', sans-serif", direction: "rtl" }}>
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&family=Cairo:wght@300;400;600;700;800;900&display=swap');`}</style>

      {/* مسار التنقل */}
      <div style={{ background: CREAM, padding: "12px 24px", borderBottom: "1px solid #c8d9b0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", fontSize: 13, color: "#6a8a5a" }}>
          <Link href="/" style={{ color: GREEN, textDecoration: "none" }}>الرئيسية</Link>
          <span style={{ margin: "0 8px" }}>←</span>
          <Link href="/shop" style={{ color: GREEN, textDecoration: "none" }}>المنتجات</Link>
          <span style={{ margin: "0 8px" }}>←</span>
          <span style={{ color: "#2a3a20", fontWeight: 600 }}>{name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 4px 20px rgba(75,103,65,0.08)" }}>

          {/* الصور */}
          <div>
            <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: CREAM, marginBottom: 12, height: 420 }}>
              <img src={displayImgs[imgIdx]} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/600x600/4B6741/fff?text=${encodeURIComponent(name.slice(0, 4))}`; }} />
              {hasDiscount && <span style={{ position: "absolute", top: 14, right: 14, background: "#ef4444", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>-{discount}%</span>}
            </div>
            {displayImgs.length > 1 && (
              <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
                {displayImgs.map((img, idx) => (
                  <img key={idx} src={img} alt="" onClick={() => setImgIdx(idx)} style={{ width: 70, height: 70, borderRadius: 12, objectFit: "cover", cursor: "pointer", border: idx === imgIdx ? `2px solid ${GREEN}` : "2px solid transparent", opacity: idx === imgIdx ? 1 : 0.6, transition: "all 0.2s", flexShrink: 0 }} />
                ))}
              </div>
            )}
          </div>

          {/* التفاصيل */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {product.category_name_ar && <span style={{ fontSize: 12, color: GREEN, fontWeight: 700, letterSpacing: 1 }}>{product.category_name_ar}</span>}
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#2a3a20", lineHeight: 1.4 }}>{name}</h1>

            {/* السعر */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: GREEN }}>{product.price} ج.م</span>
              {hasDiscount && (
                <>
                  <span style={{ fontSize: 18, color: "#bbb", textDecoration: "line-through" }}>{product.old_price} ج.م</span>
                  <span style={{ background: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>وفر {discount}%</span>
                </>
              )}
            </div>

            {/* التقييم */}
            <div style={{ color: GOLD, fontSize: 18, letterSpacing: 2 }}>★★★★★ <span style={{ fontSize: 13, color: "#888", fontWeight: 400 }}>(تقييم العملاء)</span></div>

            {/* الوصف */}
            {(product.description_ar || product.description_en) && (
              <div style={{ fontSize: 14, lineHeight: 1.9, color: "#5a7050", borderTop: "1px solid #e8edd0", paddingTop: 16 }}
                dangerouslySetInnerHTML={{ __html: product.description_ar || product.description_en || "" }} />
            )}

            {/* المخزون */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 20, fontSize: 14, fontWeight: 700, background: "#dcfce7", color: "#166534" }}>
              ✅ متوفر
            </div>

            {/* الكمية */}
            {inStock && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#5a7050" }}>الكمية:</span>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #c8d9b0", borderRadius: 10, overflow: "hidden" }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 40, border: "none", background: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 700, color: GREEN }}>-</button>
                  <span style={{ width: 44, textAlign: "center", fontSize: 15, fontWeight: 700 }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(10, q + 1))} style={{ width: 36, height: 40, border: "none", background: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 700, color: GREEN }}>+</button>
                </div>
              </div>
            )}

            {/* أزرار الإجراء */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: "auto" }}>
              <button onClick={addToCart} disabled={!inStock}
                style={{ padding: "15px 20px", borderRadius: 14, border: "none", background: inStock ? GREEN : "#ccc", color: "#fff", fontSize: 16, fontWeight: 700, cursor: inStock ? "pointer" : "not-allowed", fontFamily: "'Readex Pro', 'Cairo', sans-serif", transition: "all 0.2s" }}
                onMouseEnter={e => { if (inStock) (e.currentTarget as HTMLButtonElement).style.background = "#3d5828"; }}
                onMouseLeave={e => { if (inStock) (e.currentTarget as HTMLButtonElement).style.background = GREEN; }}>
                {added ? "✅ تمت الإضافة!" : inStock ? "🛒 أضف للسلة" : "نفد المخزون"}
              </button>
              <Link href="/checkout" style={{ display: "block", padding: "15px 20px", borderRadius: 14, border: `2px solid ${GREEN}`, color: GREEN, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Readex Pro', 'Cairo', sans-serif", textAlign: "center", textDecoration: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = GREEN; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = GREEN; }}>
                اشتري الآن ←
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: 60, fontFamily: "'Readex Pro', 'Cairo', sans-serif", color: "#888" }}>جاري التحميل...</div>}>
      <ProductContent />
    </Suspense>
  );
}
