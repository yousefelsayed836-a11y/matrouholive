"use client";

import { useState, useEffect } from "react";
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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

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

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    fetch(`${API_BASE}/settings/favicon`)
      .then(r => r.json())
      .then(d => { if (d.value) setFaviconUrl(d.value); })
      .catch(() => {});
    fetch(`${API_BASE}/settings/fb_pixel_id`)
      .then(r => r.json())
      .then(d => { if (d.value) setFbPixelId(d.value); })
      .catch(() => {});
    fetch(`${API_BASE}/settings/featured_section`)
      .then(r => r.json())
      .then(d => {
        if (d.value) {
          try {
            const parsed = JSON.parse(d.value);
            setFeaturedTitle(parsed.title || "منتجات مميزة");
            setFeaturedEnabled(parsed.enabled || false);
            setFeaturedIds(parsed.product_ids || []);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const uploadFavicon = async (file: File) => {
    setFaviconUploading(true);
    try {
      const dataUrl = await compressImage(file, 128, 0.85);
      await fetch(`${API_BASE}/settings/favicon`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: dataUrl }),
      });
      setFaviconUrl(dataUrl);
      setFaviconMsg("✅ تم التحديث!");
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = dataUrl;
    } catch (e: any) { setFaviconMsg("❌ " + e.message); }
    setFaviconUploading(false);
    setTimeout(() => setFaviconMsg(""), 3000);
  };

  // SSE: استقبال الأوردرات الجديدة
  useEffect(() => {
    if (!authed) return;
    const es = new EventSource(`${API_BASE.replace("/api", "")}/api/events`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "new_order") {
          setNewOrderToast({ name: data.order.customer_name, total: data.order.total_amount });
          fetchData();
          if (Notification.permission === "granted") {
            new Notification("🛍️ أوردر جديد!", { body: `${data.order.customer_name} — ${data.order.total_amount} EGP`, icon: "/favicon.png" });
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
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = orders.length;

  const confirmedOrders = orders.filter(o =>
    ["completed", "delivered", "confirmed"].includes((o.status || "").toLowerCase())
  );
  const totalRevenue = confirmedOrders.reduce((s, o) => s + (parseFloat(String(o.total_amount)) || 0), 0);

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 5).length;
  const outOfStock = products.filter(p => (p.stock || 0) === 0).length;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (!authed) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f9ee" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, boxShadow: "0 4px 24px rgba(75,103,65,0.12)", textAlign: "center", width: 300 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
        <h2 style={{ margin: "0 0 20px", color: "#2d4a28", fontSize: 18 }}>دخول الأدمن</h2>
        <input
          type="password" value={pw} onChange={e => { setPw(e.target.value); setPwError(false); }}
          onKeyDown={e => { if (e.key === "Enter") { if (pw === getAdminPw()) { sessionStorage.setItem("admin_auth", "1"); setAuthed(true); } else setPwError(true); } }}
          placeholder="أدخل كلمة المرور"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${pwError ? "#ef4444" : "#ddd"}`, fontSize: 15, boxSizing: "border-box", outline: "none", marginBottom: 12, textAlign: "center" }}
        />
        {pwError && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 10px" }}>كلمة مرور خاطئة</p>}
        <button onClick={() => { if (pw === getAdminPw()) { sessionStorage.setItem("admin_auth", "1"); setAuthed(true); } else setPwError(true); }}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          دخول
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f9ee" }}>
      <div style={{ fontSize: 18, color: "#4B6741" }}>جاري التحميل...</div>
    </div>
  );

  return (
    <>
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', sans-serif; background: #f5f9ee; overflow-x: hidden; }
        html { overflow-x: hidden; }
        @media (max-width: 640px) {
          .admin-wrap { padding: 12px !important; }
          .admin-nav-grid { grid-template-columns: 1fr 1fr !important; }
          .admin-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .admin-recent-row { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
          .admin-pw-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="admin-wrap" style={{ minHeight: "100vh", padding: "16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <img src="https://assets.wuiltstore.com/cm5tcbuy002ue01n3dqyt5fy9_IMG_5462.png" alt="مطروح أوليفي" style={{ height: 48, objectFit: "contain" }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#2d4a28" }}>🏠 لوحة تحكم مطروح أوليفي</h1>
              <p style={{ margin: "4px 0 0", color: "#6b8f63", fontSize: 13 }}>نظرة عامة على المتجر</p>
            </div>
          </div>

          {/* Stats */}
          <div className="admin-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>

            <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(75,103,65,0.08)", border: "1px solid #e0ebd6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#4B674122", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "#888" }}>إجمالي الطلبات</p>
                  <p style={{ margin: "2px 0 0", fontSize: 26, fontWeight: 800, color: "#2d4a28" }}>{totalOrders}</p>
                </div>
              </div>
              <span style={{ padding: "3px 10px", borderRadius: 8, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 600 }}>{pendingOrders} قيد الانتظار</span>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(75,103,65,0.08)", border: "1px solid #e0ebd6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#D4AF3722", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💰</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "#888" }}>إجمالي الإيرادات</p>
                  <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: "#2d4a28" }}>{fmt(totalRevenue)} EGP</p>
                </div>
              </div>
              <span style={{ padding: "3px 10px", borderRadius: 8, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 600 }}>الطلبات المؤكدة فقط</span>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(75,103,65,0.08)", border: "1px solid #e0ebd6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#4B674122", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛍️</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "#888" }}>المنتجات</p>
                  <p style={{ margin: "2px 0 0", fontSize: 26, fontWeight: 800, color: "#2d4a28" }}>{totalProducts}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 10px", borderRadius: 8, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 600 }}>{activeProducts} نشط</span>
                {outOfStock > 0 && <span style={{ padding: "3px 10px", borderRadius: 8, background: "#fee2e2", color: "#991b1b", fontSize: 12, fontWeight: 600 }}>{outOfStock} نفذ</span>}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(75,103,65,0.08)", border: "1px solid #e0ebd6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#fef3c722", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚠️</div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: "#888" }}>مخزون منخفض</p>
                  <p style={{ margin: "2px 0 0", fontSize: 26, fontWeight: 800, color: lowStock > 0 ? "#f59e0b" : "#2d4a28" }}>{lowStock}</p>
                </div>
              </div>
              <Link href="/admin/product" style={{ padding: "3px 10px", borderRadius: 8, background: "#E8EDD0", color: "#4B6741", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>إدارة ←</Link>
            </div>
          </div>

          {/* Nav Cards */}
          <div className="admin-nav-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <Link href="/admin/orders" style={{ background: "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", borderRadius: 16, padding: "24px 20px", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(75,103,65,0.3)", transition: "transform 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-4px)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"}>
              <div style={{ fontSize: 36 }}>📦</div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>الطلبات</h2>
              <span style={{ padding: "4px 16px", borderRadius: 20, background: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 600 }}>{totalOrders} طلب ←</span>
            </Link>

            <Link href="/admin/product" style={{ background: "#2d4a28", color: "#fff", borderRadius: 16, padding: "24px 20px", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(45,74,40,0.3)", transition: "transform 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-4px)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"}>
              <div style={{ fontSize: 36 }}>🛍️</div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>المنتجات</h2>
              <span style={{ padding: "4px 16px", borderRadius: 20, background: "rgba(255,255,255,0.1)", fontSize: 12, fontWeight: 600 }}>{totalProducts} منتج ←</span>
            </Link>

            <Link href="/admin/shipping" style={{ background: "linear-gradient(135deg,#D4AF37,#b8941e)", color: "#fff", borderRadius: 16, padding: "24px 20px", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(212,175,55,0.3)", transition: "transform 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-4px)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"}>
              <div style={{ fontSize: 36 }}>🚚</div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>الشحن</h2>
              <span style={{ padding: "4px 16px", borderRadius: 20, background: "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 600 }}>إدارة الأسعار ←</span>
            </Link>

            <Link href="/admin/categories" style={{ background: "linear-gradient(135deg,#6b8f63,#4B6741)", color: "#fff", borderRadius: 16, padding: "24px 20px", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(75,103,65,0.25)", transition: "transform 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-4px)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"}>
              <div style={{ fontSize: 36 }}>🗂️</div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>الفئات</h2>
              <span style={{ padding: "4px 16px", borderRadius: 20, background: "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 600 }}>إدارة ←</span>
            </Link>
          </div>

          {/* Favicon Upload */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(75,103,65,0.08)", border: "1px solid #e0ebd6", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, border: "1.5px solid #e0ebd6", overflow: "hidden", background: "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {faviconUrl
                  ? <img src={faviconUrl} alt="favicon" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 20 }}>🖼️</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#2d4a28", marginBottom: 2 }}>Favicon (أيقونة التاب)</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>الصورة الصغيرة اللي بتظهر في تاب المتصفح</div>
              </div>
              <label style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
                {faviconUploading ? "جاري الرفع..." : "رفع صورة جديدة"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && uploadFavicon(e.target.files[0])} disabled={faviconUploading} />
              </label>
            </div>
            {faviconMsg && <div style={{ marginTop: 10, fontSize: 13, color: faviconMsg.includes("✅") ? "#166534" : "#991b1b", fontWeight: 600 }}>{faviconMsg}</div>}
          </div>

          {/* Facebook Settings */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(75,103,65,0.08)", border: "1px solid #e0ebd6", marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#2d4a28" }}>📘 إعدادات فيسبوك</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 5 }}>Facebook Pixel ID</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={fbPixelId}
                    onChange={e => setFbPixelId(e.target.value)}
                    placeholder="e.g. 1234567890123456"
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e0ebd6", fontSize: 14, outline: "none" }}
                  />
                  <button
                    onClick={async () => {
                      try {
                        await fetch(`${API_BASE}/settings/fb_pixel_id`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ value: fbPixelId }),
                        });
                        setFbPixelMsg("✅ تم الحفظ!");
                      } catch { setFbPixelMsg("❌ فشل الحفظ"); }
                      setTimeout(() => setFbPixelMsg(""), 3000);
                    }}
                    style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1877f2,#0c5fcf)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    حفظ
                  </button>
                </div>
                {fbPixelMsg && <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: fbPixelMsg.includes("✅") ? "#166534" : "#991b1b" }}>{fbPixelMsg}</div>}
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "#f0f5eb", fontSize: 13, color: "#4a5568" }}>
                <strong>Catalog Feed URL:</strong>{" "}
                <code style={{ fontSize: 12, background: "#e0ebd6", padding: "2px 6px", borderRadius: 4 }}>
                  {typeof window !== "undefined" ? window.location.origin : "https://yoursite.com"}/api/fb-feed
                </code>
                <span style={{ marginLeft: 8, color: "#888" }}>— ارفعه في Commerce Manager</span>
              </div>
            </div>
          </div>

          {/* Featured Products Section */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(75,103,65,0.08)", border: "1px solid #e0ebd6", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#2d4a28" }}>⭐ قسم المنتجات المميزة</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: featuredEnabled ? "#166534" : "#888", fontWeight: 600 }}>{featuredEnabled ? "مفعّل" : "معطّل"}</span>
                <div
                  onClick={() => setFeaturedEnabled(v => !v)}
                  style={{
                    width: 46, height: 26, borderRadius: 13,
                    background: featuredEnabled ? "#4B6741" : "#d1d5db",
                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 3, left: featuredEnabled ? 23 : 3,
                    width: 20, height: 20, borderRadius: "50%", background: "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s",
                  }} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 5 }}>عنوان القسم (يظهر في الصفحة الرئيسية)</label>
              <input
                value={featuredTitle}
                onChange={e => setFeaturedTitle(e.target.value)}
                placeholder="مثال: منتجاتنا المميزة، الأكثر مبيعاً..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e0ebd6", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 5 }}>
                اختر المنتجات ({featuredIds.length} محدد)
              </label>
              <input
                value={featuredSearch}
                onChange={e => setFeaturedSearch(e.target.value)}
                placeholder="ابحث عن منتج..."
                style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1.5px solid #e0ebd6", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
              />
              <div style={{ maxHeight: 320, overflowY: "auto", border: "1.5px solid #e0ebd6", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
                  {products
                    .filter(p => {
                      const s = featuredSearch.toLowerCase();
                      return !s || p.name_en?.toLowerCase().includes(s);
                    })
                    .slice(0, 80)
                    .map(p => {
                      const img = Array.isArray(p.images) ? p.images[0] : (p.images || "");
                      const selected = featuredIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => setFeaturedIds(ids =>
                            ids.includes(p.id) ? ids.filter(id => id !== p.id) : [...ids, p.id]
                          )}
                          style={{
                            position: "relative", cursor: "pointer", borderRadius: 10,
                            border: `2.5px solid ${selected ? "#4B6741" : "#e0ebd6"}`,
                            overflow: "hidden", background: "#f0f5eb",
                            boxShadow: selected ? "0 0 0 3px rgba(75,103,65,0.2)" : "none",
                            transition: "border-color 0.15s, box-shadow 0.15s",
                          }}
                        >
                          <div style={{ aspectRatio: "3/4", width: "100%", overflow: "hidden" }}>
                            <img
                              src={img || `https://placehold.co/120x160/f0f5eb/4B6741?text=🌿`}
                              alt={p.name_en}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/120x160/f0f5eb/4B6741?text=🌿`; }}
                            />
                          </div>
                          {selected && (
                            <div style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "#4B6741", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 700 }}>✓</div>
                          )}
                          <div style={{ padding: "5px 6px", background: "#fff" }}>
                            <div style={{ fontSize: 10, color: "#333", fontWeight: 600, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.name_en}</div>
                            <div style={{ fontSize: 10, color: "#4B6741", fontWeight: 700, marginTop: 2 }}>{p.price} EGP</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={async () => {
                  try {
                    await fetch(`${API_BASE}/settings/featured_section`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ value: JSON.stringify({ title: featuredTitle, enabled: featuredEnabled, product_ids: featuredIds }) }),
                    });
                    setFeaturedMsg("✅ تم الحفظ!");
                  } catch { setFeaturedMsg("❌ فشل الحفظ"); }
                  setTimeout(() => setFeaturedMsg(""), 3000);
                }}
                style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                حفظ قسم المميزة
              </button>
              {featuredIds.length > 0 && (
                <button
                  onClick={() => setFeaturedIds([])}
                  style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e0ebd6", background: "#fff", color: "#888", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  مسح الكل
                </button>
              )}
              {featuredMsg && <span style={{ fontSize: 13, fontWeight: 600, color: featuredMsg.includes("✅") ? "#166534" : "#991b1b" }}>{featuredMsg}</span>}
            </div>
          </div>

          {/* Change Password Panel */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(75,103,65,0.08)", border: "1px solid #e0ebd6", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#2d4a28" }}>🔐 تغيير كلمة المرور</h3>
              <button onClick={() => { setShowChangePw(v => !v); setChangePwMsg(""); setChangePwForm({ current: "", next: "", confirm: "" }); }}
                style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #e0ebd6", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#555" }}>
                {showChangePw ? "إلغاء" : "تغيير →"}
              </button>
            </div>
            {showChangePw && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {changePwMsg && (
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: changePwMsg.includes("✅") ? "#dcfce7" : "#fee2e2", color: changePwMsg.includes("✅") ? "#166534" : "#991b1b", fontSize: 13, fontWeight: 600 }}>
                    {changePwMsg}
                  </div>
                )}
                <div className="admin-pw-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 5 }}>كلمة المرور الحالية</label>
                    <input type="password" value={changePwForm.current} onChange={e => setChangePwForm(f => ({ ...f, current: e.target.value }))}
                      placeholder="الحالية"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e0ebd6", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 5 }}>كلمة المرور الجديدة</label>
                    <input type="password" value={changePwForm.next} onChange={e => setChangePwForm(f => ({ ...f, next: e.target.value }))}
                      placeholder="الجديدة"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e0ebd6", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 5 }}>تأكيد الجديدة</label>
                    <input type="password" value={changePwForm.confirm} onChange={e => setChangePwForm(f => ({ ...f, confirm: e.target.value }))}
                      placeholder="تأكيد"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e0ebd6", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <button onClick={() => {
                  if (changePwForm.current !== getAdminPw()) { setChangePwMsg("❌ كلمة المرور الحالية خاطئة"); return; }
                  if (!changePwForm.next || changePwForm.next.length < 3) { setChangePwMsg("❌ كلمة المرور الجديدة أقل من 3 أحرف"); return; }
                  if (changePwForm.next !== changePwForm.confirm) { setChangePwMsg("❌ كلمتا المرور غير متطابقتان"); return; }
                  localStorage.setItem("admin_pw", changePwForm.next);
                  setChangePwMsg("✅ تم تغيير كلمة المرور بنجاح!");
                  setChangePwForm({ current: "", next: "", confirm: "" });
                  setTimeout(() => setShowChangePw(false), 2000);
                }}
                  style={{ alignSelf: "flex-start", padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3A5232)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  حفظ كلمة المرور
                </button>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(75,103,65,0.08)", border: "1px solid #e0ebd6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#2d4a28" }}>أحدث الطلبات</h3>
              <Link href="/admin/orders" style={{ color: "#4B6741", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>عرض الكل ←</Link>
            </div>
            {recentOrders.length === 0 ? (
              <p style={{ textAlign: "center", color: "#888", padding: 20 }}>لا توجد طلبات بعد</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recentOrders.map(order => (
                  <div key={order.id} className="admin-recent-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "#f5f9ee", border: "1px solid #e0ebd6" }}>
                    <div>
                      <span style={{ fontWeight: 700, color: "#4B6741" }}>#{order.id.slice(-6)}</span>
                      {order.customer_name && <span style={{ marginLeft: 10, fontSize: 13, color: "#555" }}>{order.customer_name}</span>}
                      <span style={{ marginLeft: 10, fontSize: 13, color: "#888" }}>{fmt(parseFloat(String(order.total_amount)) || 0)} EGP</span>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: order.status === "pending" ? "#fef3c7" : order.status === "completed" || order.status === "delivered" ? "#dcfce7" : order.status === "cancelled" ? "#fee2e2" : "#f3f4f6", color: order.status === "pending" ? "#92400e" : order.status === "completed" || order.status === "delivered" ? "#166534" : order.status === "cancelled" ? "#991b1b" : "#6b7280" }}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* New Order Toast */}
      {newOrderToast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#2d4a28", color: "#fff", borderRadius: 16, padding: "16px 20px", boxShadow: "0 8px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 14, minWidth: 280, animation: "slideUp 0.3s ease" }}>
          <div style={{ fontSize: 32 }}>🛍️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#E8EDD0" }}>أوردر جديد!</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>{newOrderToast.name} — {newOrderToast.total.toLocaleString()} EGP</div>
          </div>
          <button onClick={() => setNewOrderToast(null)} style={{ marginRight: "auto", background: "none", border: "none", color: "#aaa", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
          <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
      )}
    </>
  );
}
