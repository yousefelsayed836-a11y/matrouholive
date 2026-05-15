"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Product {
  id: string;
  name_en: string;
  name_ar?: string;
  price: number;
  main_image?: string;
  images?: string[];
  handle?: string;
  category_name?: string;
  category_name_ar?: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const LOGO = "https://assets.wuiltstore.com/cm5tcbuy002ue01n3dqyt5fy9_IMG_5462.png";

function getImg(p: Product) {
  const img = p.main_image || (p.images && p.images[0]);
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `http://localhost:5000${img}`;
}

const NAV_LINKS = [
  { label: "الرئيسية",   href: "/" },
  { label: "المنتجات",   href: "/shop" },
  { label: "تواصل معنا", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>(undefined);

  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  useEffect(() => {
    const update = () => {
      try {
        const saved = localStorage.getItem('cart');
        if (saved) {
          const items = JSON.parse(saved);
          setCartCount(items.reduce((s: number, i: any) => s + (i.qty || 0), 0));
        } else setCartCount(0);
      } catch {}
    };
    update();
    window.addEventListener('cartUpdated', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('cartUpdated', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setShowDropdown(false); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `${API_BASE}/products?search=${encodeURIComponent(q)}&is_active=true&limit=8`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setResults(data.products || []);
      setShowDropdown(true);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); setShowDropdown(false); return; }
    timerRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      setShowDropdown(false);
      router.push(`/shop?search=${encodeURIComponent(query)}`);
    }
    if (e.key === 'Escape') { setShowDropdown(false); setQuery(''); }
  };

  if (isDashboard) return null;

  return (
    <>
      {/* شريط إعلانات */}
      <div style={{
        background: "#4B6741",
        overflow: "hidden",
        padding: "8px 0",
        position: "sticky",
        top: 0,
        zIndex: 101,
      }}>
        <div style={{ display: "flex", width: "200%", animation: "tickerScroll 26s linear infinite" }}>
          {[1, 2].map(k => (
            <div key={k} style={{ flex: "0 0 50%", display: "flex", justifyContent: "space-around" }}>
              {[
                "🌿 نخلق لك من الطبيعة حياة أفضل",
                "📞 تواصل معنا: 01229555229",
                "🫒 زيت زيتون بكر ممتاز من مطروح",
                "✨ صدق .. أمانة .. خبرة",
                "📱 تواصل معنا: 01229555229",
              ].map((t, i) => (
                <span key={i} style={{ color: "#E8EDD0", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", padding: "0 40px", fontFamily: "Cairo, sans-serif" }}>
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* الهيدر */}
      <header style={{
        position: "sticky",
        top: "36px",
        zIndex: 100,
        background: "#fff",
        borderBottom: "1px solid #d8e4c4",
        boxShadow: "0 2px 12px rgba(75,103,65,0.08)",
        padding: "8px 24px",
      }}>
        <div className="header-inner" style={{ maxWidth: 1300, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, direction: "rtl" }}>

          {/* اللوجو */}
          <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <img
              src={LOGO}
              alt="مطروح أوليفي"
              className="header-logo"
              style={{ height: 52, width: "auto", display: "block" }}
            />
          </Link>

          {/* روابط تنقل - ديسكتوب */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }} className="desktop-nav">
            {NAV_LINKS.map(item => (
              <Link key={item.href} href={item.href} style={{
                padding: "7px 16px", borderRadius: 20, textDecoration: "none",
                fontSize: 14, fontWeight: 600, whiteSpace: "nowrap",
                color: pathname === item.href ? "#fff" : "#4B6741",
                background: pathname === item.href ? "#4B6741" : "transparent",
                transition: "all 0.2s",
                fontFamily: "Cairo, sans-serif",
              }}
                onMouseEnter={e => { if (pathname !== item.href) (e.currentTarget as HTMLAnchorElement).style.background = "#E8EDD0"; }}
                onMouseLeave={e => { if (pathname !== item.href) (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* البحث */}
          <div ref={searchRef} className="header-search" style={{ flex: 1, maxWidth: 480, position: "relative" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#4B6741", pointerEvents: "none" }}>🔍</span>
              <input
                type="text"
                value={query}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query && setShowDropdown(true)}
                placeholder="ابحث عن منتج..."
                style={{
                  width: "100%", padding: "9px 40px 9px 36px",
                  borderRadius: 30, border: "1.5px solid #c8d9b0",
                  fontSize: 14, outline: "none", background: "#f8fbf4",
                  color: "#333", boxSizing: "border-box",
                  direction: "rtl", fontFamily: "Cairo, sans-serif",
                }}
                onFocusCapture={e => {
                  (e.target as HTMLInputElement).style.borderColor = "#4B6741";
                  (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(75,103,65,0.12)";
                }}
                onBlurCapture={e => {
                  (e.target as HTMLInputElement).style.borderColor = "#c8d9b0";
                  (e.target as HTMLInputElement).style.boxShadow = "none";
                }}
              />
              {query && !searching && (
                <button onClick={() => { setQuery(""); setResults([]); setShowDropdown(false); }}
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#aaa", lineHeight: 1, padding: 0 }}>
                  ×
                </button>
              )}
            </div>

            {showDropdown && query && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff", borderRadius: 16, border: "1px solid #c8d9b0", boxShadow: "0 12px 40px rgba(75,103,65,0.15)", zIndex: 200, overflow: "hidden", maxHeight: 400, overflowY: "auto" }}>
                {results.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#bbb", fontSize: 14, fontFamily: "Cairo, sans-serif" }}>
                    لا توجد نتائج لـ "<strong>{query}</strong>"
                  </div>
                ) : (
                  <>
                    {results.map(p => (
                      <Link key={p.id} href={`/products/slug?id=${p.id}`}
                        onClick={() => { setShowDropdown(false); setQuery(""); }}
                        style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #f0f5e8", color: "inherit", transition: "background 0.15s", direction: "rtl" }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "#f5f9ee"}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}>
                        <div style={{ width: 46, height: 46, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#E8EDD0" }}>
                          {getImg(p) ? (
                            <img src={getImg(p)!} alt={p.name_en} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>🫒</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#2a3a20", fontFamily: "Cairo, sans-serif" }}>{p.name_ar || p.name_en}</div>
                          {(p.category_name_ar || p.category_name) && <div style={{ fontSize: 12, color: "#4B6741", fontFamily: "Cairo, sans-serif" }}>{p.category_name_ar || p.category_name}</div>}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#4B6741", flexShrink: 0 }}>{p.price} ج.م</div>
                      </Link>
                    ))}
                    <button onClick={() => { setShowDropdown(false); router.push(`/shop?search=${encodeURIComponent(query)}`); }}
                      style={{ width: "100%", padding: 12, background: "#fff", border: "none", color: "#4B6741", fontSize: 13, fontWeight: 700, cursor: "pointer", borderTop: "1px solid #c8d9b0", fontFamily: "Cairo, sans-serif" }}>
                      عرض كل النتائج →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* أيقونات اليمين */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* سوشيال */}
            <div className="social-icons" style={{ display: "flex", gap: 6 }}>
              {[
                { icon: "📘", label: "Facebook" },
                { icon: "📷", label: "Instagram" },
                { icon: "💬", label: "WhatsApp" },
              ].map(s => (
                <a key={s.label} href="#" title={s.label} style={{ width: 32, height: 32, borderRadius: "50%", background: "#E8EDD0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, textDecoration: "none", transition: "background 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "#c8d9b0"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "#E8EDD0"}>
                  {s.icon}
                </a>
              ))}
            </div>

            {/* كارت */}
            <Link href="/cart" style={{ position: "relative", textDecoration: "none", fontSize: 22, padding: "4px 8px" }}>
              🛒
              {cartCount > 0 && (
                <span style={{ position: "absolute", top: 0, right: 0, background: "#4B6741", color: "#fff", width: 18, height: 18, borderRadius: "50%", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* موبايل هامبرجر */}
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: "none", background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#4B6741" }}>
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* موبايل قائمة */}
        {mobileMenuOpen && (
          <div style={{ background: "#fff", borderTop: "1px solid #E8EDD0", padding: "12px 24px", direction: "rtl" }}>
            {NAV_LINKS.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                style={{ display: "block", padding: "10px 0", fontSize: 15, fontWeight: 600, color: pathname === item.href ? "#4B6741" : "#333", textDecoration: "none", borderBottom: "1px solid #E8EDD0", fontFamily: "Cairo, sans-serif" }}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <style jsx global>{`
        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (max-width: 900px) {
          .desktop-nav     { display: none !important; }
          .social-icons    { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 600px) {
          .header-inner    { gap: 8px !important; padding: 6px 12px !important; }
          .header-logo     { height: 40px !important; }
          .header-search   { min-width: 0 !important; flex: 1 !important; max-width: 100% !important; }
          .header-search input { font-size: 13px !important; padding: 8px 36px 8px 28px !important; }
        }
      `}</style>
    </>
  );
}
