"use client";

import { useState, useEffect } from "react";
import { uploadToGitHub } from "../../lib/uploadToGitHub";
import Link from "next/link";

interface Order {
  id: string;
  total_amount: number;
  shipping_cost?: number;
  status: string;
  created_at: string;
  customer_name?: string;
}

interface Product {
  id: string;
  name_en: string;
  price: number;
  stock: number;
  is_active: boolean;
  images?: string | string[];
}

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_BASE = API_ROOT + "/api";

function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const getAdminPw = () => (typeof window !== "undefined" ? localStorage.getItem("admin_pw") || "1122" : "1122");

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: "#fef3c7", color: "#92400e", label: "معلق" },
  processing: { bg: "#dbeafe", color: "#1e40af", label: "جاري" },
  completed:  { bg: "#dcfce7", color: "#166534", label: "مكتمل" },
  delivered:  { bg: "#dcfce7", color: "#166534", label: "تم التسليم" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b", label: "ملغي" },
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(() => {
    if (typeof window !== "undefined") return sessionStorage.getItem("admin_auth") === "1";
    return false;
  });
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [changePwForm, setChangePwForm] = useState({ current: "", next: "", confirm: "" });
  const [changePwMsg, setChangePwMsg] = useState("");
  const [newOrderToast, setNewOrderToast] = useState<{ name: string; total: number } | null>(null);
  // Hero slides
  interface HeroSlide { id: string; desktop: string; mobile?: string; show: "both" | "desktop" | "mobile"; }
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroMsg, setHeroMsg] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);

  // Site settings
  const [siteSettings, setSiteSettings] = useState({
    name: "مطروح أوليفي", whatsapp: "", address: "", announcement: "",
  });
  const [siteSettingsMsg, setSiteSettingsMsg] = useState("");

  const [faviconUrl, setFaviconUrl] = useState("");
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [faviconMsg, setFaviconMsg] = useState("");
  const [fbPixelId, setFbPixelId] = useState("");
  const [fbPixelMsg, setFbPixelMsg] = useState("");
  const [featuredTitle, setFeaturedTitle] = useState("منتجات مميزة");
  const [featuredEnabled, setFeaturedEnabled] = useState(false);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [featuredMsg, setFeaturedMsg] = useState("");
  const [featuredSearch, setFeaturedSearch] = useState("");
  const [ordersTab, setOrdersTab] = useState<"all" | "pending" | "completed">("all");
  const [emailTestMsg, setEmailTestMsg] = useState("");
  const [emailTestLoading, setEmailTestLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    fetch(`${API_BASE}/settings/favicon`).then(r => r.json()).then(d => { if (d.value) setFaviconUrl(d.value); }).catch(() => {});
    fetch(`${API_BASE}/settings/site_settings`).then(r => r.json()).then(d => {
      if (d.value) try { setSiteSettings(s => ({ ...s, ...JSON.parse(d.value) })); } catch {}
    }).catch(() => {});
    fetch(`${API_BASE}/settings/hero_slides`).then(r => r.json()).then(d => {
      if (d.value) try { setHeroSlides(JSON.parse(d.value)); } catch {}
    }).catch(() => {});
    fetch(`${API_BASE}/settings/fb_pixel_id`).then(r => r.json()).then(d => { if (d.value) setFbPixelId(d.value); }).catch(() => {});
    fetch(`${API_BASE}/settings/featured_section`).then(r => r.json()).then(d => {
      if (d.value) try {
        const p = JSON.parse(d.value);
        setFeaturedTitle(p.title || "منتجات مميزة");
        setFeaturedEnabled(p.enabled || false);
        setFeaturedIds(p.product_ids || []);
      } catch {}
    }).catch(() => {});
  }, []);

  const uploadFavicon = async (file: File) => {
    setFaviconUploading(true);
    try {
      const dataUrl = await compressImage(file, 128, 0.85);
      await fetch(`${API_BASE}/settings/favicon`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: dataUrl }) });
      setFaviconUrl(dataUrl);
      setFaviconMsg("✅ تم التحديث!");
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = dataUrl;
    } catch (e: any) { setFaviconMsg("❌ " + e.message); }
    setFaviconUploading(false);
    setTimeout(() => setFaviconMsg(""), 3000);
  };

  const saveHeroSlides = async (slides: HeroSlide[]) => {
    await fetch(`${API_BASE}/settings/hero_slides`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: JSON.stringify(slides) }) });
  };

  const uploadHeroImage = async (file: File, targetSlideId: string | null, field: "desktop" | "mobile") => {
    setHeroUploading(true); setHeroMsg("");
    try {
      const maxDim = field === "desktop" ? 1400 : 900;
      const url = await uploadToGitHub(file, maxDim, 0.82);
      let updated: HeroSlide[];
      if (targetSlideId) {
        updated = heroSlides.map(s => s.id === targetSlideId ? { ...s, [field]: url } : s);
      } else {
        const newSlide: HeroSlide = { id: Date.now().toString(), desktop: field === "desktop" ? url : "", mobile: field === "mobile" ? url : undefined, show: "both" };
        updated = [...heroSlides, newSlide];
      }
      setHeroSlides(updated);
      await saveHeroSlides(updated);
      setHeroMsg("✅ تم الرفع والحفظ!");
    } catch (e: any) { setHeroMsg("❌ " + e.message); }
    setHeroUploading(false);
    setTimeout(() => setHeroMsg(""), 4000);
  };

  useEffect(() => {
    if (!authed) return;
    const es = new EventSource(`${API_ROOT}/api/events`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "new_order") {
          setNewOrderToast({ name: data.order.customer_name, total: data.order.total_amount });
          fetchData();
          if (Notification.permission === "granted") {
            new Notification("🛍️ أوردر جديد!", { body: `${data.order.customer_name} — ${data.order.total_amount} EGP` });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(p => {
              if (p === "granted") new Notification("🛍️ أوردر جديد!", { body: `${data.order.customer_name} — ${data.order.total_amount} EGP` });
            });
          }
          setTimeout(() => setNewOrderToast(null), 6000);
        }
      } catch {}
    };
    return () => es.close();
  }, [authed]);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`${API_BASE}/orders`, { headers: { Accept: "application/json" } }),
        fetch(`${API_BASE}/products?limit=1000`, { headers: { Accept: "application/json" } }),
      ]);
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : ordersData.orders || []);
      setProducts(Array.isArray(productsData) ? productsData : productsData.products || []);
    } catch (err) { console.error("Fetch error:", err); }
    finally { setLoading(false); }
  };

  const confirmedOrders = orders.filter(o => ["completed", "delivered", "confirmed"].includes((o.status || "").toLowerCase()));
  const totalRevenue = confirmedOrders.reduce((s, o) => s + (parseFloat(String(o.total_amount)) || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "pending");
  const activeProducts = products.filter(p => p.is_active).length;
  const outOfStock = products.filter(p => (p.stock || 0) === 0).length;
  const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 5).length;

  const fmt = (n: number) => n.toLocaleString("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  function periodStats(from: Date) {
    const p = confirmedOrders.filter(o => new Date(o.created_at) >= from);
    return { count: p.length, revenue: p.reduce((s, o) => s + (parseFloat(String(o.total_amount)) || 0), 0) };
  }
  const todayStats = periodStats(startOfDay);
  const weekStats = periodStats(startOfWeek);
  const monthStats = periodStats(startOfMonth);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfDay); d.setDate(d.getDate() - (6 - i));
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const dayOrders = confirmedOrders.filter(o => { const t = new Date(o.created_at); return t >= d && t < next; });
    return { label: d.toLocaleDateString("ar-EG", { weekday: "short" }), count: dayOrders.length, revenue: dayOrders.reduce((s, o) => s + (parseFloat(String(o.total_amount)) || 0), 0) };
  });
  const maxRevenue = Math.max(...last7.map(d => d.revenue), 1);

  const tabOrders = ordersTab === "all" ? [...orders].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0,10)
    : ordersTab === "pending" ? pendingOrders.slice(0,10)
    : confirmedOrders.slice(0,10);

  // ── Password screen ──────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, boxShadow: "0 4px 24px rgba(75,103,65,0.12)", textAlign: "center", width: 300 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
        <h2 style={{ margin: "0 0 20px", color: "#2d4a28", fontSize: 18, direction: "rtl" }}>دخول الأدمن</h2>
        <input type="password" value={pw}
          onChange={e => { setPw(e.target.value); setPwError(false); }}
          onKeyDown={e => { if (e.key === "Enter") { if (pw === getAdminPw()) { sessionStorage.setItem("admin_auth", "1"); setAuthed(true); } else setPwError(true); } }}
          placeholder="أدخل كلمة المرور"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${pwError ? "#ef4444" : "#ddd"}`, fontSize: 15, boxSizing: "border-box", outline: "none", marginBottom: 12, textAlign: "center" }} />
        {pwError && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 10px" }}>كلمة مرور خاطئة</p>}
        <button onClick={() => { if (pw === getAdminPw()) { sessionStorage.setItem("admin_auth", "1"); setAuthed(true); } else setPwError(true); }}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          دخول
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ fontSize: 16, color: "#4B6741" }}>جاري التحميل...</div>
    </div>
  );

  // ── Main dashboard ───────────────────────────────────────────────────────
  return (
    <>
      <style jsx global>{`
        .dash-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
        .dash-period-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
        .dash-chart-bar { transition: height 0.4s ease; border-radius: 4px 4px 0 0; }
        @media (max-width: 900px) { .dash-stats-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 900px) { .dash-settings-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 600px) {
          .dash-stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .dash-period-grid { grid-template-columns: 1fr; }
          .dash-pw-grid { grid-template-columns: 1fr !important; }
          .dash-settings-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Stats Cards ────────────────────────────────────────── */}
      <div className="dash-stats-grid">
        {[
          { icon: "📦", label: "إجمالي الطلبات", value: orders.length, sub: `${pendingOrders.length} معلق`, subBg: "#fef3c7", subColor: "#92400e" },
          { icon: "✅", label: "الطلبات المكتملة", value: confirmedOrders.length, sub: `${Math.round(confirmedOrders.length / Math.max(orders.length,1) * 100)}% نسبة الإتمام`, subBg: "#dcfce7", subColor: "#166534" },
          { icon: "💰", label: "إجمالي الإيرادات", value: fmt(totalRevenue) + " EGP", sub: "الطلبات المؤكدة فقط", subBg: "#fef9c3", subColor: "#854d0e" },
          { icon: "🛍️", label: "المنتجات", value: products.length, sub: `${activeProducts} نشط · ${outOfStock} نفذ`, subBg: "#e0e7ff", subColor: "#3730a3" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 16, padding: "20px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ebebeb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0f5eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#888", direction: "rtl" }}>{s.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: "#1a1a2e", direction: "rtl" }}>{s.value}</p>
              </div>
            </div>
            <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 8, background: s.subBg, color: s.subColor, fontSize: 11, fontWeight: 600, direction: "rtl" }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Analytics ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Period stats */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ebebeb" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1a1a2e", direction: "rtl" }}>📊 تحليلات المبيعات</h3>
          <div className="dash-period-grid">
            {[
              { label: "اليوم", icon: "☀️", ...todayStats },
              { label: "آخر 7 أيام", icon: "📅", ...weekStats },
              { label: "هذا الشهر", icon: "🗓️", ...monthStats },
            ].map(p => (
              <div key={p.label} style={{ background: "#f8faf6", borderRadius: 12, padding: "12px 14px", border: "1.5px solid #e8f0e3" }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 6, direction: "rtl" }}>{p.icon} {p.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#2d4a28" }}>{p.count}</div>
                <div style={{ fontSize: 12, color: "#4B6741", fontWeight: 700, marginTop: 2 }}>{fmt(p.revenue)} EGP</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ebebeb" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1a1a2e", direction: "rtl" }}>📈 إيرادات آخر 7 أيام</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90, padding: "0 4px" }}>
            {last7.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {d.revenue > 0 && <div style={{ fontSize: 9, color: "#4B6741", fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(d.revenue)}</div>}
                <div className="dash-chart-bar" style={{ width: "100%", background: i === 6 ? "#4B6741" : "#c8d9b0", height: `${Math.max(4, (d.revenue / maxRevenue) * 64)}px` }} />
                <div style={{ fontSize: 9, color: "#888", whiteSpace: "nowrap" }}>{d.label}</div>
              </div>
            ))}
          </div>
          {lowStock > 0 && (
            <div style={{ marginTop: 14, padding: "8px 12px", borderRadius: 10, background: "#fef3c7", border: "1px solid #fde68a", fontSize: 12, color: "#92400e", direction: "rtl" }}>
              ⚠️ {lowStock} منتج مخزونه منخفض — <Link href="/admin/product" style={{ color: "#4B6741", fontWeight: 700, textDecoration: "none" }}>مراجعة</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Orders ───────────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ebebeb", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e", direction: "rtl" }}>قائمة الطلبات</h3>
          <Link href="/admin/orders" style={{ fontSize: 13, color: "#4B6741", fontWeight: 700, textDecoration: "none" }}>عرض الكل ←</Link>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, direction: "rtl" }}>
          {([["all", "الكل"], ["pending", "المعلقة"], ["completed", "المكتملة"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setOrdersTab(key)}
              style={{ padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: ordersTab === key ? "#4B6741" : "#f3f4f6", color: ordersTab === key ? "#fff" : "#555", transition: "all 0.15s" }}>
              {label}
              {key === "pending" && pendingOrders.length > 0 && <span style={{ marginRight: 5, background: ordersTab === key ? "rgba(255,255,255,0.3)" : "#fef3c7", color: ordersTab === key ? "#fff" : "#92400e", borderRadius: 10, padding: "0 6px", fontSize: 11 }}>{pendingOrders.length}</span>}
            </button>
          ))}
        </div>
        {tabOrders.length === 0 ? (
          <p style={{ textAlign: "center", color: "#aaa", padding: 30 }}>لا توجد طلبات</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8faf6", direction: "rtl" }}>
                  {["رقم الطلب", "العميل", "التاريخ", "الإجمالي", "الحالة"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#555", fontSize: 12, whiteSpace: "nowrap", borderBottom: "1.5px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabOrders.map(order => {
                  const s = STATUS_COLORS[order.status] || { bg: "#f3f4f6", color: "#6b7280", label: order.status };
                  return (
                    <tr key={order.id} style={{ borderBottom: "1px solid #f5f5f5", direction: "rtl" }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#f8faf6"}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#4B6741" }}>
                        <Link href="/admin/orders" style={{ textDecoration: "none", color: "inherit" }}>#{order.id.slice(-6)}</Link>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#333" }}>{order.customer_name || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#888", whiteSpace: "nowrap" }}>{new Date(order.created_at).toLocaleDateString("ar-EG")}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1a1a2e" }}>{fmt(parseFloat(String(order.total_amount)) || 0)} EGP</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "4px 12px", borderRadius: 20, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{s.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── GitHub Status ────────────────────────────────────────── */}
      {(() => {
        const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
        const connected = !!(token && token.length > 10);
        return (
          <div style={{ marginBottom: 20, padding: "14px 20px", borderRadius: 14,
            background: connected ? "#f0fdf4" : "#fff7ed",
            border: `1.5px solid ${connected ? "#86efac" : "#fed7aa"}`,
            display: "flex", alignItems: "center", gap: 12, direction: "rtl" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
              background: connected ? "#22c55e" : "#f97316",
              boxShadow: `0 0 0 3px ${connected ? "rgba(34,197,94,.2)" : "rgba(249,115,22,.2)"}` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: connected ? "#166534" : "#9a3412" }}>
                {connected ? "متصل بـ GitHub — الصور بترفع مباشرة" : "GitHub غير متصل — الصور مش هترفع"}
              </div>
              {!connected && (
                <div style={{ fontSize: 12, color: "#9a3412", marginTop: 3, lineHeight: 1.6 }}>
                  روح Vercel → Settings → Environment Variables → أضف{" "}
                  <code style={{ background: "#fee2e2", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontFamily: "monospace" }}>
                    NEXT_PUBLIC_GITHUB_TOKEN
                  </code>
                  {" "}بالقيمة بتاعته، ثم اعمل Redeploy
                </div>
              )}
            </div>
            {connected && (
              <div style={{ fontSize: 12, color: "#166534", background: "#dcfce7", padding: "4px 12px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap" }}>
                repo: yousefelsayed836-a11y/matrouholive
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Settings ────────────────────────────────────────────── */}
      <div className="dash-settings-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Favicon */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ebebeb" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1a1a2e", direction: "rtl" }}>🖼️ أيقونة التاب (Favicon)</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 14, direction: "rtl" }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, border: "1.5px solid #e0ebd6", overflow: "hidden", flexShrink: 0, background: "#f8faf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {faviconUrl ? <img src={faviconUrl} alt="favicon" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 22 }}>🖼️</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>الصورة الصغيرة في تاب المتصفح</div>
              <label style={{ display: "inline-block", padding: "8px 18px", borderRadius: 10, background: "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {faviconUploading ? "جاري الرفع..." : "رفع صورة جديدة"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && uploadFavicon(e.target.files[0])} disabled={faviconUploading} />
              </label>
            </div>
          </div>
          {faviconMsg && <div style={{ marginTop: 10, fontSize: 13, color: faviconMsg.includes("✅") ? "#166534" : "#991b1b", fontWeight: 600 }}>{faviconMsg}</div>}
        </div>

        {/* Facebook Pixel */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ebebeb" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1a1a2e", direction: "rtl" }}>📘 Facebook Pixel</h3>
          <div style={{ display: "flex", gap: 8, direction: "rtl" }}>
            <input value={fbPixelId} onChange={e => setFbPixelId(e.target.value)} placeholder="Pixel ID"
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e0ebd6", fontSize: 14, outline: "none" }} />
            <button onClick={async () => {
              try {
                await fetch(`${API_BASE}/settings/fb_pixel_id`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: fbPixelId }) });
                setFbPixelMsg("✅ تم!");
              } catch { setFbPixelMsg("❌ فشل"); }
              setTimeout(() => setFbPixelMsg(""), 3000);
            }} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#1877f2", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
              حفظ
            </button>
          </div>
          {fbPixelMsg && <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: fbPixelMsg.includes("✅") ? "#166534" : "#991b1b" }}>{fbPixelMsg}</div>}
          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#f0f5eb", fontSize: 12, color: "#555", direction: "rtl" }}>
            <strong>Catalog Feed:</strong>{" "}
            <code style={{ fontSize: 11, background: "#e0ebd6", padding: "1px 5px", borderRadius: 4 }}>
              {typeof window !== "undefined" ? window.location.origin : "https://matrouholive.com"}/api/fb-feed
            </code>
          </div>
        </div>

        {/* Email Test */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ebebeb" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1a1a2e", direction: "rtl" }}>📧 اختبار الإيميل</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888", direction: "rtl", lineHeight: 1.6 }}>
            اضغط الزرار عشان يتبعتلك إيميل تجريبي على <strong>yousefelsayed836@gmail.com</strong> وتتأكد إن الإشعارات شغّالة.
          </p>
          <button
            onClick={async () => {
              setEmailTestLoading(true);
              setEmailTestMsg("");
              try {
                const res = await fetch(`${API_ROOT}/api/test-email`, { method: "POST" });
                const data = await res.json();
                setEmailTestMsg(data.success ? "✅ " + data.message : "❌ " + data.message);
              } catch (e: any) {
                setEmailTestMsg("❌ فشل الاتصال بالسيرفر");
              }
              setEmailTestLoading(false);
            }}
            disabled={emailTestLoading}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: emailTestLoading ? "#9ca3af" : "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: emailTestLoading ? "not-allowed" : "pointer", direction: "rtl" }}
          >
            {emailTestLoading ? "⏳ جاري الإرسال..." : "📤 إرسال إيميل تجريبي"}
          </button>
          {emailTestMsg && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: emailTestMsg.includes("✅") ? "#dcfce7" : "#fee2e2", color: emailTestMsg.includes("✅") ? "#166534" : "#991b1b", fontSize: 13, fontWeight: 600, direction: "rtl" }}>
              {emailTestMsg}
            </div>
          )}
        </div>
      </div>

      {/* ── Site Settings ────────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ebebeb", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1a1a2e", direction: "rtl" }}>إعدادات الموقع</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, direction: "rtl" }}>
          {([
            ["name",         "اسم الموقع / المتجر",          "مطروح أوليفي"],
            ["whatsapp",     "رقم واتساب (للتواصل)",          "01xxxxxxxxx"],
            ["address",      "العنوان",                       "مطروح، مصر"],
            ["announcement", "إعلان في أعلى الموقع (اتركه فاضي للإخفاء)", "مثال: شحن مجاني فوق 500 ج"],
          ] as const).map(([key, label, placeholder]) => (
            <div key={key} style={{ ...(key === "announcement" ? { gridColumn: "1 / -1" } : {}) }}>
              <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 600 }}>{label}</label>
              <input
                value={siteSettings[key]}
                onChange={e => setSiteSettings(s => ({ ...s, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e0ebd6", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12, direction: "rtl" }}>
          <button onClick={async () => {
            try {
              await fetch(`${API_BASE}/settings/site_settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: JSON.stringify(siteSettings) }) });
              setSiteSettingsMsg("✅ تم الحفظ!");
            } catch { setSiteSettingsMsg("❌ فشل"); }
            setTimeout(() => setSiteSettingsMsg(""), 3000);
          }} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            حفظ الإعدادات
          </button>
          {siteSettingsMsg && <span style={{ fontSize: 13, fontWeight: 600, color: siteSettingsMsg.includes("✅") ? "#166534" : "#991b1b" }}>{siteSettingsMsg}</span>}
        </div>
      </div>

      {/* ── Hero Slides ──────────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ebebeb", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, direction: "rtl" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>صور الهيرو (السلايد شو)</h3>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, background: heroUploading ? "#9ca3af" : "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: heroUploading ? "not-allowed" : "pointer" }}>
            {heroUploading ? "⏳ جاري الرفع..." : "+ إضافة صورة جديدة"}
            <input type="file" accept="image/*" style={{ display: "none" }} disabled={heroUploading}
              onChange={e => e.target.files?.[0] && uploadHeroImage(e.target.files[0], null, "desktop")} />
          </label>
        </div>

        {heroSlides.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#aaa", fontSize: 13 }}>
            لا توجد صور هيرو بعد — اضغط "إضافة صورة جديدة" لرفع أول صورة
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {heroSlides.map((slide, idx) => (
            <div key={slide.id} style={{ border: "1.5px solid #e0ebd6", borderRadius: 14, padding: 16, background: "#f8faf6", direction: "rtl" }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>

                {/* Desktop image */}
                <div style={{ flex: "0 0 auto" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600 }}>صورة الديسكتوب</div>
                  <div style={{ width: 140, height: 80, borderRadius: 10, overflow: "hidden", border: "1.5px solid #ddd", background: "#eee", position: "relative" }}>
                    {slide.desktop
                      ? <img src={slide.desktop} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#bbb", fontSize: 22 }}>+</div>}
                    <label style={{ position: "absolute", inset: 0, cursor: "pointer", opacity: 0 }}>
                      <input type="file" accept="image/*" style={{ display: "none" }} disabled={heroUploading}
                        onChange={e => e.target.files?.[0] && uploadHeroImage(e.target.files[0], slide.id, "desktop")} />
                    </label>
                  </div>
                  <div style={{ fontSize: 10, color: "#4B6741", marginTop: 4, cursor: "pointer", textAlign: "center", fontWeight: 600 }}>اضغط لتغيير</div>
                </div>

                {/* Mobile image */}
                <div style={{ flex: "0 0 auto" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600 }}>صورة الموبايل <span style={{ color: "#bbb", fontWeight: 400 }}>(اختياري)</span></div>
                  <div style={{ width: 70, height: 80, borderRadius: 10, overflow: "hidden", border: "1.5px solid #ddd", background: "#eee", position: "relative" }}>
                    {slide.mobile
                      ? <img src={slide.mobile} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#bbb", fontSize: 22 }}>+</div>}
                    <label style={{ position: "absolute", inset: 0, cursor: "pointer", opacity: 0 }}>
                      <input type="file" accept="image/*" style={{ display: "none" }} disabled={heroUploading}
                        onChange={e => e.target.files?.[0] && uploadHeroImage(e.target.files[0], slide.id, "mobile")} />
                    </label>
                  </div>
                  {slide.mobile && (
                    <div style={{ fontSize: 10, color: "#ef4444", marginTop: 4, cursor: "pointer", textAlign: "center", fontWeight: 600 }}
                      onClick={async () => {
                        const updated = heroSlides.map(s => s.id === slide.id ? { ...s, mobile: undefined } : s);
                        setHeroSlides(updated); await saveHeroSlides(updated);
                      }}>حذف صورة الموبايل</div>
                  )}
                  {!slide.mobile && <div style={{ fontSize: 10, color: "#4B6741", marginTop: 4, cursor: "pointer", textAlign: "center", fontWeight: 600 }}>اضغط لإضافة</div>}
                </div>

                {/* Show on */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600 }}>تظهر على</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {([["both","الكل (موبايل + لاب)"],["desktop","اللاب فقط"],["mobile","الموبايل فقط"]] as const).map(([val, label]) => (
                      <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                        <input type="radio" name={`show-${slide.id}`} checked={slide.show === val} onChange={async () => {
                          const updated = heroSlides.map(s => s.id === slide.id ? { ...s, show: val } : s);
                          setHeroSlides(updated); await saveHeroSlides(updated);
                        }} style={{ accentColor: "#4B6741" }} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Order + Delete */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginRight: "auto" }}>
                  <button disabled={idx === 0} onClick={async () => {
                    const u = [...heroSlides]; [u[idx-1], u[idx]] = [u[idx], u[idx-1]];
                    setHeroSlides(u); await saveHeroSlides(u);
                  }} style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #e0ebd6", background: "#fff", cursor: idx===0?"not-allowed":"pointer", opacity: idx===0?0.4:1, fontSize: 14 }}>↑</button>
                  <button disabled={idx === heroSlides.length-1} onClick={async () => {
                    const u = [...heroSlides]; [u[idx], u[idx+1]] = [u[idx+1], u[idx]];
                    setHeroSlides(u); await saveHeroSlides(u);
                  }} style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #e0ebd6", background: "#fff", cursor: idx===heroSlides.length-1?"not-allowed":"pointer", opacity: idx===heroSlides.length-1?0.4:1, fontSize: 14 }}>↓</button>
                  <button onClick={async () => {
                    const updated = heroSlides.filter(s => s.id !== slide.id);
                    setHeroSlides(updated); await saveHeroSlides(updated);
                    setHeroMsg("✅ تم الحذف");
                    setTimeout(() => setHeroMsg(""), 3000);
                  }} style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #fca5a5", background: "#fff8f8", color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {heroMsg && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: heroMsg.includes("✅") ? "#dcfce7" : "#fee2e2", color: heroMsg.includes("✅") ? "#166534" : "#991b1b", fontSize: 13, fontWeight: 600, direction: "rtl" }}>
            {heroMsg}
          </div>
        )}
      </div>

      {/* ── Featured Products ─────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ebebeb", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e", direction: "rtl" }}>⭐ قسم المنتجات المميزة</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: featuredEnabled ? "#166534" : "#888", fontWeight: 600 }}>{featuredEnabled ? "مفعّل" : "معطّل"}</span>
            <div onClick={() => setFeaturedEnabled(v => !v)}
              style={{ width: 46, height: 26, borderRadius: 13, background: featuredEnabled ? "#4B6741" : "#d1d5db", position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 3, left: featuredEnabled ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
            </div>
          </div>
        </div>
        <input value={featuredTitle} onChange={e => setFeaturedTitle(e.target.value)} placeholder="عنوان قسم المميزة"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e0ebd6", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12, direction: "rtl" }} />
        <input value={featuredSearch} onChange={e => setFeaturedSearch(e.target.value)} placeholder="ابحث عن منتج..."
          style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e0ebd6", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 10, direction: "rtl" }} />
        <div style={{ maxHeight: 280, overflowY: "auto", border: "1.5px solid #e0ebd6", borderRadius: 10, padding: 10, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
            {products.filter(p => !featuredSearch || p.name_en?.toLowerCase().includes(featuredSearch.toLowerCase())).slice(0, 80).map(p => {
              const img = Array.isArray(p.images) ? p.images[0] : (p.images || "");
              const selected = featuredIds.includes(p.id);
              return (
                <div key={p.id} onClick={() => setFeaturedIds(ids => ids.includes(p.id) ? ids.filter(id => id !== p.id) : [...ids, p.id])}
                  style={{ position: "relative", cursor: "pointer", borderRadius: 10, border: `2.5px solid ${selected ? "#4B6741" : "#e0ebd6"}`, overflow: "hidden", background: "#f0f5eb", boxShadow: selected ? "0 0 0 3px rgba(75,103,65,0.2)" : "none", transition: "all 0.15s" }}>
                  <div style={{ aspectRatio: "3/4", width: "100%", overflow: "hidden" }}>
                    <img src={img || `https://placehold.co/90x120/f0f5eb/4B6741?text=🌿`} alt={p.name_en}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/90x120/f0f5eb/4B6741?text=🌿`; }} />
                  </div>
                  {selected && <div style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "#4B6741", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>✓</div>}
                  <div style={{ padding: "4px 6px", background: "#fff" }}>
                    <div style={{ fontSize: 9, color: "#333", fontWeight: 600, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.name_en}</div>
                    <div style={{ fontSize: 9, color: "#4B6741", fontWeight: 700, marginTop: 1 }}>{p.price} EGP</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, direction: "rtl" }}>
          <button onClick={async () => {
            try {
              await fetch(`${API_BASE}/settings/featured_section`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: JSON.stringify({ title: featuredTitle, enabled: featuredEnabled, product_ids: featuredIds }) }) });
              setFeaturedMsg("✅ تم الحفظ!");
            } catch { setFeaturedMsg("❌ فشل"); }
            setTimeout(() => setFeaturedMsg(""), 3000);
          }} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            حفظ المميزة
          </button>
          {featuredIds.length > 0 && <button onClick={() => setFeaturedIds([])} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e0ebd6", background: "#fff", color: "#888", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>مسح الكل</button>}
          {featuredMsg && <span style={{ fontSize: 13, fontWeight: 600, color: featuredMsg.includes("✅") ? "#166534" : "#991b1b" }}>{featuredMsg}</span>}
        </div>
      </div>

      {/* ── Change Password ───────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #ebebeb", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", direction: "rtl" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>🔐 تغيير كلمة المرور</h3>
          <button onClick={() => { setShowChangePw(v => !v); setChangePwMsg(""); setChangePwForm({ current: "", next: "", confirm: "" }); }}
            style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #e0ebd6", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#555" }}>
            {showChangePw ? "إلغاء" : "تغيير →"}
          </button>
        </div>
        {showChangePw && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, direction: "rtl" }}>
            {changePwMsg && <div style={{ padding: "10px 14px", borderRadius: 10, background: changePwMsg.includes("✅") ? "#dcfce7" : "#fee2e2", color: changePwMsg.includes("✅") ? "#166534" : "#991b1b", fontSize: 13, fontWeight: 600 }}>{changePwMsg}</div>}
            <div className="dash-pw-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[["current", "الحالية"], ["next", "الجديدة"], ["confirm", "تأكيد"]].map(([k, label]) => (
                <div key={k}>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 5 }}>{label}</label>
                  <input type="password" value={(changePwForm as any)[k]} onChange={e => setChangePwForm(f => ({ ...f, [k]: e.target.value }))}
                    placeholder={label}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e0ebd6", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <button onClick={() => {
              if (changePwForm.current !== getAdminPw()) { setChangePwMsg("❌ كلمة المرور الحالية خاطئة"); return; }
              if (!changePwForm.next || changePwForm.next.length < 3) { setChangePwMsg("❌ كلمة المرور الجديدة أقل من 3 أحرف"); return; }
              if (changePwForm.next !== changePwForm.confirm) { setChangePwMsg("❌ كلمتا المرور غير متطابقتان"); return; }
              localStorage.setItem("admin_pw", changePwForm.next);
              setChangePwMsg("✅ تم تغيير كلمة المرور بنجاح!");
              setChangePwForm({ current: "", next: "", confirm: "" });
              setTimeout(() => setShowChangePw(false), 2000);
            }} style={{ alignSelf: "flex-start", padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              حفظ كلمة المرور
            </button>
          </div>
        )}
      </div>

      {/* New Order Toast */}
      {newOrderToast && (
        <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 9999, background: "#2d4a28", color: "#fff", borderRadius: 16, padding: "16px 20px", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 14, minWidth: 280 }}>
          <div style={{ fontSize: 32 }}>🛍️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#E8EDD0", direction: "rtl" }}>أوردر جديد!</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>{newOrderToast.name} — {newOrderToast.total.toLocaleString()} EGP</div>
          </div>
          <button onClick={() => setNewOrderToast(null)} style={{ marginRight: "auto", background: "none", border: "none", color: "#aaa", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
      )}
    </>
  );
}
