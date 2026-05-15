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
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

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

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f9ee" }}>
      <div style={{ fontSize: 18, color: "#4B6741" }}>جاري التحميل...</div>
    </div>
  );

  return (
    <>
      <style jsx global>{`* { box-sizing: border-box; } body { margin: 0; font-family: 'Segoe UI', sans-serif; background: #f5f9ee; }`}</style>

      <div style={{ minHeight: "100vh", padding: "24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 16 }}>
            <img src="https://assets.wuiltstore.com/cm5tcbuy002ue01n3dqyt5fy9_IMG_5462.png" alt="مطروح أوليفي" style={{ height: 48, objectFit: "contain" }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#2d4a28" }}>لوحة تحكم مطروح أوليفي</h1>
              <p style={{ margin: "4px 0 0", color: "#6b8f63", fontSize: 14 }}>نظرة عامة على المتجر</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>

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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
            <Link href="/admin/orders" style={{ background: "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", borderRadius: 16, padding: "24px 20px", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(75,103,65,0.3)", transition: "transform 0.2s" }}
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
                  <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 10, background: "#f5f9ee", border: "1px solid #e0ebd6" }}>
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
    </>
  );
}
