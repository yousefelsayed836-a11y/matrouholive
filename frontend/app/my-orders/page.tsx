"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://api.matrouholive.com") + "/api";

const G  = "#4f7032";
const GL = "#d7f7b3";
const CB = "#f1f7c9";
const DK = "#2d2b27";
const AU = "#bd9a52";

interface OrderItem {
  id?: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  quantity: number;
  price: number;
  size?: string;
  total?: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address?: string;
  city?: string;
  governorate?: string;
  total_amount: number;
  shipping_cost?: number;
  status: string;
  created_at: string;
  notes?: string;
  items?: OrderItem[];
}

interface Product {
  id: string;
  name_ar?: string;
  name_en: string;
  price: number;
  main_image?: string;
  images?: string[];
  stock?: number;
}

const STATUS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:    { label: "قيد الانتظار", color: "#92400e", bg: "#fef3c7", icon: "⏳" },
  processing: { label: "جاري التجهيز", color: "#1d4ed8", bg: "#dbeafe", icon: "🔧" },
  shipped:    { label: "تم الشحن",     color: "#6d28d9", bg: "#ede9fe", icon: "🚚" },
  delivered:  { label: "تم التسليم",   color: "#166534", bg: "#dcfce7", icon: "✅" },
  completed:  { label: "مكتمل",        color: "#166534", bg: "#dcfce7", icon: "✅" },
  cancelled:  { label: "ملغي",         color: "#991b1b", bg: "#fee2e2", icon: "❌" },
};

function fmt(n: number) { return n.toLocaleString("ar-EG"); }

function getImg(p: Product): string {
  const img = p.main_image || (p.images && p.images[0]);
  if (!img) return `https://placehold.co/80x80/4f7032/d7f7b3?text=${encodeURIComponent((p.name_ar || p.name_en).slice(0, 4))}`;
  return img.startsWith("http") ? img : img;
}

function MyOrdersContent() {
  const params = useSearchParams();
  const initQ = params.get("phone") || params.get("q") || "";
  const [query, setQuery] = useState(initQ);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  /* edit state */
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  /* product search for adding items */
  const [products, setProducts] = useState<Product[]>([]);
  const [prodSearch, setProdSearch] = useState("");
  const [showProdPicker, setShowProdPicker] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (!term) return;
    setLoading(true); setError(""); setSearched(true);
    try {
      const res = await fetch(`${API_BASE}/orders/search?q=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error("خطأ في الاتصال");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setError("تعذّر جلب الطلبات، تحقق من الاتصال وحاول مرة أخرى");
    }
    setLoading(false);
  }, []);

  /* auto-search if query came from URL */
  useEffect(() => {
    if (initQ) doSearch(initQ);
  }, []);

  const fetchProducts = async () => {
    if (products.length > 0) return;
    try {
      const res = await fetch(`${API_BASE}/products?is_active=true&limit=200`);
      const d = await res.json();
      setProducts(d.products || []);
    } catch {}
  };

  const openEdit = (order: Order) => {
    setEditOrder(order);
    setEditItems((order.items || []).map(i => ({ ...i })));
    setProdSearch("");
    setShowProdPicker(false);
    fetchProducts();
  };

  const closeEdit = () => { setEditOrder(null); setEditItems([]); };

  const changeQty = (idx: number, delta: number) => {
    setEditItems(prev => {
      const next = [...prev];
      const newQty = (next[idx].quantity || 1) + delta;
      if (newQty < 1) return prev;
      next[idx] = { ...next[idx], quantity: newQty };
      return next;
    });
  };

  const removeItem = (idx: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };

  const addProduct = (p: Product) => {
    const existing = editItems.findIndex(i => i.product_id === p.id);
    if (existing >= 0) {
      changeQty(existing, 1);
    } else {
      setEditItems(prev => [...prev, {
        product_id: p.id,
        product_name: p.name_ar || p.name_en,
        quantity: 1,
        price: p.price,
      }]);
    }
    setShowProdPicker(false);
    setProdSearch("");
  };

  const saveEdit = async () => {
    if (!editOrder || editItems.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${editOrder.id}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: editItems }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "فشل الحفظ"); setSaving(false); return; }
      setOrders(prev => prev.map(o => o.id === editOrder.id ? data : o));
      closeEdit();
    } catch { alert("خطأ في الاتصال"); }
    setSaving(false);
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا الطلب؟")) return;
    setCancelling(id);
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" } : o));
      else alert("فشل الإلغاء، حاول مرة أخرى");
    } catch { alert("خطأ في الاتصال"); }
    setCancelling(null);
  };

  const editSubtotal = editItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const editShipping = editOrder?.shipping_cost || 0;

  const filteredProducts = products.filter(p => {
    const q = prodSearch.trim().toLowerCase();
    if (!q) return true;
    return (p.name_ar || "").includes(q) || p.name_en.toLowerCase().includes(q);
  });

  return (
    <div style={{ background: CB, minHeight: "100vh", fontFamily: "'Cairo', 'Readex Pro', sans-serif", direction: "rtl" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
      `}</style>

      {/* Nav bar */}
      <div style={{ background: "#fff", borderBottom: `3px solid ${GL}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
        <Link href="/" style={{ fontSize: 20, fontWeight: 900, color: G, textDecoration: "none" }}>مطروح أوليفي</Link>
        <span style={{ fontSize: 15, fontWeight: 700, color: DK }}>📦 طلباتي</span>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>📦</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, color: DK }}>طلباتي</h1>
          <p style={{ margin: 0, color: "#777", fontSize: 14 }}>ابحث بالاسم أو رقم الموبايل أو رقم الطلب</p>
        </div>

        {/* Search */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,.06)", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              placeholder="مثال: أحمد علي  أو  01012345678  أو  ABC123"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch(query)}
              style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${GL}`, fontSize: 15, fontFamily: "inherit", outline: "none", background: CB, direction: "rtl" }}
            />
            <button onClick={() => doSearch(query)} disabled={loading || !query.trim()}
              style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: loading ? "#aaa" : G, color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "default" : "pointer", flexShrink: 0 }}>
              {loading ? "⏳" : "🔍 بحث"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {["بالاسم", "بالموبايل", "برقم الطلب"].map(hint => (
              <span key={hint} style={{ fontSize: 11, background: GL, color: G, borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>✓ {hint}</span>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fee2e2", border: "1.5px solid #fca5a5", borderRadius: 14, padding: 16, marginBottom: 20, color: "#991b1b", fontWeight: 600, textAlign: "center" }}>
            ⚠️ {error}
          </div>
        )}

        {/* No results */}
        {searched && !loading && !error && orders.length === 0 && (
          <div style={{ background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ color: "#888", fontSize: 15, margin: 0 }}>لم نجد طلبات لهذا الرقم</p>
          </div>
        )}

        {/* Orders list */}
        {orders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {orders.map(order => {
              const st = STATUS[order.status] || STATUS.pending;
              const canEdit   = ["pending", "processing"].includes(order.status);
              const canCancel = order.status === "pending";
              const date = new Date(order.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
              return (
                <div key={order.id} style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 18px rgba(0,0,0,.07)", border: `1.5px solid ${canEdit ? GL : "#f0f0f0"}` }}>
                  {/* Order header */}
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 15, color: DK }}>طلب #{order.id.slice(-6)}</span>
                      <span style={{ fontSize: 12, color: "#aaa", marginRight: 10 }}>{date}</span>
                    </div>
                    <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>
                      {st.icon} {st.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div style={{ padding: "14px 20px" }}>
                    {(order.items || []).map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < (order.items?.length || 0) - 1 ? "1px solid #f3f4f6" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ background: GL, color: G, borderRadius: 8, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>×{item.quantity}</span>
                          <span style={{ fontSize: 13, color: DK, fontWeight: 600 }}>{item.product_name || "منتج"}</span>
                          {item.size && <span style={{ fontSize: 11, color: "#aaa" }}>({item.size})</span>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: G }}>{fmt(item.price * item.quantity)} ج.م</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: "12px 20px", background: "#fafafa", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: 12, color: "#888" }}>شحن: {(order.shipping_cost || 0) === 0 ? "مجاني" : fmt(order.shipping_cost || 0) + " ج.م"} | </span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: G }}>الإجمالي: {fmt(order.total_amount)} ج.م</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {canEdit && (
                        <button onClick={() => openEdit(order)}
                          style={{ padding: "8px 18px", borderRadius: 10, border: `1.5px solid ${G}`, background: GL, color: G, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                          ✏️ تعديل
                        </button>
                      )}
                      {canCancel && (
                        <button onClick={() => cancelOrder(order.id)} disabled={cancelling === order.id}
                          style={{ padding: "8px 18px", borderRadius: 10, border: "1.5px solid #dc2626", background: "#fee2e2", color: "#dc2626", fontWeight: 700, fontSize: 13, cursor: cancelling === order.id ? "default" : "pointer", opacity: cancelling === order.id ? .6 : 1 }}>
                          {cancelling === order.id ? "⏳" : "❌ إلغاء"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/" style={{ color: G, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>← العودة للمتجر</Link>
        </div>
      </div>

      {/* ══ EDIT MODAL ══ */}
      {editOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={closeEdit}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 680, maxHeight: "90vh", overflow: "auto", padding: "24px 20px 32px" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: DK }}>✏️ تعديل طلب #{editOrder.id.slice(-6)}</h2>
              <button onClick={closeEdit} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16, color: "#666" }}>✕</button>
            </div>

            {/* Current items */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#888" }}>المنتجات في الطلب</p>
              {editItems.length === 0 && (
                <div style={{ textAlign: "center", padding: 20, color: "#aaa", fontSize: 13 }}>لا يوجد منتجات — أضف منتجاً على الأقل</div>
              )}
              {editItems.map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DK }}>{item.product_name || "منتج"}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{item.price} ج.م × {item.quantity} = {fmt(item.price * item.quantity)} ج.م</div>
                  </div>
                  {/* qty controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => changeQty(idx, -1)} disabled={item.quantity <= 1}
                      style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${GL}`, background: "#fff", color: G, fontWeight: 900, fontSize: 16, cursor: item.quantity <= 1 ? "default" : "pointer", opacity: item.quantity <= 1 ? .4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center", fontSize: 14 }}>{item.quantity}</span>
                    <button onClick={() => changeQty(idx, 1)}
                      style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${GL}`, background: GL, color: G, fontWeight: 900, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                  <button onClick={() => removeItem(idx)}
                    style={{ background: "#fee2e2", border: "none", borderRadius: 8, padding: "6px 10px", color: "#dc2626", fontWeight: 700, cursor: "pointer", fontSize: 12, flexShrink: 0 }}>حذف</button>
                </div>
              ))}
            </div>

            {/* Add product */}
            <button onClick={() => setShowProdPicker(v => !v)}
              style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `2px dashed ${G}`, background: "transparent", color: G, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 14 }}>
              ➕ إضافة منتج
            </button>

            {showProdPicker && (
              <div style={{ background: CB, borderRadius: 14, padding: 14, marginBottom: 16 }}>
                <input placeholder="ابحث عن منتج..." value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${GL}`, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10, background: "#fff" }} />
                <div style={{ maxHeight: 200, overflow: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {filteredProducts.slice(0, 30).map(p => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 10, padding: "8px 12px" }}>
                      <img src={getImg(p)} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }}
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/36x36/4f7032/d7f7b3?text=+`; }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: DK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name_ar || p.name_en}</div>
                        <div style={{ fontSize: 11, color: G, fontWeight: 700 }}>{p.price} ج.م</div>
                      </div>
                      <button onClick={() => addProduct(p)}
                        style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: G, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>إضافة</button>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && <div style={{ textAlign: "center", color: "#aaa", fontSize: 12, padding: 10 }}>لا توجد نتائج</div>}
                </div>
              </div>
            )}

            {/* Order total */}
            <div style={{ background: CB, borderRadius: 12, padding: "12px 16px", marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 4 }}>
                <span>المجموع الفرعي</span><span>{fmt(editSubtotal)} ج.م</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#666", marginBottom: 6 }}>
                <span>الشحن</span><span>{editShipping === 0 ? "مجاني 🎉" : fmt(editShipping) + " ج.م"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 900, color: G, borderTop: "1px solid #ddd", paddingTop: 8 }}>
                <span>الإجمالي</span><span>{fmt(editSubtotal + editShipping)} ج.م</span>
              </div>
            </div>

            <button onClick={saveEdit} disabled={saving || editItems.length === 0}
              style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: saving || editItems.length === 0 ? "#aaa" : G, color: "#fff", fontWeight: 800, fontSize: 15, cursor: saving || editItems.length === 0 ? "default" : "pointer" }}>
              {saving ? "⏳ جاري الحفظ..." : "💾 حفظ التعديلات"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f1f7c9", display: "flex", alignItems: "center", justifyContent: "center" }}>جاري التحميل...</div>}>
      <MyOrdersContent />
    </Suspense>
  );
}
