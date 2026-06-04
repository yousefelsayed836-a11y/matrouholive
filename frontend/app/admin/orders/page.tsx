"use client";

import { useState, useEffect } from "react";

interface OrderItem {
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
  phone2?: string;
  shipping_address?: string;
  address?: string;
  city?: string;
  governorate?: string;
  total_amount: number;
  shipping_cost?: number;
  status: string;
  shipped_by?: string;
  created_at: string;
  notes?: string;
  items?: OrderItem[];
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ✅ Fetch real product image from API
async function fetchProductImage(productId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/products/${productId}`);
    const data = await res.json();
    const p = data.product || data;
    const img = p.main_image || (p.images && p.images[0]);
    if (!img) return null;
    return img.startsWith("http") ? img : `${BACKEND}${img}`;
  } catch { return null; }
}

interface ShippingRate { name: string; nameAr: string; cost: number; cities: { name: string; cost: number }[]; }

function getShippingRate(rates: ShippingRate[], governorate?: string, city?: string): number {
  if (!governorate && !city) return 0;
  const gov = rates.find(r =>
    r.nameAr === governorate || r.name.toLowerCase() === (governorate || "").toLowerCase() ||
    r.cities.some(c => c.name.toLowerCase() === (city || "").toLowerCase())
  );
  if (!gov) return 0;
  const cityRate = gov.cities.find(c => c.name.toLowerCase() === (city || "").toLowerCase());
  return cityRate ? cityRate.cost : gov.cost;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFreeReport, setShowFreeReport] = useState(false);
  const [showShipperReport, setShowShipperReport] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);

  useEffect(() => {
    fetchOrders();
    fetch(`${API_BASE}/settings/shipping_rates`).then(r => r.json()).then(d => {
      if (d.value) try { const p = JSON.parse(d.value); if (p.rates) setShippingRates(p.rates); } catch {}
    }).catch(() => {});
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true); setError("");
      const res = await fetch(`${API_BASE}/orders`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredOrders.map(o => o.id)));
  };
  const applyBulkStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    await Promise.all([...selectedIds].map(id => updateStatus(id, bulkStatus)));
    setSelectedIds(new Set());
    setBulkStatus("");
  };
  const shareSelected = async () => {
    const selected = filteredOrders.filter(o => selectedIds.has(o.id));
    const text = selected.map(o => {
      const items = (o.items || []).map(i => `• ${i.product_name || "منتج"} × ${i.quantity} — ${i.price * i.quantity} EGP`).join("\n");
      const shipping = (o.shipping_cost ?? 0) === 0 ? "مجاني 🎉" : `${o.shipping_cost} EGP`;
      return `📦 أوردر #${o.id.slice(-6)}\n👤 ${o.customer_name}\n📞 ${o.customer_phone}${o.phone2 ? "\n💬 " + o.phone2 : ""}\n📍 ${o.shipping_address || o.address || ""}${items ? "\n\n" + items : ""}\n\n🚚 شحن: ${shipping}\n💰 الإجمالي: ${fmt(o.total_amount)} EGP\n📌 الحالة: ${o.status}`;
    }).join("\n\n" + "─".repeat(30) + "\n\n");
    if (navigator.share) { try { await navigator.share({ title: `${selected.length} أوردرات`, text }); } catch {} }
    else { await navigator.clipboard.writeText(text).catch(() => {}); alert("✅ تم نسخ الأوردرات!"); }
  };


  const shareOrder = async (order: Order) => {
    const items = (order.items || []).map(i => `• ${i.product_name || "منتج"} × ${i.quantity} — ${i.price * i.quantity} EGP`).join("\n");
    const shipping = (order.shipping_cost ?? 0) === 0 ? "مجاني 🎉" : `${order.shipping_cost} EGP`;
    const text = `📦 أوردر #${order.id.slice(-6)}\n👤 ${order.customer_name}\n📞 ${order.customer_phone}${order.phone2 ? "\n💬 " + order.phone2 : ""}\n📍 ${order.shipping_address || order.address || ""}\n\n${items}\n\n🚚 شحن: ${shipping}\n💰 الإجمالي: ${fmt(order.total_amount)} EGP\n📌 الحالة: ${order.status}`;
    if (navigator.share) {
      try { await navigator.share({ title: `أوردر #${order.id.slice(-6)}`, text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      alert("✅ تم نسخ تفاصيل الأوردر!");
    }
  };

  const openOrder = async (order: Order) => {
    setSelectedOrder(order);
    if (!order.items) return;
    const newImages: Record<string, string> = {};
    await Promise.all(order.items.map(async (item) => {
      if (!productImages[item.product_id]) {
        const img = await fetchProductImage(item.product_id);
        if (img) newImages[item.product_id] = img;
      }
    }));
    setProductImages(prev => ({ ...prev, ...newImages }));
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_BASE}/orders/${id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, status } : null);
    } catch {}
  };

  const updateShippedBy = async (id: string, shipped_by: string) => {
    try {
      await fetch(`${API_BASE}/orders/${id}/shipped-by`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipped_by }),
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, shipped_by } : o));
      if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, shipped_by } : null);
    } catch {}
  };

  const handlePrint = (order: Order) => {
    const items = order.items || [];
    const address = order.shipping_address || order.address || "";
    const shipping = order.shipping_cost || 0;
    const subtotal = (order.total_amount || 0) - shipping;
    const phone2 = order.phone2 || "";

    const itemsHtml = items.map(item => {
      const img = productImages[item.product_id];
      const imgHtml = img
        ? `<img src="${img}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;border:1px solid #eee;" />`
        : `<div style="width:48px;height:48px;border-radius:8px;background:#f5f9ee;display:flex;align-items:center;justify-content:center;font-size:20px;">💍</div>`;
      return `
        <tr>
          <td style="padding:10px 8px;">${imgHtml}</td>
          <td style="padding:10px 8px;font-weight:600;">${item.product_name || "Product"}</td>
          <td style="padding:10px 8px;text-align:center;">${item.size || "-"}</td>
          <td style="padding:10px 8px;text-align:center;font-weight:700;">${item.quantity}</td>
          <td style="padding:10px 8px;text-align:right;">${item.price} EGP</td>
          <td style="padding:10px 8px;text-align:right;font-weight:700;color:#4B6741;">${(item.total || item.price * item.quantity)} EGP</td>
        </tr>`;
    }).join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order.id.slice(-6)}</title>
        <style>
          /* ✅ Full page width, half page height */
          @page {
            size: A4 landscape;
            margin: 10mm 14mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            color: #222;
            font-size: 13px;
            /* Half the page height */
            max-height: 50vh;
            overflow: hidden;
          }
          .wrapper {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            height: 100%;
          }
          .left { display: flex; flex-direction: column; gap: 10px; }
          .right { display: flex; flex-direction: column; }
          .logo { color: #4B6741; font-size: 22px; font-weight: 800; margin-bottom: 2px; }
          .order-num { font-size: 13px; color: #888; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #4B6741; font-weight: 700; border-bottom: 1.5px solid #4B6741; padding-bottom: 4px; margin-bottom: 8px; }
          .info-row { display: flex; gap: 8px; padding: 3px 0; font-size: 12px; }
          .info-label { color: #888; min-width: 80px; }
          .info-val { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #4B6741; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
          th:nth-child(3), th:nth-child(4) { text-align: center; }
          th:nth-child(5), th:nth-child(6) { text-align: right; }
          td { border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
          .total-area { margin-top: 8px; border-top: 2px solid #4B6741; padding-top: 8px; display: flex; justify-content: flex-end; }
          .total-box { min-width: 200px; }
          .total-row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
          .total-final { display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #4B6741; padding-top: 6px; margin-top: 4px; border-top: 1px solid #eee; }
          .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; background: ${order.status === "completed" ? "#dcfce7" : order.status === "cancelled" ? "#fee2e2" : "#fef3c7"}; color: ${order.status === "completed" ? "#166534" : order.status === "cancelled" ? "#991b1b" : "#92400e"}; }
          .no-print { display: none; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <!-- LEFT: Customer & Order Info -->
          <div class="left">
            <div>
              <div class="logo">مطروح أوليفي ✦</div>
              <div class="order-num">Order #${order.id.slice(-6)} &nbsp;|&nbsp; ${new Date(order.created_at).toLocaleDateString("en-GB")} &nbsp;|&nbsp; <span class="status-badge">${order.status}</span></div>
            </div>

            <div>
              <div class="section-title">📦 Customer</div>
              <div class="info-row"><span class="info-label">Name:</span><span class="info-val">${order.customer_name}</span></div>
              <div class="info-row"><span class="info-label">📞 Phone:</span><span class="info-val">${order.customer_phone}</span></div>
              ${phone2 ? `<div class="info-row"><span class="info-label">💬 WhatsApp:</span><span class="info-val">${phone2}</span></div>` : ""}
              <div class="info-row"><span class="info-label">📍 Address:</span><span class="info-val">${address}</span></div>
              <div class="info-row"><span class="info-label">🏙️ City:</span><span class="info-val">${order.city || "-"} ${order.governorate ? "/ " + order.governorate : ""}</span></div>
              ${order.notes ? `<div class="info-row"><span class="info-label">📝 Notes:</span><span class="info-val">${order.notes}</span></div>` : ""}
            </div>
          </div>

          <!-- RIGHT: Items Table -->
          <div class="right">
            <div class="section-title">🛍️ Order Items</div>
            <table>
              <thead>
                <tr>
                  <th style="width:52px;">IMG</th>
                  <th>Product</th>
                  <th style="text-align:center;">Size</th>
                  <th style="text-align:center;">Qty</th>
                  <th style="text-align:right;">Price</th>
                  <th style="text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="total-area">
              <div class="total-box">
                <div class="total-row"><span>Subtotal:</span><span>${subtotal} EGP</span></div>
                <div class="total-row"><span>Shipping:</span><span style="color:${shipping === 0 ? "#22c55e" : "#666"};">${shipping === 0 ? "FREE 🎉" : shipping + " EGP"}</span></div>
                <div class="total-final"><span>Total:</span><span>${order.total_amount} EGP</span></div>
              </div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 400); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusColor = (s: string) => s === "pending" ? "#f59e0b" : s === "completed" || s === "delivered" ? "#22c55e" : s === "cancelled" ? "#ef4444" : "#6b7280";
  const fmt = (n: number) => (n || 0).toLocaleString();

  const filteredOrders = orders.filter(o => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.includes(q) ||
      o.phone2?.includes(q) ||
      o.id.slice(-6).toLowerCase().includes(q) ||
      (o.city || "").toLowerCase().includes(q) ||
      (o.governorate || "").toLowerCase().includes(q) ||
      (o.shipping_address || o.address || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <style jsx global>{`
        .orders-table { display: block; }
        .orders-cards { display: none; }
        @media (max-width: 768px) {
          .orders-table { display: none !important; }
          .orders-cards { display: flex !important; flex-direction: column; gap: 12px; }
          .orders-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .orders-header-btns { width: 100%; display: flex; gap: 8px; flex-wrap: wrap; }
          .orders-header-btns button { flex: 1; font-size: 12px !important; padding: 10px 8px !important; }
        }
      `}</style>

      <div>

          {/* Header */}
          <div className="orders-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 10 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e", direction: "rtl" }}>📦 الطلبات</h1>
            </div>
            <div className="orders-header-btns" style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowShipperReport(v => !v)} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: showShipperReport ? "#1a1a2e" : "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>👥 تقرير المندوبين</button>
              <button onClick={() => setShowFreeReport(true)} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#D4AF37,#b8941e)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>📊 تقرير الشحن</button>
              <button onClick={fetchOrders} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>🔄 تحديث</button>
            </div>
          </div>

          {/* Shipper Report */}
          {showShipperReport && (() => {
            const shippers = ["علاء", "سامح", "شخص آخر"];
            const unassigned = orders.filter(o => !o.shipped_by && o.status !== "cancelled");
            const stats = shippers.map(name => {
              const s = orders.filter(o => o.shipped_by === name);
              return {
                name,
                total: s.length,
                revenue: s.reduce((sum, o) => sum + (o.total_amount || 0), 0),
                delivered: s.filter(o => o.status === "delivered" || o.status === "completed").length,
                pending: s.filter(o => o.status === "pending" || o.status === "processing" || o.status === "shipped").length,
              };
            });
            return (
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", direction: "rtl" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>👥 تقرير المندوبين</h2>
                  <span style={{ fontSize: 13, color: "#888" }}>إجمالي الطلبات: {orders.length} | غير محدد: {unassigned.length}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
                  {stats.map(s => (
                    <div key={s.name} style={{ background: s.total > 0 ? "#f5f9ee" : "#f9f9f9", borderRadius: 14, padding: "18px 20px", border: `2px solid ${s.total > 0 ? "#c8d9b0" : "#eee"}` }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>👤 {s.name}</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: "#4B6741", marginBottom: 4 }}>{s.total} طلب</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#666", marginBottom: 8 }}>{s.revenue.toLocaleString()} ج.م</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>✅ {s.delivered} تسليم</span>
                        <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>⏳ {s.pending} معلق</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ background: "#fff8f0", borderRadius: 14, padding: "18px 20px", border: "2px solid #fed7aa" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>⚠️ غير محدد</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#ea580c", marginBottom: 4 }}>{unassigned.length} طلب</div>
                    <div style={{ fontSize: 13, color: "#888" }}>لم يُحدد المندوب بعد</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Free Shipping Report Modal */}
          {showFreeReport && (() => {
            const freeOrders = orders.filter(o => (o.shipping_cost ?? -1) === 0 && ["completed", "delivered"].includes((o.status || "").toLowerCase()));
            const govMap: Record<string, { count: number; saved: number }> = {};
            const cityMap: Record<string, { count: number; saved: number; gov: string }> = {};
            let totalSaved = 0;
            freeOrders.forEach(o => {
              const rate = getShippingRate(shippingRates, o.governorate, o.city);
              totalSaved += rate;
              const gov = o.governorate || "غير محدد";
              const city = o.city || "غير محدد";
              if (!govMap[gov]) govMap[gov] = { count: 0, saved: 0 };
              govMap[gov].count++; govMap[gov].saved += rate;
              const ck = `${city}||${gov}`;
              if (!cityMap[ck]) cityMap[ck] = { count: 0, saved: 0, gov };
              cityMap[ck].count++; cityMap[ck].saved += rate;
            });
            const govRows = Object.entries(govMap).sort((a, b) => b[1].saved - a[1].saved);
            const cityRows = Object.entries(cityMap).sort((a, b) => b[1].saved - a[1].saved);
            return (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowFreeReport(false)}>
                <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 800, maxHeight: "90vh", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>📊 تقرير الشحن المجاني</h2>
                    <button onClick={() => setShowFreeReport(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa" }}>×</button>
                  </div>

                  {/* Summary cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                    {[
                      { label: "أوردرات شحن مجاني", value: freeOrders.length, color: "#4B6741" },
                      { label: "إجمالي الشحن المتنازل عنه", value: `${totalSaved.toLocaleString()} EGP`, color: "#D4AF37" },
                      { label: "متوسط قيمة الشحن المجاني", value: freeOrders.length ? `${Math.round(totalSaved / freeOrders.length)} EGP` : "—", color: "#1e40af" },
                    ].map(s => (
                      <div key={s.label} style={{ background: "#f5f9ee", borderRadius: 12, padding: "14px 16px", textAlign: "center", border: "1.5px solid #e0ebd6" }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#888", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>{s.label}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {freeOrders.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#aaa", padding: 30, fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>لا يوجد أوردرات بشحن مجاني حتى الآن</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                      {/* Per governorate */}
                      <div>
                        <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#2d4a28", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>📍 حسب المحافظة</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {govRows.map(([gov, data]) => (
                            <div key={gov} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                              <div>
                                <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>{gov}</span>
                                <span style={{ fontSize: 11, color: "#888", marginRight: 6 }}>({data.count} أوردر)</span>
                              </div>
                              <span style={{ fontWeight: 800, color: "#D4AF37", fontSize: 14 }}>{data.saved.toLocaleString()} EGP</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Per city */}
                      <div>
                        <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#2d4a28", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>🏙️ حسب المدينة</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
                          {cityRows.map(([ck, data]) => {
                            const city = ck.split("||")[0];
                            return (
                              <div key={ck} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                                <div>
                                  <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>{city}</span>
                                  <span style={{ fontSize: 11, color: "#aaa", marginRight: 4 }}>{data.gov}</span>
                                  <span style={{ fontSize: 11, color: "#888", marginRight: 4 }}>({data.count})</span>
                                </div>
                                <span style={{ fontWeight: 800, color: "#4B6741", fontSize: 14 }}>{data.saved.toLocaleString()} EGP</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Orders list */}
                  {freeOrders.length > 0 && (
                    <div>
                      <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#2d4a28", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>📋 تفاصيل الأوردرات ({freeOrders.length})</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {freeOrders.map(o => {
                          const rate = getShippingRate(shippingRates, o.governorate, o.city);
                          return (
                            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700, color: "#4B6741", fontSize: 13 }}>#{o.id.slice(-6)}</span>
                              <span style={{ fontSize: 13, color: "#333", flex: 1 }}>{o.customer_name}</span>
                              <span style={{ fontSize: 12, color: "#888" }}>{o.city}{o.governorate ? ` / ${o.governorate}` : ""}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#D4AF37" }}>وفّر: {rate > 0 ? `${rate} EGP` : "—"}</span>
                              <span style={{ fontSize: 12, color: "#888" }}>{new Date(o.created_at).toLocaleDateString("ar-EG")}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {error && <div style={{ background: "#ef444418", border: "1px solid #ef4444", borderRadius: 12, padding: 16, marginBottom: 24, color: "#ef4444", fontWeight: 600 }}>⚠️ {error}</div>}

          {/* Search & Filter */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="🔍 ابحث بالاسم، التليفون، رقم الأوردر، المدينة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 240, padding: "12px 16px", borderRadius: 12, border: "1.5px solid #ddd", fontSize: 14, outline: "none", fontFamily: "inherit" }}
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: "12px 16px", borderRadius: 12, border: "1.5px solid #ddd", fontSize: 14, fontWeight: 600, background: "#fff", color: "#333", cursor: "pointer", outline: "none" }}>
              <option value="all">كل الأوردرات ({orders.length})</option>
              <option value="pending">⏳ Pending</option>
              <option value="processing">🔄 Processing</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#1a1a2e", borderRadius: 12, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ color: "#E8EDD0", fontWeight: 700, fontSize: 14 }}>✅ {selectedIds.size} أوردر محدد</span>
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "#fff", cursor: "pointer", outline: "none" }}>
                <option value="">— غيّر الحالة —</option>
                <option value="pending">⏳ Pending</option>
                <option value="processing">🔄 Processing</option>
                <option value="completed">✅ Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
              <button onClick={applyBulkStatus} disabled={!bulkStatus}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: bulkStatus ? "#22c55e" : "#555", color: "#fff", fontWeight: 700, fontSize: 13, cursor: bulkStatus ? "pointer" : "not-allowed" }}>
                تطبيق
              </button>
              <button onClick={shareSelected}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                📤 مشاركة الكل
              </button>
              <button onClick={() => setSelectedIds(new Set())}
                style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", marginRight: "auto" }}>
                إلغاء
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#888" }}>Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, color: "#888" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <p>{search || statusFilter !== "all" ? "مفيش نتائج للبحث ده" : "No orders found"}</p>
            </div>
          ) : (
            <div className="orders-table" style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "10px 16px", background: "#f9fafb", borderBottom: "1px solid #eee", fontSize: 13, color: "#888" }}>
                عارض {filteredOrders.length} أوردر{orders.length !== filteredOrders.length ? ` من ${orders.length}` : ""}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                    <th style={{ padding: "14px 10px 14px 14px", width: 40 }}>
                      <input type="checkbox"
                        checked={filteredOrders.length > 0 && selectedIds.size === filteredOrders.length}
                        onChange={toggleSelectAll}
                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#4B6741" }} />
                    </th>
                    {["ORDER", "CUSTOMER", "PHONE", "ADDRESS", "CITY", "ITEMS", "TOTAL", "STATUS", "مندوب", "ACTIONS"].map(h => (
                      <th key={h} style={{ padding: 14, textAlign: "left", fontSize: 12, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id} style={{ borderBottom: "1px solid #f5f5f5", cursor: "pointer", background: selectedIds.has(order.id) ? "#f0f7eb" : "transparent" }}
                      onMouseEnter={e => { if (!selectedIds.has(order.id)) (e.currentTarget as HTMLTableRowElement).style.background = "#f5f9ee"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = selectedIds.has(order.id) ? "#f0f7eb" : "transparent"; }}>
                      <td style={{ padding: "14px 10px 14px 14px" }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#4B6741" }} />
                      </td>
                      <td style={{ padding: 14, fontSize: 14, fontWeight: 700, color: "#4B6741" }} onClick={() => openOrder(order)}>
                        #{order.id.slice(-6)}
                      </td>
                      <td style={{ padding: 14, fontSize: 14 }} onClick={() => openOrder(order)}>{order.customer_name}</td>
                      <td style={{ padding: 14, fontSize: 13 }} onClick={() => openOrder(order)}>
                        <div>📞 {order.customer_phone}</div>
                        {order.phone2 && <div style={{ color: "#25d366", fontSize: 12, marginTop: 2 }}>💬 {order.phone2}</div>}
                      </td>
                      <td style={{ padding: 14, fontSize: 13, maxWidth: 180 }} onClick={() => openOrder(order)}>{order.shipping_address || order.address || "-"}</td>
                      <td style={{ padding: 14, fontSize: 13 }} onClick={() => openOrder(order)}>{order.city || "-"}</td>
                      {/* Items thumbnails */}
                      <td style={{ padding: 8 }} onClick={() => openOrder(order)}>
                        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 130 }}>
                          {order.items?.slice(0, 4).map((item, i) => (
                            <div key={i} style={{ position: "relative" }}>
                              <div style={{ width: 38, height: 38, borderRadius: 8, overflow: "hidden", background: "#f5f9ee", border: "1px solid #eee" }}>
                                <img src={productImages[item.product_id] || `https://placehold.co/38x38/E8EDD0/4B6741?text=${encodeURIComponent((item.product_name || "?").slice(0, 2))}`}
                                  alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/38x38/E8EDD0/4B6741?text=💍`; }} />
                              </div>
                              {item.quantity > 1 && <span style={{ position: "absolute", top: -4, right: -4, background: "#1a1a2e", color: "#fff", borderRadius: "50%", width: 15, height: 15, fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.quantity}</span>}
                            </div>
                          ))}
                          {(order.items?.length || 0) > 4 && <div style={{ width: 38, height: 38, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#888", fontWeight: 700 }}>+{(order.items?.length || 0) - 4}</div>}
                        </div>
                      </td>
                      <td style={{ padding: 14, fontSize: 14, fontWeight: 700 }} onClick={() => openOrder(order)}>{fmt(order.total_amount)} EGP</td>
                      <td style={{ padding: 14 }}>
                        <select value={order.status} onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                          onClick={e => e.stopPropagation()}
                          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12, background: "#fff", color: getStatusColor(order.status), fontWeight: 700, cursor: "pointer" }}>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: "8px 10px" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 90 }}>
                          {["علاء", "سامح", "شخص آخر"].map(p => (
                            <button key={p} onClick={e => { e.stopPropagation(); updateShippedBy(order.id, order.shipped_by === p ? "" : p); }}
                              style={{ padding: "5px 8px", borderRadius: 6, border: `1.5px solid ${order.shipped_by === p ? "#4B6741" : "#ddd"}`, background: order.shipped_by === p ? "#4B6741" : "#fff", color: order.shipped_by === p ? "#fff" : "#555", fontSize: 11, fontWeight: order.shipped_by === p ? 700 : 400, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                              {p}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: 14, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button onClick={e => { e.stopPropagation(); openOrder(order); }}
                            style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "#1a1a2e", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            👁️ View
                          </button>
                          <button onClick={e => { e.stopPropagation(); openOrder(order).then(() => handlePrint(order)); }}
                            style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            🖨️ Print
                          </button>
                          <button onClick={e => { e.stopPropagation(); shareOrder(order); }}
                            style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            📤 Share
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Cards View */}
          {!loading && filteredOrders.length > 0 && (
            <div className="orders-cards">
              {filteredOrders.map(order => (
                <div key={order.id} style={{ background: selectedIds.has(order.id) ? "#f0f7eb" : "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", border: `1.5px solid ${selectedIds.has(order.id) ? "#4B6741" : "#e5e7eb"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#4B6741" }} />
                      <span style={{ fontWeight: 800, color: "#4B6741", fontSize: 16 }}>#{order.id.slice(-6)}</span>
                    </div>
                    <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                      style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, fontWeight: 700, color: getStatusColor(order.status), background: "#fff", cursor: "pointer" }}>
                      <option value="pending">⏳ Pending</option>
                      <option value="processing">🔄 Processing</option>
                      <option value="completed">✅ Completed</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>{order.customer_name}</div>
                  <div style={{ fontSize: 13, color: "#555", marginBottom: 2 }}>📞 {order.customer_phone}{order.phone2 ? ` · 💬 ${order.phone2}` : ""}</div>
                  <div style={{ fontSize: 13, color: "#777", marginBottom: 6 }}>📍 {order.city || ""}{order.governorate ? ` / ${order.governorate}` : ""}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#888" }}>{new Date(order.created_at).toLocaleDateString("ar-EG")}</span>
                    <span style={{ fontWeight: 800, color: "#4B6741", fontSize: 17 }}>{fmt(order.total_amount)} EGP</span>
                  </div>
                  {order.shipped_by && (
                    <div style={{ fontSize: 12, color: "#4B6741", fontWeight: 700, marginBottom: 6, background: "#f0f5eb", borderRadius: 8, padding: "4px 10px", display: "inline-block" }}>
                      🚚 {order.shipped_by}
                    </div>
                  )}
                  {/* Shipped By quick buttons */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    {["علاء", "سامح", "شخص آخر"].map(p => (
                      <button key={p} onClick={e => { e.stopPropagation(); updateShippedBy(order.id, order.shipped_by === p ? "" : p); }}
                        style={{ padding: "5px 12px", borderRadius: 16, border: "1.5px solid", borderColor: order.shipped_by === p ? "#4B6741" : "#ddd", background: order.shipped_by === p ? "#4B6741" : "#f9f9f9", color: order.shipped_by === p ? "#fff" : "#666", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Cairo, sans-serif" }}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <button onClick={() => openOrder(order)}
                      style={{ padding: "10px 0", borderRadius: 10, border: "none", background: "#1a1a2e", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      👁️ تفاصيل
                    </button>
                    <button onClick={() => openOrder(order).then(() => handlePrint(order))}
                      style={{ padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      🖨️ طباعة
                    </button>
                    <button onClick={() => shareOrder(order)}
                      style={{ padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      📤 مشاركة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* ✅ Order Detail Modal */}
      {selectedOrder && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSelectedOrder(null)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ padding: "20px 28px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a2e", borderRadius: "20px 20px 0 0" }}>
              <div>
                <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 800 }}>Order #{selectedOrder.id.slice(-6)}</h2>
                <p style={{ margin: "4px 0 0", color: "#4B6741", fontSize: 13 }}>{new Date(selectedOrder.created_at).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, background: selectedOrder.status === "completed" ? "#dcfce7" : selectedOrder.status === "cancelled" ? "#fee2e2" : "#fef3c7", color: getStatusColor(selectedOrder.status) }}>
                  {selectedOrder.status}
                </span>
                <button onClick={() => handlePrint(selectedOrder)}
                  style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  🖨️ Print
                </button>
                <button onClick={() => setSelectedOrder(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>
            </div>

            <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

              {/* Customer Info */}
              <div style={{ background: "#fafafa", borderRadius: 14, padding: 20 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#4B6741", textTransform: "uppercase", letterSpacing: 1 }}>📦 Customer</h3>
                {[
                  ["Name", selectedOrder.customer_name],
                  ["Phone", `📞 ${selectedOrder.customer_phone}`],
                  selectedOrder.phone2 ? ["WhatsApp", `💬 ${selectedOrder.phone2}`] : null,
                  ["Address", selectedOrder.shipping_address || selectedOrder.address || "-"],
                  ["City", selectedOrder.city || "-"],
                  selectedOrder.governorate ? ["Governorate", selectedOrder.governorate] : null,
                  selectedOrder.notes ? ["Notes", selectedOrder.notes] : null,
                ].filter((x): x is string[] => Boolean(x)).map(([label, val], i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #eee" }}>
                    <span style={{ color: "#888", fontSize: 13, minWidth: 90 }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, color: label === "WhatsApp" ? "#25d366" : "#1a1a2e" }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div style={{ background: "#fafafa", borderRadius: 14, padding: 20 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#4B6741", textTransform: "uppercase", letterSpacing: 1 }}>💰 Summary</h3>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <span style={{ color: "#888", fontSize: 13 }}>Subtotal</span>
                  <span style={{ fontWeight: 600 }}>{fmt((selectedOrder.total_amount || 0) - (selectedOrder.shipping_cost || 0))} EGP</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <span style={{ color: "#888", fontSize: 13 }}>Shipping</span>
                  <span style={{ fontWeight: 600, color: (selectedOrder.shipping_cost || 0) === 0 ? "#22c55e" : "#333" }}>
                    {(selectedOrder.shipping_cost || 0) === 0 ? "FREE 🎉" : `${selectedOrder.shipping_cost} EGP`}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", marginTop: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: 20, color: "#4B6741" }}>{fmt(selectedOrder.total_amount)} EGP</span>
                </div>

                {/* Status Change */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #eee" }}>
                  <label style={{ fontSize: 12, color: "#888", fontWeight: 700, display: "block", marginBottom: 8 }}>تغيير الحالة</label>
                  <select value={selectedOrder.status} onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #c8d9b0", fontSize: 14, fontWeight: 700, color: getStatusColor(selectedOrder.status), cursor: "pointer", background: "#fff", outline: "none" }}>
                    <option value="pending">⏳ معلق</option>
                    <option value="processing">🔄 جاري التجهيز</option>
                    <option value="shipped">🚚 تم الشحن</option>
                    <option value="delivered">✅ تم التسليم</option>
                    <option value="cancelled">❌ ملغي</option>
                  </select>
                </div>

                {/* Shipped By */}
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 12, color: "#888", fontWeight: 700, display: "block", marginBottom: 8 }}>تم الشحن بواسطة</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["علاء", "سامح", "شخص آخر", ""].map(person => (
                      <button key={person} onClick={() => updateShippedBy(selectedOrder.id, person)}
                        style={{
                          padding: "8px 18px", borderRadius: 20, border: "2px solid",
                          borderColor: selectedOrder.shipped_by === person && person !== "" ? "#4B6741" : "#ddd",
                          background: selectedOrder.shipped_by === person && person !== "" ? "#4B6741" : "#fff",
                          color: selectedOrder.shipped_by === person && person !== "" ? "#fff" : "#555",
                          fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Cairo, sans-serif",
                        }}>
                        {person === "" ? "🗑️ إلغاء" : person === "علاء" ? "👤 علاء" : person === "سام" ? "👤 سام" : "👤 شخص آخر"}
                      </button>
                    ))}
                  </div>
                  {selectedOrder.shipped_by && (
                    <div style={{ marginTop: 8, fontSize: 13, color: "#4B6741", fontWeight: 600, fontFamily: "Cairo, sans-serif" }}>
                      ✅ تم الشحن بواسطة: <strong>{selectedOrder.shipped_by}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items */}
            <div style={{ padding: "0 28px 28px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#4B6741", textTransform: "uppercase", letterSpacing: 1 }}>🛍️ Items ({selectedOrder.items?.length || 0})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedOrder.items?.map((item, i) => {
                  const img = productImages[item.product_id];
                  return (
                    <div key={i} style={{ display: "flex", gap: 14, padding: 14, background: "#fafafa", borderRadius: 12, alignItems: "center" }}>
                      <div style={{ width: 70, height: 70, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#f5f9ee", border: "1px solid #eee" }}>
                        <img src={img || `https://placehold.co/70x70/E8EDD0/4B6741?text=💍`} alt={item.product_name || ""}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/70x70/E8EDD0/4B6741?text=💍"; }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{item.product_name || "Product"}</div>
                        {item.size && <div style={{ fontSize: 13, color: "#888", marginTop: 3 }}>Size: {item.size}</div>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, color: "#888" }}>x{item.quantity}</div>
                        <div style={{ fontWeight: 700, color: "#4B6741", fontSize: 15 }}>{item.price} EGP</div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>{item.total || item.price * item.quantity} EGP total</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

