"use client";

import { useState } from "react";

interface OrderItem {
  product_id: string;
  product_name?: string;
  quantity: number;
  price: number;
  total?: number;
}

interface Order {
  id: string;
  status: string;
  shipped_by?: string;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const REPS = ["علاء", "سامح", "شخص آخر"];

const todayStr = () => new Date().toISOString().split("T")[0];
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; };
const firstOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; };

export default function SalesReportPage() {
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayStr);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [scope, setScope] = useState<"all" | "delivered">("all");
  const [search, setSearch] = useState("");

  const fetchReport = async (f: string, t: string) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/orders?date_from=${f}&date_to=${t}`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!res.ok) throw new Error(`خطأ ${res.status}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.orders || []);
      setLoaded(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "فشل تحميل التقرير");
    }
    setLoading(false);
  };

  /* الطلبات اللي بتتحسب كمبيعات حسب النطاق المختار */
  const inScope = (o: Order) => scope === "delivered"
    ? (o.status === "delivered" || o.status === "completed")
    : o.status !== "cancelled";

  /* تجميع المنتجات: اسم المنتج → الكمية + قيمتها */
  const productsOf = (list: Order[]) => {
    const m = new Map<string, { qty: number; revenue: number }>();
    list.filter(inScope).forEach(o => (o.items || []).forEach(i => {
      const key = (i.product_name || "").trim() || "منتج غير معروف";
      const prev = m.get(key) || { qty: 0, revenue: 0 };
      prev.qty += i.quantity || 0;
      prev.revenue += i.total ?? (i.price || 0) * (i.quantity || 0);
      m.set(key, prev);
    }));
    return m;
  };

  const unassigned = orders.filter(o => !o.shipped_by && o.status !== "cancelled");

  const columns = [
    ...REPS.map(name => ({ name, products: productsOf(orders.filter(o => o.shipped_by === name)) })),
    ...(unassigned.length > 0 ? [{ name: "غير محدد", products: productsOf(unassigned) }] : []),
  ].filter(c => c.products.size > 0);

  const productTotals = new Map<string, { qty: number; revenue: number }>();
  columns.forEach(c => c.products.forEach((v, k) => {
    const prev = productTotals.get(k) || { qty: 0, revenue: 0 };
    productTotals.set(k, { qty: prev.qty + v.qty, revenue: prev.revenue + v.revenue });
  }));

  const rows = [...productTotals.entries()]
    .filter(([name]) => !search.trim() || name.includes(search.trim()))
    .sort((a, b) => b[1].qty - a[1].qty);

  const grandUnits = rows.reduce((s, [, v]) => s + v.qty, 0);
  const grandRevenue = rows.reduce((s, [, v]) => s + v.revenue, 0);
  const fmt = (n: number) => Math.round(n).toLocaleString();

  /* تصدير الجدول كملف CSV يفتح في إكسل */
  const exportCsv = () => {
    const head = ["المنتج", ...columns.map(c => c.name), "إجمالي الكمية", "إجمالي القيمة"];
    const body = rows.map(([name, v]) => [
      `"${name.replace(/"/g, '""')}"`,
      ...columns.map(c => c.products.get(name)?.qty || 0),
      v.qty,
      Math.round(v.revenue),
    ].join(","));
    const csv = "﻿" + [head.join(","), ...body].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير-المبيعات-${from}-الى-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const presets = [
    { label: "هذا الشهر", from: firstOfMonth(), to: todayStr() },
    { label: "الأسبوع", from: daysAgo(6), to: todayStr() },
    { label: "آخر 30 يوم", from: daysAgo(29), to: todayStr() },
    { label: "آخر 90 يوم", from: daysAgo(89), to: todayStr() },
  ];

  const btn = { padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" } as const;

  return (
    <div style={{ direction: "rtl" }}>
      <style>{`
        @media (max-width: 768px) {
          .sr-controls { flex-direction: column; align-items: stretch !important; }
          .sr-tiles { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>🛍️ تقرير مبيعات المنتجات</h1>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>
        كل منتج اتباع منه كام قطعة، ومين المندوب اللي باعه. المنتجات المحذوفة من الموقع بتفضل ظاهرة هنا بتاريخ مبيعاتها.
      </p>

      {/* الفلاتر */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 18, marginBottom: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="sr-controls" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, color: "#555", fontWeight: 700 }}>من</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1.5px solid #d1e7c8", fontSize: 13, fontFamily: "inherit" }} />
          <label style={{ fontSize: 13, color: "#555", fontWeight: 700 }}>إلى</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            style={{ padding: "7px 10px", borderRadius: 8, border: "1.5px solid #d1e7c8", fontSize: 13, fontFamily: "inherit" }} />

          <button onClick={() => fetchReport(from, to)} disabled={loading}
            style={{ ...btn, background: loading ? "#aaa" : "#4B6741", color: "#fff" }}>
            {loading ? "⏳ جاري التحميل..." : "🔍 عرض التقرير"}
          </button>

          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1.5px solid #4B6741" }}>
            {([{ key: "all", label: "كل الطلبات" }, { key: "delivered", label: "المُسلَّم فقط" }] as const).map(o => (
              <button key={o.key} onClick={() => setScope(o.key)}
                style={{ ...btn, borderRadius: 0, padding: "7px 14px", fontSize: 12,
                  background: scope === o.key ? "#4B6741" : "#f0faf0", color: scope === o.key ? "#fff" : "#4B6741" }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {presets.map(p => (
            <button key={p.label} onClick={() => { setFrom(p.from); setTo(p.to); fetchReport(p.from, p.to); }}
              style={{ ...btn, padding: "6px 12px", fontSize: 12, border: "1.5px solid #4B6741", background: "#f0faf0", color: "#4B6741" }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1.5px solid #ef4444", borderRadius: 12, padding: 14, marginBottom: 18, color: "#b91c1c", fontWeight: 700 }}>
          ⚠️ {error}
        </div>
      )}

      {!loaded && !loading && !error && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "60px 20px", textAlign: "center", color: "#aaa", fontSize: 14 }}>
          اختار الفترة الزمنية فوق واضغط «🔍 عرض التقرير»
        </div>
      )}

      {loaded && (
        <>
          {/* الملخص */}
          <div className="sr-tiles" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
            {[
              { label: "أنواع المنتجات", val: rows.length, bg: "#eef2ff", clr: "#3730a3" },
              { label: "إجمالي القطع المباعة", val: fmt(grandUnits), bg: "#f0faf0", clr: "#4B6741" },
              { label: "قيمة المبيعات", val: fmt(grandRevenue) + " ج.م", bg: "#fef9c3", clr: "#854d0e" },
              { label: "عدد الطلبات", val: orders.filter(inScope).length, bg: "#dcfce7", clr: "#166534" },
            ].map(t => (
              <div key={t.label} style={{ background: t.bg, borderRadius: 12, padding: "14px 18px" }}>
                <div style={{ fontSize: 11, color: t.clr, fontWeight: 700, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: t.clr }}>{t.val}</div>
              </div>
            ))}
          </div>

          {/* الجدول */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔎 دوّر على منتج..."
                style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 13, minWidth: 220, fontFamily: "inherit" }} />
              {rows.length > 0 && (
                <button onClick={exportCsv} style={{ ...btn, background: "#166534", color: "#fff" }}>
                  ⬇️ تحميل كملف Excel
                </button>
              )}
            </div>

            {rows.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa", fontSize: 14 }}>
                {search.trim() ? "مفيش منتج بالاسم ده" : "مفيش مبيعات في الفترة دي"}
              </div>
            ) : (
              <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480, fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f5f9ee" }}>
                      <th style={{ textAlign: "right", padding: "11px 12px", fontWeight: 800, color: "#1a1a2e", whiteSpace: "nowrap" }}>المنتج</th>
                      {columns.map(c => (
                        <th key={c.name} style={{ textAlign: "center", padding: "11px 12px", fontWeight: 800, color: "#4B6741", whiteSpace: "nowrap" }}>{c.name}</th>
                      ))}
                      <th style={{ textAlign: "center", padding: "11px 12px", fontWeight: 800, color: "#3730a3", whiteSpace: "nowrap" }}>إجمالي الكمية</th>
                      <th style={{ textAlign: "center", padding: "11px 12px", fontWeight: 800, color: "#854d0e", whiteSpace: "nowrap" }}>القيمة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(([name, v], idx) => (
                      <tr key={name} style={{ background: idx % 2 ? "#fafafa" : "#fff", borderTop: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "10px 12px", color: "#333" }}>{name}</td>
                        {columns.map(c => {
                          const qty = c.products.get(name)?.qty || 0;
                          return (
                            <td key={c.name} style={{ padding: "10px 12px", textAlign: "center", fontWeight: qty ? 800 : 400, color: qty ? "#4B6741" : "#ccc" }}>
                              {qty || "—"}
                            </td>
                          );
                        })}
                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 900, color: "#3730a3" }}>{v.qty}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#854d0e", whiteSpace: "nowrap" }}>{fmt(v.revenue)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "#f5f9ee", borderTop: "2px solid #c8d9b0" }}>
                      <td style={{ padding: "11px 12px", fontWeight: 800, color: "#1a1a2e" }}>الإجمالي</td>
                      {columns.map(c => (
                        <td key={c.name} style={{ padding: "11px 12px", textAlign: "center", fontWeight: 900, color: "#4B6741" }}>
                          {[...c.products.values()].reduce((s, p) => s + p.qty, 0)}
                        </td>
                      ))}
                      <td style={{ padding: "11px 12px", textAlign: "center", fontWeight: 900, color: "#3730a3" }}>{fmt(grandUnits)}</td>
                      <td style={{ padding: "11px 12px", textAlign: "center", fontWeight: 900, color: "#854d0e", whiteSpace: "nowrap" }}>{fmt(grandRevenue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
