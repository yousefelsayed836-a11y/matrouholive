"use client";
import { useState, useEffect } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const G = "#4B6741"; const GD = "linear-gradient(135deg,#4B6741,#3a5232)";

const fmt = (n: number) => Number(n || 0).toLocaleString("ar-EG", { minimumFractionDigits: 0 });
const fmtEGP = (n: number) => fmt(n) + " ج.م";

const STATUS_AR: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "معلق",        color: "#92400e", bg: "#fef3c7" },
  processing: { label: "جاري التجهيز", color: "#1e40af", bg: "#dbeafe" },
  shipped:    { label: "تم الشحن",    color: "#7c3aed", bg: "#ede9fe" },
  delivered:  { label: "تم التسليم",  color: "#166534", bg: "#dcfce7" },
  cancelled:  { label: "ملغي",        color: "#991b1b", bg: "#fee2e2" },
};

function Card({ label, value, sub, color = G }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", direction: "rtl" }}>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Bar({ label, value, max, color = G, suffix = "" }: { label: string; value: number; max: number; color?: string; suffix?: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 2;
  return (
    <div style={{ marginBottom: 12, direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: "#374151", fontWeight: 600, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{fmt(value)}{suffix}</span>
      </div>
      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [pairs, setPairs] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [geo, setGeo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<"products"|"together"|"geo"|"funnel">("products");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/analytics/overview`).then(r => r.json()),
      fetch(`${API}/analytics/products`).then(r => r.json()),
      fetch(`${API}/analytics/bought-together`).then(r => r.json()),
      fetch(`${API}/analytics/timeline?days=${days}`).then(r => r.json()),
      fetch(`${API}/analytics/funnel`).then(r => r.json()),
      fetch(`${API}/analytics/geography`).then(r => r.json()),
    ]).then(([ov, pr, bt, tl, fn, gv]) => {
      setOverview(ov);
      setProducts(Array.isArray(pr) ? pr : []);
      setPairs(Array.isArray(bt) ? bt : []);
      setTimeline(Array.isArray(tl) ? tl : []);
      setFunnel(fn);
      setGeo(Array.isArray(gv) ? gv : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [days]);

  const maxRevenue = Math.max(...timeline.map(t => Number(t.revenue)), 1);
  const maxProd = products.length > 0 ? Number(products[0]?.total_sold || 1) : 1;
  const maxGeo = geo.length > 0 ? Number(geo[0]?.orders || 1) : 1;

  const conversionRate = overview?.all?.total_orders > 0
    ? Math.round((Number(overview?.statusDist?.find((s: any) => s.status === "delivered")?.count || 0) / Number(overview.all.total_orders)) * 100)
    : 0;

  return (
    <div style={{ direction: "rtl" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>📊 الإحصائيات والتحليلات</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>نظرة شاملة على أداء المتجر</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, background: "#fff", cursor: "pointer" }}>
          <option value={7}>آخر 7 أيام</option>
          <option value={30}>آخر 30 يوم</option>
          <option value={90}>آخر 90 يوم</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: "#888" }}>جاري تحميل الإحصائيات...</div>
      ) : (
        <>
          {/* Overview Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <Card label="إجمالي الإيراد" value={fmtEGP(overview?.all?.total_revenue)} sub="كل الطلبات المكتملة" color={G} />
            <Card label="إجمالي الطلبات" value={fmt(overview?.all?.total_orders)} sub={`${overview?.monthly?.orders || 0} طلب آخر 30 يوم`} color="#1d4ed8" />
            <Card label="العملاء الفريدون" value={fmt(overview?.all?.unique_customers)} color="#7c3aed" />
            <Card label="متوسط قيمة الطلب" value={fmtEGP(overview?.all?.avg_order_value)} color="#b45309" />
            <Card label="آخر 30 يوم" value={fmtEGP(overview?.monthly?.revenue)} sub={`${overview?.monthly?.orders || 0} طلب`} color={G} />
            <Card label="آخر 7 أيام" value={fmtEGP(overview?.weekly?.revenue)} sub={`${overview?.weekly?.orders || 0} طلب`} color="#0891b2" />
            <Card label="اليوم" value={fmtEGP(overview?.today?.revenue)} sub={`${overview?.today?.orders || 0} طلب`} color="#059669" />
            <Card label="معدل التسليم" value={`${conversionRate}%`} sub="طلبات تم تسليمها" color={conversionRate > 60 ? "#059669" : "#dc2626"} />
          </div>

          {/* Order Status Distribution */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>توزيع حالات الطلبات</h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {(overview?.statusDist || []).map((s: any) => {
                const info = STATUS_AR[s.status] || { label: s.status, color: "#6b7280", bg: "#f3f4f6" };
                const pct = overview?.all?.total_orders > 0 ? Math.round(s.count / overview.all.total_orders * 100) : 0;
                return (
                  <div key={s.status} style={{ flex: "1 1 140px", background: info.bg, borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: info.color }}>{fmt(s.count)}</div>
                    <div style={{ fontSize: 12, color: info.color, fontWeight: 600, marginTop: 2 }}>{info.label}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{pct}% · {fmtEGP(s.revenue)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Timeline */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>الإيراد اليومي ({days} يوم)</h2>
            {timeline.length === 0 ? (
              <div style={{ textAlign: "center", color: "#888", padding: 40 }}>لا توجد بيانات</div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120, overflowX: "auto", paddingBottom: 8 }}>
                {timeline.map((t, i) => {
                  const h = Math.max(4, (Number(t.revenue) / maxRevenue) * 100);
                  return (
                    <div key={i} style={{ flex: "1 0 8px", minWidth: 8, maxWidth: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div title={`${t.date}: ${fmtEGP(t.revenue)}\n${t.orders} طلب`}
                        style={{ width: "100%", height: `${h}%`, background: GD, borderRadius: "3px 3px 0 0", cursor: "pointer", transition: "opacity 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "1")} />
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#aaa" }}>
              <span>{timeline[0]?.date || ""}</span>
              <span>{timeline[timeline.length - 1]?.date || ""}</span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {([
              ["products", "🛍️ المنتجات"],
              ["together", "🤝 اشتريا معاً"],
              ["geo", "📍 المناطق"],
              ["funnel", "🔻 مسار العميل"],
            ] as const).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                  background: tab === t ? GD : "#f3f4f6", color: tab === t ? "#fff" : "#555" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Products Tab */}
          {tab === "products" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>أداء المنتجات</h2>
              {products.length === 0 ? (
                <div style={{ textAlign: "center", color: "#888", padding: 40 }}>لا توجد بيانات مبيعات بعد</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                        {["#", "المنتج", "الكمية المباعة", "الإيراد", "عدد الطلبات", "متوسط السعر"].map(h => (
                          <th key={h} style={{ padding: "12px 14px", textAlign: "right", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, i) => (
                        <tr key={p.product_id} style={{ borderBottom: "1px solid #f5f5f5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "12px 14px", color: "#aaa", fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: "12px 14px", fontWeight: 600, maxWidth: 220 }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.product_name || "—"}</div>
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <span style={{ background: "#f0f5eb", color: G, padding: "4px 12px", borderRadius: 20, fontWeight: 800 }}>{fmt(p.total_sold)}</span>
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: G }}>{fmtEGP(p.total_revenue)}</td>
                          <td style={{ padding: "12px 14px", textAlign: "center", color: "#555" }}>{fmt(p.order_count)}</td>
                          <td style={{ padding: "12px 14px", color: "#888" }}>{fmtEGP(p.avg_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 12 }}>أكثر المنتجات مبيعاً</h3>
                    {products.slice(0, 10).map(p => (
                      <Bar key={p.product_id} label={p.product_name || "—"} value={Number(p.total_sold)} max={maxProd} suffix=" قطعة" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bought Together Tab */}
          {tab === "together" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>المنتجات التي تُشترى معاً</h2>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>أزواج المنتجات التي ظهرت في نفس الطلب</p>
              {pairs.length === 0 ? (
                <div style={{ textAlign: "center", color: "#888", padding: 40 }}>لا توجد بيانات — يحتاج لعدة طلبات متعددة المنتجات</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {pairs.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: i % 2 === 0 ? "#f9fafb" : "#fff", borderRadius: 10, border: "1px solid #f3f4f6" }}>
                      <div style={{ background: "#fef3c7", color: "#92400e", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                        {p.times_together}×
                      </div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 13 }}>{p.product1}</span>
                        <span style={{ color: G, fontSize: 16 }}>+</span>
                        <span style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 13 }}>{p.product2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Geography Tab */}
          {tab === "geo" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>توزيع الطلبات الجغرافي</h2>
              {geo.length === 0 ? (
                <div style={{ textAlign: "center", color: "#888", padding: 40 }}>لا توجد بيانات</div>
              ) : (
                <>
                  {geo.map((g, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: "#374151" }}>{g.region}</span>
                        <span style={{ color: "#888" }}>{fmt(g.orders)} طلب · {fmtEGP(g.revenue)}</span>
                      </div>
                      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4 }}>
                        <div style={{ height: "100%", width: `${Math.max(2, (Number(g.orders) / maxGeo) * 100)}%`, background: GD, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Funnel Tab */}
          {tab === "funnel" && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>مسار العميل (آخر 30 يوم)</h2>
              <p style={{ margin: "0 0 24px", fontSize: 13, color: "#888" }}>
                يتتبع مسار العميل من مشاهدة المنتج حتى إتمام الطلب — يحتاج بضعة أيام لتجمع بيانات
              </p>
              {funnel && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(funnel.funnel || []).map((step: any, i: number) => {
                      const firstCount = funnel.funnel[0]?.count || 1;
                      const pct = firstCount > 0 ? Math.round((step.count / firstCount) * 100) : 0;
                      const dropPct = i > 0 && funnel.funnel[i-1]?.count > 0
                        ? Math.round((1 - step.count / funnel.funnel[i-1].count) * 100)
                        : 0;
                      const colors = [G, "#1d4ed8", "#7c3aed", "#059669"];
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                            <span style={{ fontWeight: 700, color: "#1a1a2e" }}>
                              {i + 1}. {step.step}
                            </span>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              {i > 0 && step.count < funnel.funnel[i-1]?.count && (
                                <span style={{ fontSize: 12, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
                                  ↓ {dropPct}% تركوا
                                </span>
                              )}
                              <span style={{ fontWeight: 800, color: colors[i] }}>{fmt(step.count)}</span>
                            </div>
                          </div>
                          <div style={{ height: 20, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              width: `${Math.max(pct, step.count > 0 ? 2 : 0)}%`,
                              background: colors[i],
                              borderRadius: 6,
                              display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8,
                              fontSize: 11, color: "#fff", fontWeight: 700,
                              transition: "width 0.8s ease"
                            }}>
                              {step.count > 0 ? `${pct}%` : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {funnel.topViewed?.length > 0 && (
                    <div style={{ marginTop: 32 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 12 }}>أكثر المنتجات مشاهدةً</h3>
                      {funnel.topViewed.map((v: any, i: number) => (
                        <Bar key={i} label={v.product_name} value={Number(v.views)} max={Number(funnel.topViewed[0]?.views || 1)} suffix=" مشاهدة" />
                      ))}
                    </div>
                  )}

                  {funnel.funnel?.[0]?.count === 0 && (
                    <div style={{ marginTop: 20, background: "#fef3c7", borderRadius: 12, padding: 16, fontSize: 13, color: "#92400e", textAlign: "center" }}>
                      ⚠️ لا توجد بيانات تتبع بعد — سيبدأ جمع البيانات تلقائياً من زيارات الموقع
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
