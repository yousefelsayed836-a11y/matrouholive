"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

const navItems = [
  { href: "/admin", icon: "🏠", label: "لوحة التحكم", exact: true },
  { href: "/admin/orders", icon: "📦", label: "الطلبات" },
  { href: "/admin/product", icon: "🛍️", label: "المنتجات" },
  { href: "/admin/categories", icon: "🗂️", label: "الفئات" },
  { href: "/admin/shipping", icon: "🚚", label: "الشحن" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/orders`, { headers: { Accept: "application/json" } })
      .then(r => r.json())
      .then(data => {
        const orders = Array.isArray(data) ? data : data.orders || [];
        setPendingCount(orders.filter((o: any) => o.status === "pending").length);
      }).catch(() => {});
  }, []);

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <>
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', 'Cairo', sans-serif; background: #f4f6f9; }
        html { overflow-x: hidden; }

        .admin-sidebar {
          position: fixed; top: 0; right: 0; height: 100vh;
          width: 240px; background: #fff; z-index: 200;
          display: flex; flex-direction: column;
          box-shadow: -2px 0 12px rgba(0,0,0,0.08);
          transition: transform 0.3s ease;
        }
        .admin-main {
          margin-right: 240px;
          min-height: 100vh;
          transition: margin 0.3s ease;
        }
        .admin-topbar {
          background: #fff;
          border-bottom: 1px solid #eee;
          padding: 0 24px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .admin-content {
          padding: 24px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          text-decoration: none;
          color: #555;
          font-size: 14px;
          font-weight: 500;
          border-radius: 10px;
          margin: 2px 10px;
          transition: all 0.15s;
          position: relative;
        }
        .nav-item:hover {
          background: #f0f5eb;
          color: #4B6741;
        }
        .nav-item.active {
          background: linear-gradient(135deg, #4B6741, #3a5232);
          color: #fff;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(75,103,65,0.3);
        }
        .nav-item .nav-icon { font-size: 18px; min-width: 22px; text-align: center; }
        .nav-badge {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          background: #ef4444; color: #fff;
          border-radius: 10px; padding: 1px 7px;
          font-size: 11px; font-weight: 700; min-width: 20px; text-align: center;
        }
        .sidebar-overlay {
          display: none;
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 199;
        }
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(100%);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-main {
            margin-right: 0;
          }
          .sidebar-overlay.open {
            display: block;
          }
          .admin-content {
            padding: 16px;
          }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#4B6741", direction: "rtl" }}>مطروح أوليفي ✦</div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2, direction: "rtl" }}>لوحة تحكم المتجر</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 0", direction: "rtl" }}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${isActive(item) ? " active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.href === "/admin/orders" && pendingCount > 0 && (
                <span className="nav-badge">{pendingCount}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f0f0f0", direction: "rtl" }}>
          <a href="/" target="_blank" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#888", textDecoration: "none" }}>
            <span>🌐</span><span>عرض المتجر</span>
          </a>
        </div>
      </aside>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="admin-main">
        {/* Top bar */}
        <div className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              style={{ display: "none", background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#555", padding: 4 }}
              className="mobile-menu-btn"
            >
              ☰
            </button>
            <div style={{ fontSize: 13, color: "#888", direction: "rtl" }}>
              {navItems.find(n => isActive(n))?.label || "الأدمن"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {pendingCount > 0 && (
              <Link href="/admin/orders" style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "#fee2e2", color: "#991b1b", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                🔔 {pendingCount} طلب معلق
              </Link>
            )}
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#4B6741,#3a5232)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              👤
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="admin-content">
          {children}
        </div>
      </div>

      {/* Mobile menu button fix */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
