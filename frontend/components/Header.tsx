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

// Brand colors
const C = {
  green: "#4f7032",
  greenDark: "#3d5828",
  cream: "#f1f7c9",
  light: "#d7f7b3",
  border: "#c8e6a0",
  gold: "#bd9a52",
  dark: "#2d2b27",
};

function getImg(p: Product) {
  const img = p.main_image || (p.images && p.images[0]);
  if (!img) return null;
  if (img.startsWith("http") || img.startsWith("data:")) return img;
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
  const [showEidBanner, setShowEidBanner] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (!localStorage.getItem('eid_adha_banner_v1')) setShowEidBanner(true);
  }, []);

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
      const res = await fetch(`${API_BASE}/products?search=${encodeURIComponent(q)}&is_active=true&limit=8`, { cache: "no-store" });
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
      <div style={{ background: C.green, overflow: "hidden", padding: "8px 0", position: "sticky", top: 0, zIndex: 101 }}>
        <div style={{ display: "flex", width: "200%", animation: "tickerScroll 26s linear infinite" }}>
          {[1, 2].map(k => (
            <div key={k} style={{ flex: "0 0 50%", display: "flex", justifyContent: "space-around" }}>
              {[
                "🎁 شحن مجاني لأي أوردر فوق 1000 جنيه — بمناسبة عيد الأضحى المبارك",
                "🌿 نخلق لك من الطبيعة حياة أفضل",
                "📞 تواصل معنا: 01229555229",
                "🫒 زيت زيتون بكر ممتاز من مطروح",
                "✨ صدق .. أمانة .. خبرة",
              ].map((t, i) => (
                <span key={i} style={{ color: C.light, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", padding: "0 40px", fontFamily: "Cairo, sans-serif" }}>
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* الهيدر */}
      <header style={{
        position: "sticky", top: "36px", zIndex: 100,
        background: "#fff",
        borderBottom: `1px solid ${C.border}`,
        boxShadow: "0 2px 16px rgba(79,112,50,0.1)",
        padding: "8px 24px",
      }}>
        <div className="header-inner" style={{ maxWidth: 1300, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, direction: "rtl" }}>

          {/* اللوجو */}
          <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <img src={LOGO} alt="مطروح أوليفي" className="header-logo" style={{ height: 52, width: "auto", display: "block" }} />
          </Link>

          {/* روابط تنقل */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }} className="desktop-nav">
            {NAV_LINKS.map(item => (
              <Link key={item.href} href={item.href} style={{
                padding: "7px 16px", borderRadius: 20, textDecoration: "none",
                fontSize: 14, fontWeight: 600, whiteSpace: "nowrap",
                color: pathname === item.href ? "#fff" : C.green,
                background: pathname === item.href ? C.green : "transparent",
                transition: "all 0.2s", fontFamily: "Cairo, sans-serif",
              }}
                onMouseEnter={e => { if (pathname !== item.href) (e.currentTarget as HTMLAnchorElement).style.background = C.light; }}
                onMouseLeave={e => { if (pathname !== item.href) (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* البحث */}
          <div ref={searchRef} className="header-search" style={{ flex: 1, maxWidth: 480, position: "relative" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.green, pointerEvents: "none" }}>🔍</span>
              <input
                type="text" value={query}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query && setShowDropdown(true)}
                placeholder="ابحث عن منتج..."
                style={{
                  width: "100%", padding: "9px 40px 9px 36px",
                  borderRadius: 30, border: `1.5px solid ${C.border}`,
                  fontSize: 14, outline: "none", background: C.cream,
                  color: C.dark, boxSizing: "border-box",
                  direction: "rtl", fontFamily: "Cairo, sans-serif",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocusCapture={e => {
                  (e.target as HTMLInputElement).style.borderColor = C.green;
                  (e.target as HTMLInputElement).style.boxShadow = `0 0 0 3px rgba(79,112,50,0.12)`;
                }}
                onBlurCapture={e => {
                  (e.target as HTMLInputElement).style.borderColor = C.border;
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
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 12px 40px rgba(79,112,50,0.15)", zIndex: 200, overflow: "hidden", maxHeight: 400, overflowY: "auto" }}>
                {results.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#bbb", fontSize: 14, fontFamily: "Cairo, sans-serif" }}>
                    لا توجد نتائج لـ "<strong>{query}</strong>"
                  </div>
                ) : (
                  <>
                    {results.map(p => (
                      <Link key={p.id} href={`/products/slug?id=${p.id}`}
                        onClick={() => { setShowDropdown(false); setQuery(""); }}
                        style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: `1px solid ${C.cream}`, color: "inherit", direction: "rtl" }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = C.cream}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "transparent"}>
                        <div style={{ width: 46, height: 46, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: C.light }}>
                          {getImg(p) ? (
                            <img src={getImg(p)!} alt={p.name_en} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>🫒</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, fontFamily: "Cairo, sans-serif" }}>{p.name_ar || p.name_en}</div>
                          {(p.category_name_ar || p.category_name) && <div style={{ fontSize: 12, color: C.green, fontFamily: "Cairo, sans-serif" }}>{p.category_name_ar || p.category_name}</div>}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.green, flexShrink: 0 }}>{p.price} ج.م</div>
                      </Link>
                    ))}
                    <button onClick={() => { setShowDropdown(false); router.push(`/shop?search=${encodeURIComponent(query)}`); }}
                      style={{ width: "100%", padding: 12, background: "#fff", border: "none", color: C.green, fontSize: 13, fontWeight: 700, cursor: "pointer", borderTop: `1px solid ${C.border}`, fontFamily: "Cairo, sans-serif" }}>
                      عرض كل النتائج →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* أيقونات اليمين */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div className="social-icons" style={{ display: "flex", gap: 6 }}>
              {[
                { icon: "📘", label: "Facebook" },
                { icon: "📷", label: "Instagram" },
                { icon: "💬", label: "WhatsApp" },
              ].map(s => (
                <a key={s.label} href="#" title={s.label}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: C.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, textDecoration: "none", transition: "background 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = C.border}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = C.light}>
                  {s.icon}
                </a>
              ))}
            </div>

            <Link href="/cart" style={{ position: "relative", textDecoration: "none", fontSize: 22, padding: "4px 8px" }}>
              🛒
              {cartCount > 0 && (
                <span style={{ position: "absolute", top: 0, right: 0, background: C.green, color: "#fff", width: 18, height: 18, borderRadius: "50%", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: "none", background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.green }}>
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div style={{ background: "#fff", borderTop: `1px solid ${C.border}`, padding: "12px 24px", direction: "rtl" }}>
            {NAV_LINKS.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                style={{ display: "block", padding: "10px 0", fontSize: 15, fontWeight: 600, color: pathname === item.href ? C.green : C.dark, textDecoration: "none", borderBottom: `1px solid ${C.cream}`, fontFamily: "Cairo, sans-serif" }}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Eid Popup */}
      {showEidBanner && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}
          onClick={() => { localStorage.setItem('eid_adha_banner_v1', '1'); setShowEidBanner(false); }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "36px 28px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.3)", position: "relative", fontFamily: "Cairo, sans-serif" }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => { localStorage.setItem('eid_adha_banner_v1', '1'); setShowEidBanner(false); }}
              style={{ position: "absolute", top: 14, left: 14, background: "#f5f5f5", border: "none", borderRadius: "50%", width: 30, height: 30, fontSize: 18, cursor: "pointer", color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <div style={{ fontSize: 52, marginBottom: 10 }}>🎊</div>
            <h2 style={{ color: C.greenDark, margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>بمناسبة عيد الأضحى المبارك</h2>
            <div style={{ background: `linear-gradient(135deg,${C.green},${C.greenDark})`, borderRadius: 16, padding: "16px 20px", margin: "16px 0" }}>
              <p style={{ color: C.light, margin: 0, fontSize: 18, fontWeight: 800 }}>🚚 شحن مجاني</p>
              <p style={{ color: "#fff", margin: "6px 0 0", fontSize: 15, fontWeight: 700 }}>لأي أوردر يتخطى 1000 جنيه!</p>
            </div>
            <p style={{ color: "#888", margin: "0 0 20px", fontSize: 13 }}>⏳ العرض ساري لفترة محدودة — لا تفوّتك الفرصة!</p>
            <button onClick={() => { localStorage.setItem('eid_adha_banner_v1', '1'); setShowEidBanner(false); router.push('/shop'); }}
              style={{ width: "100%", padding: "13px 0", borderRadius: 30, border: "none", background: `linear-gradient(135deg,${C.green},${C.greenDark})`, color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>
              🛒 تسوق الآن
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (max-width: 900px) {
          .desktop-nav     { display: none !important; }
          .social-icons    { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 600px) {
          .header-inner  { gap: 8px !important; padding: 6px 12px !important; }
          .header-logo   { height: 40px !important; }
          .header-search { min-width: 0 !important; flex: 1 !important; max-width: 100% !important; }
          .header-search input { font-size: 13px !important; padding: 8px 36px 8px 28px !important; }
        }
      `}</style>
    </>
  );
}
