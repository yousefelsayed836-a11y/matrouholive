"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Product {
  id: string; name_en: string; name_ar?: string; price: number;
  main_image?: string; images?: string[];
  category_name?: string; category_name_ar?: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const LOGO = "https://assets.wuiltstore.com/cm5tcbuy002ue01n3dqyt5fy9_IMG_5462.png";
const G = "#4f7032"; const GD = "#3d5828"; const GL = "#d7f7b3";
const CB = "#f1f7c9"; const AU = "#bd9a52"; const DK = "#2d2b27";
const BORDER = "#c8e6a0";

const NAV = [
  { label: "الرئيسية", href: "/" },
  { label: "المنتجات", href: "/shop" },
  { label: "تواصل معنا", href: "/contact" },
];

const TICKER = ["🌿 نخلق لك من الطبيعة حياة أفضل", "🫒 زيت زيتون بكر ممتاز من مطروح",
  "📞 تواصل معنا: 01229555229", "✨ صدق .. أمانة .. خبرة",
  "🚚 توصيل لجميع المحافظات"];

function getImg(p: Product) {
  const img = p.main_image || (p.images && p.images[0]);
  if (!img) return null;
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  return `http://localhost:5000${img}`;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout>(undefined);

  const isHome = pathname === '/';
  const ghost = isHome && !scrolled;
  const isDash = pathname.startsWith('/admin') || pathname.startsWith('/dashboard');
  const isShop = pathname === '/shop' || pathname.startsWith('/products');

  /* scroll detection */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* cart */
  useEffect(() => {
    const upd = () => {
      try {
        const c = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(c.reduce((s: number, i: any) => s + (i.qty || 0), 0));
      } catch {}
    };
    upd();
    window.addEventListener('cartUpdated', upd);
    window.addEventListener('storage', upd);
    return () => { window.removeEventListener('cartUpdated', upd); window.removeEventListener('storage', upd); };
  }, []);

  /* close search dropdown on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* close menu on route change */
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setShowDrop(false); return; }
    setSearching(true);
    try {
      const r = await fetch(`${API_BASE}/products?search=${encodeURIComponent(q)}&is_active=true&limit=8`);
      const d = await r.json();
      setResults(d.products || []); setShowDrop(true);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  const handleInput = (v: string) => {
    setQuery(v);
    clearTimeout(timerRef.current);
    if (!v.trim()) { setResults([]); setShowDrop(false); return; }
    timerRef.current = setTimeout(() => doSearch(v), 300);
  };

  if (isDash) return null;

  return (
    <>
      {/* ═══ FIXED HEADER UNIT ═══ */}
      <div className="hdr-unit" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>

        {/* Ticker — slides in when scrolled */}
        <div style={{
          background: GD, overflow: 'hidden', padding: '7px 0',
          maxHeight: scrolled ? 34 : 0,
          transition: 'max-height 0.4s ease',
        }}>
          <div style={{ display: 'flex', width: '200%', animation: 'tickerScroll 28s linear infinite' }}>
            {[0, 1].map(k => (
              <div key={k} style={{ flex: '0 0 50%', display: 'flex', justifyContent: 'space-around' }}>
                {TICKER.map((t, i) => (
                  <span key={i} style={{ color: GL, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', padding: '0 32px', fontFamily: 'Cairo, sans-serif' }}>{t}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main nav bar */}
        <header style={{
          height: 64, display: 'flex', alignItems: 'center', padding: '0 20px',
          background: ghost ? 'transparent' : 'rgba(255,255,255,0.97)',
          backdropFilter: ghost ? 'none' : 'blur(14px)',
          WebkitBackdropFilter: ghost ? 'none' : 'blur(14px)',
          borderBottom: ghost ? 'none' : `1px solid ${BORDER}`,
          boxShadow: ghost ? 'none' : '0 2px 20px rgba(0,0,0,0.07)',
          transition: 'background 0.4s, box-shadow 0.4s, border-color 0.4s',
        }}>
          <div style={{
            maxWidth: 1300, width: '100%', margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            direction: 'rtl', position: 'relative', padding: '0 4px',
          }}>

            {/* ── Right: Hamburger + Desktop nav ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 1 }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                aria-label="القائمة"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, touchAction: 'manipulation' }}>
                <span style={{
                  display: 'block', height: 2.5, borderRadius: 2, background: ghost ? 'rgba(255,255,255,0.92)' : G,
                  width: 22, transform: menuOpen ? 'translateY(7.5px) rotate(45deg)' : 'none',
                  transition: 'all 0.3s ease', transformOrigin: 'center',
                }} />
                <span style={{
                  display: 'block', height: 2.5, borderRadius: 2, background: ghost ? 'rgba(255,255,255,0.92)' : G,
                  width: 16, opacity: menuOpen ? 0 : 1,
                  transition: 'all 0.3s ease',
                }} />
                <span style={{
                  display: 'block', height: 2.5, borderRadius: 2, background: ghost ? 'rgba(255,255,255,0.92)' : G,
                  width: menuOpen ? 22 : 10, transform: menuOpen ? 'translateY(-7.5px) rotate(-45deg)' : 'none',
                  transition: 'all 0.3s ease', transformOrigin: 'center',
                }} />
              </button>

              {/* Desktop nav — hidden when transparent, CSS hides on mobile */}
              {!ghost && (
                <nav className="desk-nav" style={{ gap: 4 }}>
                  {NAV.map(item => (
                    <Link key={item.href} href={item.href} style={{
                      padding: '6px 14px', borderRadius: 20, textDecoration: 'none',
                      fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'Cairo, sans-serif',
                      color: pathname === item.href ? '#fff' : G,
                      background: pathname === item.href ? G : 'transparent',
                      transition: 'all 0.2s',
                    }}>{item.label}</Link>
                  ))}
                </nav>
              )}
            </div>

            {/* ── Center: Logo — absolutely centered on all screens ── */}
            <Link href="/" style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              textDecoration: 'none', display: 'flex', alignItems: 'center',
            }}>
              <img src={LOGO} alt="مطروح أوليفي" style={{
                height: 46, width: 'auto', display: 'block',
                filter: ghost ? 'brightness(0) invert(1)' : 'none',
                transition: 'filter 0.4s ease',
              }} />
            </Link>

            {/* ── Left: Search + Cart bag ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, zIndex: 1 }}>
              {/* Search (desktop, hidden when ghost) */}
              {!ghost && (
                <div ref={searchRef} className="desk-search" style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: G, fontSize: 13, pointerEvents: 'none' }} />
                    <input
                      type="text" value={query} onChange={e => handleInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && query.trim()) { setShowDrop(false); router.push(`/shop?search=${encodeURIComponent(query)}`); } if (e.key === 'Escape') { setShowDrop(false); setQuery(''); } }}
                      onFocus={() => query && setShowDrop(true)}
                      placeholder="ابحث..."
                      style={{ width: '100%', padding: '8px 36px 8px 12px', borderRadius: 24, border: `1.5px solid ${BORDER}`, fontSize: 13, outline: 'none', background: CB, color: DK, fontFamily: 'Cairo, sans-serif', direction: 'rtl', boxSizing: 'border-box' }}
                    />
                    {query && <button onClick={() => { setQuery(''); setResults([]); setShowDrop(false); }} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#aaa', padding: 0, lineHeight: 1 }}>×</button>}
                  </div>
                  {showDrop && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, boxShadow: '0 12px 40px rgba(79,112,50,0.15)', zIndex: 300, overflow: 'hidden', maxHeight: 380, overflowY: 'auto' }}>
                      {results.length === 0
                        ? <div style={{ padding: 18, textAlign: 'center', color: '#bbb', fontSize: 13, fontFamily: 'Cairo, sans-serif' }}>لا توجد نتائج لـ «{query}»</div>
                        : (<>{results.map(p => (
                          <Link key={p.id} href={`/products/${p.id}`} onClick={() => { setShowDrop(false); setQuery(''); }}
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: `1px solid ${CB}`, color: 'inherit', direction: 'rtl' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: GL }}>
                              {getImg(p) ? <img src={getImg(p)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> : null}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: DK, fontFamily: 'Cairo, sans-serif' }}>{p.name_ar || p.name_en}</div>
                              {(p.category_name_ar || p.category_name) && <div style={{ fontSize: 11, color: G, fontFamily: 'Cairo, sans-serif' }}>{p.category_name_ar || p.category_name}</div>}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: G, flexShrink: 0, fontFamily: 'Cairo, sans-serif' }}>{p.price} ج.م</div>
                          </Link>
                        ))}
                        <button onClick={() => { setShowDrop(false); router.push(`/shop?search=${encodeURIComponent(query)}`); }} style={{ width: '100%', padding: 11, background: '#fff', border: 'none', color: G, fontSize: 12, fontWeight: 700, cursor: 'pointer', borderTop: `1px solid ${BORDER}`, fontFamily: 'Cairo, sans-serif' }}>
                          عرض كل النتائج ←
                        </button></>)}
                    </div>
                  )}
                </div>
              )}

              {/* Cart bag */}
              <Link href="/cart" style={{ position: 'relative', textDecoration: 'none', touchAction: 'manipulation' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: ghost ? 'rgba(255,255,255,0.15)' : CB,
                  border: ghost ? '1.5px solid rgba(255,255,255,0.4)' : `1.5px solid ${BORDER}`,
                  transition: 'all 0.3s',
                }}>
                  <i className="fas fa-bag-shopping" style={{ fontSize: 16, color: ghost ? '#fff' : G }} />
                </div>
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: -3, left: -3, background: AU, color: '#fff', width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif', border: '2px solid #fff' }}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile search bar — only on shop/product pages */}
        <div style={{
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          padding: isShop ? '8px 16px' : 0,
          maxHeight: isShop ? 56 : 0, overflow: 'hidden',
          borderBottom: isShop ? `1px solid ${BORDER}` : 'none',
          transition: 'max-height 0.4s ease, padding 0.4s ease',
        }} className="mob-search-bar">
          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: G, fontSize: 13, pointerEvents: 'none' }} />
            <input
              type="text" value={query} onChange={e => handleInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && query.trim()) { router.push(`/shop?search=${encodeURIComponent(query)}`); setQuery(''); } }}
              placeholder="ابحث عن منتج..."
              style={{ width: '100%', padding: '9px 36px 9px 12px', borderRadius: 24, border: `1.5px solid ${BORDER}`, fontSize: 14, outline: 'none', background: CB, color: DK, fontFamily: 'Cairo, sans-serif', direction: 'rtl', boxSizing: 'border-box' }}
            />
            {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa', padding: 0 }}>×</button>}
          </div>
        </div>
      </div>

      {/* ═══ MENU DRAWER ═══ */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, direction: 'rtl' }}>
          {/* backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }} onClick={() => setMenuOpen(false)} />
          {/* drawer from right */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 280,
            background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
          }}>
            {/* drawer header */}
            <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${CB}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <img src={LOGO} alt="مطروح أوليفي" style={{ height: 40 }} />
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888', padding: 4 }}>×</button>
            </div>
            {/* nav links */}
            <div style={{ padding: '12px 0', flex: 1 }}>
              {NAV.map(item => (
                <Link key={item.href} href={item.href}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', textDecoration: 'none', borderBottom: `1px solid ${CB}`, color: pathname === item.href ? G : DK, fontWeight: pathname === item.href ? 700 : 600, fontSize: 15, fontFamily: 'Cairo, sans-serif', background: pathname === item.href ? `${GL}88` : 'transparent' }}>
                  <i className={`fas ${item.href === '/' ? 'fa-home' : item.href === '/shop' ? 'fa-store' : 'fa-envelope'}`} style={{ fontSize: 16, color: G, width: 20, textAlign: 'center' }} />
                  {item.label}
                </Link>
              ))}
              <Link href="/cart" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', textDecoration: 'none', color: DK, fontWeight: 600, fontSize: 15, fontFamily: 'Cairo, sans-serif' }}>
                <i className="fas fa-bag-shopping" style={{ fontSize: 16, color: G, width: 20, textAlign: 'center' }} />
                سلة التسوق
                {cartCount > 0 && <span style={{ background: AU, color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 800, fontFamily: 'Cairo, sans-serif' }}>{cartCount}</span>}
              </Link>
            </div>
            {/* drawer footer */}
            <div style={{ padding: '16px 20px', borderTop: `1px solid ${CB}`, display: 'flex', gap: 12 }}>
              {[{ href: 'https://wa.me/201229555229', icon: 'fa-whatsapp', bg: '#25D366' }, { href: '#', icon: 'fa-facebook-f', bg: '#1877F2' }, { href: '#', icon: 'fa-instagram', bg: '#E4405F' }].map(s => (
                <a key={s.icon} href={s.href} target="_blank" rel="noreferrer"
                  style={{ width: 38, height: 38, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#fff', fontSize: 15 }}>
                  <i className={`fab ${s.icon}`} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .desk-nav { display: none !important; }
        .desk-search { display: none !important; }
        .mob-search-bar { display: block; }
        @media (min-width: 900px) {
          .desk-nav    { display: flex !important; }
          .desk-search { display: block !important; }
          .mob-search-bar { display: none !important; }
        }
      `}</style>
    </>
  );
}
