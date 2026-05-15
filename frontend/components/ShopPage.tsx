"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";

interface Product {
  id: string; name_en: string; name_ar?: string; description_en?: string;
  description_ar?: string; price: number; old_price?: number; material?: string;
  water_resistance?: string; size_info?: string; images?: string[];
  main_image?: string; stock?: number; category_name?: string; is_active: boolean;
}
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const GREEN = "#4B6741";
const GREEN_DARK = "#3A5232";
const CREAM = "#E8EDD0";

function getImg(p: Product) {
  const img = p.main_image || (p.images && p.images[0]);
  if (!img) return `https://placehold.co/400x400/4B6741/fff?text=${encodeURIComponent((p.name_ar || p.name_en)?.slice(0,3) || "؟")}`;
  return img.startsWith("http") ? img : `${BACKEND}${img}`;
}

interface Props { collectionSlug: string; title: string; breadcrumb: string; }

export default function ShopPage({ collectionSlug, title, breadcrumb }: Props) {
  const router = useRouter();
  const { cartItems, cartCount, cartTotal, addToCart, removeFromCart, updateQty } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedId, setAddedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const url = collectionSlug
        ? `${API_BASE}/products?is_active=true&collection=${collectionSlug}&limit=500`
        : `${API_BASE}/products?is_active=true&limit=500`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e: any) { setError(e.message || "حدث خطأ"); }
    finally { setLoading(false); }
  }, [collectionSlug]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAdd = (product: Product, qty: number = 1) => {
    if (false) return; // stock check disabled
    const ok = addToCart(
      { id: product.id, name_en: product.name_ar || product.name_en, price: product.price, image_url: getImg(product) },
      qty, product.size_info || "One Size", product.stock
    );
    if (ok) { setAddedId(product.id); setTimeout(() => setAddedId(null), 1500); setShowCart(true); }
  };

  const filtered = products.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.name_ar || "").includes(search) || p.name_en.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) =>
    sortBy === "price-low" ? a.price - b.price :
    sortBy === "price-high" ? b.price - a.price :
    sortBy === "name" ? (a.name_ar || a.name_en).localeCompare(b.name_ar || b.name_en, "ar") : 0
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fdf4", direction: "rtl" }}>

      {/* Floating cart */}
      <button onClick={() => setShowCart(true)} style={{ position: "fixed", bottom: 28, left: 28, width: 62, height: 62, borderRadius: "50%", background: `linear-gradient(135deg,${GREEN},${GREEN_DARK})`, color: "#fff", border: "none", fontSize: 26, cursor: "pointer", zIndex: 100, boxShadow: "0 6px 24px rgba(75,103,65,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        🛒{cartCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 22, height: 22, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
      </button>

      {/* Cart sidebar */}
      {showCart && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowCart(false)}>
          <div style={{ position: "absolute", right: 0, top: 0, width: 400, maxWidth: "92vw", height: "100%", background: "#fff", padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", direction: "rtl" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a2a10" }}>🛒 سلة التسوق ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", color: "#aaa", lineHeight: 1 }}>×</button>
            </div>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🛒</div>
                <p style={{ fontWeight: 700, fontSize: 16 }}>السلة فارغة</p>
                <p style={{ fontSize: 13, color: "#bbb" }}>أضف منتجات لتبدأ التسوق</p>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {cartItems.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid #f0f4ea" }}>
                      <div style={{ width: 66, height: 66, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#f5f9ee", border: "1px solid #e8f0e0" }}>
                        {item.product.image_url
                          ? <img src={item.product.image_url} alt={item.product.name_en} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 22 }}>🫒</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4, color: "#1a2a10", marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>{item.product.name_en}</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: GREEN }}>{item.product.price * item.qty} ج.م</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                          <button onClick={() => updateQty(item.product.id, item.size, -1)} style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${CREAM}`, background: "#fff", cursor: "pointer", fontWeight: 700, color: GREEN, fontSize: 16 }}>−</button>
                          <span style={{ fontWeight: 800, minWidth: 22, textAlign: "center", fontSize: 14 }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.product.id, item.size, 1)} style={{ width: 28, height: 28, borderRadius: "50%", border: `1.5px solid ${CREAM}`, background: "#fff", cursor: "pointer", fontWeight: 700, color: GREEN, fontSize: 16 }}>+</button>
                          <button onClick={() => removeFromCart(item.product.id, item.size)} style={{ marginRight: "auto", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>حذف</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "2px solid #f0f4ea", paddingTop: 18, marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#888", fontSize: 14 }}>المجموع</span>
                    <span style={{ fontWeight: 900, fontSize: 16, color: "#1a2a10" }}>{cartTotal} ج.م</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, fontSize: 13 }}>
                    <span style={{ color: "#888" }}>الشحن</span>
                    <span style={{ color: "#888", fontWeight: 700 }}>يُحسب عند الطلب</span>
                  </div>
                  <button onClick={() => { setShowCart(false); router.push("/checkout"); }} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: `linear-gradient(135deg,${GREEN},${GREEN_DARK})`, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(75,103,65,0.35)" }}>إتمام الطلب ←</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header bar */}
      <div style={{ background: "#fff", padding: "14px 24px", borderBottom: "1px solid #e8f0e0", boxShadow: "0 2px 12px rgba(75,103,65,0.06)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a2a10" }}>{title}</h1>
              <div style={{ fontSize: 13, color: "#999", marginTop: 3 }}>
                <Link href="/" style={{ color: GREEN, textDecoration: "none", fontWeight: 600 }}>الرئيسية</Link>
                <span style={{ margin: "0 6px", color: "#ccc" }}>/</span>
                <span>{breadcrumb}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {/* Search */}
              <div style={{ position: "relative" }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  style={{ padding: "9px 14px 9px 36px", borderRadius: 25, border: `1.5px solid ${CREAM}`, fontSize: 13, outline: "none", width: 200, background: "#f8fdf4", direction: "rtl" }}
                />
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#aaa" }}>🔍</span>
              </div>
              {/* Sort */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "9px 16px", borderRadius: 25, border: `1.5px solid ${CREAM}`, fontSize: 13, cursor: "pointer", background: "#fff", outline: "none", color: "#444" }}>
                <option value="newest">الأحدث</option>
                <option value="price-low">السعر: الأقل أولاً</option>
                <option value="price-high">السعر: الأعلى أولاً</option>
                <option value="name">الاسم أ-ي</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 20px" }}>
        {loading ? (
          <div className="sg">{[...Array(8)].map((_, i) => <div key={i} className="sk" />)}</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 60, color: "#ef4444" }}>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <p style={{ fontWeight: 700 }}>حدث خطأ في تحميل المنتجات</p>
            <button onClick={fetchProducts} style={{ padding: "10px 28px", borderRadius: 25, border: `2px solid ${GREEN}`, background: "transparent", color: GREEN, fontWeight: 700, cursor: "pointer", marginTop: 12 }}>إعادة المحاولة</button>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "#aaa" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
            <p style={{ fontWeight: 700, fontSize: 16 }}>لا توجد منتجات</p>
            {search && <p style={{ fontSize: 13 }}>جرّب كلمة بحث أخرى</p>}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 18, fontSize: 13, color: "#888", fontWeight: 600 }}>{sorted.length} منتج</div>
            <div className="sg">
              {sorted.map(p => {
                const img = getImg(p);
                const name = p.name_ar || p.name_en;
                const hasD = p.old_price && p.old_price > p.price;
                const disc = hasD ? Math.round((1 - p.price / p.old_price!) * 100) : 0;
                const qty = quantities[p.id] || 1;
                const oos = false;
                const low = false;
                const added = addedId === p.id;
                return (
                  <div key={p.id} className="pc" style={{ opacity: oos ? 0.6 : 1 }}>
                    <div style={{ position: "relative", height: 250, background: "#f5f9ee", overflow: "hidden", cursor: "pointer", borderRadius: "16px 16px 0 0" }} onClick={() => setSelectedProduct(p)}>
                      <img src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.35s" }} className="pi" loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/4B6741/fff?text=${encodeURIComponent(name.slice(0,3))}`; }} />
                      {hasD && <span style={{ position: "absolute", top: 10, right: 10, background: "#ef4444", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>-{disc}%</span>}
                      {oos && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", color: "#fff", fontWeight: 800, fontSize: 15 }}>نفذ المخزون</span>}
                      {low && !oos && <span style={{ position: "absolute", bottom: 8, right: 8, background: "#f97316", color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>🔥 آخر {p.stock} قطع</span>}
                    </div>
                    <div style={{ padding: "14px 14px 16px" }}>
                      <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#1a2a10", lineHeight: 1.4, cursor: "pointer", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 40 } as any} onClick={() => setSelectedProduct(p)}>{name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 17, fontWeight: 900, color: GREEN }}>{p.price} ج.م</span>
                        {hasD && <span style={{ fontSize: 12, color: "#bbb", textDecoration: "line-through" }}>{p.old_price} ج.م</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {!oos && (
                          <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${CREAM}`, borderRadius: 10, overflow: "hidden" }}>
                            <button onClick={() => setQuantities(q => ({ ...q, [p.id]: Math.max(1, (q[p.id] || 1) - 1) }))} style={{ width: 32, height: 36, border: "none", background: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 700, color: GREEN }}>−</button>
                            <span style={{ width: 32, textAlign: "center", fontSize: 14, fontWeight: 700, lineHeight: "36px" }}>{qty}</span>
                            <button onClick={() => setQuantities(q => ({ ...q, [p.id]: Math.min(10, (q[p.id] || 1) + 1) }))} style={{ width: 32, height: 36, border: "none", background: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 700, color: GREEN }}>+</button>
                          </div>
                        )}
                        <button onClick={() => handleAdd(p, qty)} disabled={oos}
                          style={{ flex: 1, height: 36, borderRadius: 10, border: "none", background: oos ? "#e5e7eb" : added ? "#22c55e" : `linear-gradient(135deg,${GREEN},${GREEN_DARK})`, color: oos ? "#9ca3af" : "#fff", fontSize: 13, fontWeight: 800, cursor: oos ? "not-allowed" : "pointer", transition: "all 0.3s" }}>
                          {oos ? "نفذ" : added ? "✓ أُضيف!" : "🛒 أضف"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.72)", padding: 16 }} onClick={() => setSelectedProduct(null)}>
          <div style={{ background: "#fff", borderRadius: 22, width: 860, maxWidth: "95vw", maxHeight: "92vh", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", direction: "rtl" }} onClick={e => e.stopPropagation()}>
            <div style={{ background: "#f5f9ee", minHeight: 380, borderRadius: "22px 0 0 22px", overflow: "hidden" }}>
              <img src={getImg(selectedProduct)} alt={selectedProduct.name_ar || selectedProduct.name_en}
                style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 380 }} />
            </div>
            <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#1a2a10", lineHeight: 1.4 }}>{selectedProduct.name_ar || selectedProduct.name_en}</h2>
                  {selectedProduct.name_ar && <p style={{ margin: 0, fontSize: 13, color: "#999" }}>{selectedProduct.name_en}</p>}
                </div>
                <button onClick={() => setSelectedProduct(null)} style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", color: "#ccc", flexShrink: 0 }}>×</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: GREEN }}>{selectedProduct.price} ج.م</span>
                {selectedProduct.old_price && selectedProduct.old_price > selectedProduct.price &&
                  <span style={{ fontSize: 16, color: "#ccc", textDecoration: "line-through" }}>{selectedProduct.old_price} ج.م</span>}
              </div>
              {(selectedProduct.description_ar || selectedProduct.description_en) && (
                <div style={{ fontSize: 13, lineHeight: 1.9, color: "#666", borderTop: "1px solid #f0f4ea", paddingTop: 12 }}
                  dangerouslySetInnerHTML={{ __html: selectedProduct.description_ar || selectedProduct.description_en || "" }} />
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedProduct.material && <span style={{ padding: "6px 12px", borderRadius: 10, fontSize: 12, background: "#f0f6ea", color: GREEN, fontWeight: 700 }}>✨ {selectedProduct.material}</span>}
                {(selectedProduct.stock ?? 1) === 0
                  ? <span style={{ padding: "6px 12px", borderRadius: 10, fontSize: 12, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>❌ نفذ المخزون</span>
                  : (selectedProduct.stock ?? 99) <= 5
                  ? <span style={{ padding: "6px 12px", borderRadius: 10, fontSize: 12, background: "#fff7ed", color: "#c2410c", fontWeight: 700 }}>🔥 آخر {selectedProduct.stock} قطع</span>
                  : <span style={{ padding: "6px 12px", borderRadius: 10, fontSize: 12, background: "#dcfce7", color: "#166534", fontWeight: 700 }}>✅ متاح</span>}
              </div>
              <button onClick={() => { handleAdd(selectedProduct, 1); setSelectedProduct(null); }}
                disabled={(selectedProduct.stock ?? 1) === 0}
                style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: (selectedProduct.stock ?? 1) === 0 ? "#e5e7eb" : `linear-gradient(135deg,${GREEN},${GREEN_DARK})`, color: (selectedProduct.stock ?? 1) === 0 ? "#9ca3af" : "#fff", fontSize: 15, fontWeight: 800, cursor: (selectedProduct.stock ?? 1) === 0 ? "not-allowed" : "pointer", marginTop: "auto", boxShadow: (selectedProduct.stock ?? 1) === 0 ? "none" : "0 4px 16px rgba(75,103,65,0.3)" }}>
                {(selectedProduct.stock ?? 1) === 0 ? "نفذ المخزون" : "🛒 أضف للسلة"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px}
        .pc{background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eef4e8;box-shadow:0 2px 14px rgba(75,103,65,.07);transition:transform .22s,box-shadow .22s}
        .pc:hover{transform:translateY(-5px);box-shadow:0 10px 28px rgba(75,103,65,.16)!important}
        .pc:hover .pi{transform:scale(1.06)}
        .sk{height:320px;border-radius:16px;background:linear-gradient(90deg,#f0f4ea 25%,#e4edd8 50%,#f0f4ea 75%);background-size:200%;animation:pulse 1.4s ease infinite}
        @media(max-width:768px){.sg{grid-template-columns:repeat(2,1fr);gap:12px}}
        @media(max-width:400px){.sg{grid-template-columns:1fr;gap:12px}}
      `}</style>
    </div>
  );
}
