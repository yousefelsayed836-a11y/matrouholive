"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const HERO_BANNER = "https://assets.wuiltstore.com/cmesintt84hgm01ksersa5djl_1.png";
const LOGO      = "https://assets.wuiltstore.com/cm5tcbuy002ue01n3dqyt5fy9_IMG_5462.png";
const API_BASE  = (process.env.NEXT_PUBLIC_API_URL || "https://api.matrouholive.com") + "/api";

/* ── brand palette ─────────────────────────────── */
const G  = "#4f7032";   // green main
const GD = "#3d5828";   // green dark
const GL = "#d7f7b3";   // green light
const CB = "#f1f7c9";   // cream background
const AU = "#bd9a52";   // gold
const DK = "#2d2b27";   // dark

interface Product {
  id: string; name_en: string; name_ar?: string;
  price: number; old_price?: number;
  images?: string[]; main_image?: string;
}
interface CartItem {
  product: { id: string; name_ar: string; name_en: string; price: number; image_url?: string };
  qty: number; size: string;
}

const REVIEWS = [
  { text: "والله زيت الزيتون بتاعهم تحفة! ريحته حلوة جداً والطعم أصلي مش زي اللي في المحلات", name: "أحمد محمود" },
  { text: "اشتريت منهم زجاجة تجربة وعجبتني جداً، دلوقتي بطلب كميات كبيرة. التغليف ممتاز والمنتج وصل سليم", name: "فاطمة علي" },
  { text: "زيت مطروح ده فعلاً له طعم مختلف عن أي زيت تاني. أنصح بيه لكل الأسرة", name: "محمود سامي" },
  { text: "جربت الشامبو بتاعهم بالروزماري وربنا يبارك، شعري بقى أكثف ومش بيتكسر", name: "نور الهدى" },
  { text: "الصابون المغربي ده غير حياتي! بشرتي بقت ناعمة وصافية من أول استخدام", name: "سارة خالد" },
  { text: "جربت كتير أنواع زيت زيتون بس ده الأحسن. لونه ذهبي وطعمه أصيل جداً", name: "كريم عبدالله" },
  { text: "السيرم بتاعهم معمول من مكونات طبيعية وحسيت بفرق واضح في بشرتي بعد أسبوع", name: "هدير مصطفى" },
  { text: "البلسم من مطروح أوليفي حاجة تحفة، شعري بقى ناعم جداً ولامع", name: "دينا مصطفى" },
];

const CATS = [
  { slug: "زيت-الزيتون",     title: "زيت الزيتون",     desc: "زيت بكر ممتاز",           bg: G,  icon: "fa-wine-bottle" },
  { slug: "العنايه-بالبشره", title: "العناية بالبشرة",  desc: "منتجات طبيعية للبشرة",    bg: AU, icon: "fa-spa" },
  { slug: "العنايه-بالشعر",  title: "العناية بالشعر",   desc: "زيوت وتركيبات للشعر",     bg: GD, icon: "fa-leaf" },
  { slug: "الزيوت-الطبيعيه", title: "الزيوت الطبيعية",  desc: "زيوت طبيعية 100%",        bg: "#5a8a3a", icon: "fa-oil-can" },
  { slug: "منتجات-اخري",     title: "منتجات أخرى",      desc: "مجموعة متنوعة",            bg: "#7a5e28", icon: "fa-box-open" },
  { slug: "مخللات",           title: "المخللات",          desc: "مخللات طبيعية طازجة",     bg: "#2d5018", icon: "fa-jar" },
];

function getImg(p: Product): string {
  const img = p.main_image || (p.images && p.images[0]);
  if (!img) return `https://placehold.co/400x400/4f7032/d7f7b3?text=${encodeURIComponent((p.name_ar || p.name_en).slice(0, 4))}`;
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  return img;
}

/* hook: observe when element enters viewport */
function useVisible(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, vis };
}

export default function HomePage() {
  const [currentReview, setCurrentReview]   = useState(0);
  const [allReviews, setAllReviews]         = useState(REVIEWS);
  const [showForm, setShowForm]             = useState(false);
  const [newReview, setNewReview]           = useState({ text: "", name: "" });
  const [submitted, setSubmitted]           = useState(false);
  const [bestSellers, setBestSellers]       = useState<Product[]>([]);
  const [addedId, setAddedId]               = useState<string | null>(null);
  const [tickerPaused, setTickerPaused]     = useState(false);

  const stats  = useVisible();
  const cats   = useVisible(0.08);
  const bsec   = useVisible(0.05);
  const about  = useVisible(0.1);
  const rvw    = useVisible(0.1);

  useEffect(() => {
    (async () => {
      try {
        // try best-sellers collection first
        let r = await fetch(`${API_BASE}/products?collection=${encodeURIComponent("الا-كثر-مبيعا")}&is_active=true&limit=12`);
        let d = await r.json();
        let prods: Product[] = d.products || [];
        // fallback to all active products
        if (prods.length < 3) {
          r = await fetch(`${API_BASE}/products?is_active=true&limit=12`);
          d = await r.json();
          prods = d.products || [];
        }
        setBestSellers(prods);
      } catch {}
    })();
    const t = setInterval(() => setCurrentReview(i => (i + 1) % allReviews.length), 5000);
    return () => clearInterval(t);
  }, []);

  const addToCart = (p: Product) => {
    const item: CartItem = {
      product: { id: p.id, name_ar: p.name_ar || p.name_en, name_en: p.name_en, price: p.price, image_url: getImg(p) },
      qty: 1, size: "One Size",
    };
    try {
      const saved = localStorage.getItem("cart");
      let cart: CartItem[] = saved ? JSON.parse(saved) : [];
      const idx = cart.findIndex(i => i.product.id === p.id);
      cart = idx >= 0 ? cart.map((x, i) => i === idx ? { ...x, qty: Math.min(10, x.qty + 1) } : x) : [...cart, item];
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
      setAddedId(p.id);
      setTimeout(() => setAddedId(null), 1500);
    } catch {}
  };

  /* ticker: duplicate so loop is seamless */
  const ticker = bestSellers.length > 0 ? [...bestSellers, ...bestSellers, ...bestSellers] : [];
  const tickerDur = Math.max(bestSellers.length * 4, 20);

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&family=Cairo:wght@300;400;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        * { font-family: 'Cairo', sans-serif; }
        h1,h2,h3,h4,h5,h6 { font-family: 'Readex Pro', 'Cairo', sans-serif; }

        /* ── keyframes ── */
        @keyframes fadeUp   { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes slideR   { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideL   { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
        @keyframes ticker   { 0%{transform:translateX(0)} 100%{transform:translateX(-33.333%)} }
        @keyframes pulse-dot { 0%,100%{transform:scale(1)} 50%{transform:scale(1.6)} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

        /* ── section entrance ── */
        .anim-up   { opacity:0; transform:translateY(36px); transition:opacity .65s cubic-bezier(.23,1,.32,1), transform .65s cubic-bezier(.23,1,.32,1); }
        .anim-up.vis { opacity:1; transform:translateY(0); }
        .anim-r    { opacity:0; transform:translateX(36px); transition:opacity .6s ease, transform .6s ease; }
        .anim-r.vis { opacity:1; transform:translateX(0); }
        .anim-l    { opacity:0; transform:translateX(-36px); transition:opacity .6s ease, transform .6s ease; }
        .anim-l.vis { opacity:1; transform:translateX(0); }
        .anim-scale { opacity:0; transform:scale(.9); transition:opacity .5s ease, transform .5s ease; }
        .anim-scale.vis { opacity:1; transform:scale(1); }

        /* ── category cards ── */
        .cat-card { transition: transform .32s cubic-bezier(.23,1,.32,1), box-shadow .32s; }
        .cat-card:hover { transform: translateY(-10px) scale(1.04) !important; box-shadow: 0 22px 52px rgba(0,0,0,0.22) !important; }
        .cat-card .cat-ico { transition: transform .32s; }
        .cat-card:hover .cat-ico { transform: scale(1.18) rotate(-5deg); }

        /* ── product cards ── */
        .prod-card { transition: transform .28s ease, box-shadow .28s ease; }
        .prod-card:hover { transform: translateY(-7px) !important; box-shadow: 0 18px 42px rgba(79,112,50,0.22) !important; }
        .prod-img  { transition: transform .45s ease; }
        .prod-card:hover .prod-img { transform: scale(1.08); }

        /* ── ticker ── */
        .ticker-wrap { overflow: hidden; position: relative; }
        .ticker-wrap::before,
        .ticker-wrap::after {
          content:''; position:absolute; top:0; bottom:0; width:80px; z-index:2; pointer-events:none;
        }
        .ticker-wrap::before { right:0; background:linear-gradient(to left, ${CB}, transparent); }
        .ticker-wrap::after  { left:0; background:linear-gradient(to right, ${CB}, transparent); }
        .ticker-inner {
          display:flex; gap:20px; width:max-content;
          animation: ticker ${tickerDur}s linear infinite;
        }
        .ticker-inner.paused { animation-play-state: paused; }

        /* ── buttons ── */
        .btn-primary { transition: background .2s, transform .15s, box-shadow .2s; }
        .btn-primary:hover { background: ${GD} !important; transform: translateY(-2px); box-shadow: 0 8px 22px rgba(79,112,50,0.38) !important; }
        .btn-gold { transition: background .2s, transform .15s, box-shadow .2s; }
        .btn-gold:hover { background: #9e7d3a !important; transform: translateY(-2px); box-shadow: 0 8px 22px rgba(189,154,82,0.45) !important; }
        .btn-outline { transition: all .2s; }
        .btn-outline:hover { background: ${G} !important; color: #fff !important; transform: translateY(-2px); }

        /* ── review card ── */
        .rev-card { transition: transform .3s, box-shadow .3s; }
        .rev-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(79,112,50,0.14) !important; }

        @media (max-width: 1100px) { .cat-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 640px) {
          .cat-grid { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
          .about-flex { flex-direction: column !important; text-align: center !important; }
          .about-img { width: 130px !important; height: 130px !important; }
          .hero-cta { bottom: 8% !important; right: 50% !important; transform: translateX(50%) !important; }
          .stats-row { gap: 8px !important; }
        }
      `}</style>

      {/* ════════════════ HERO ════════════════ */}
      <section style={{ position: "relative", lineHeight: 0, overflow: "hidden" }}>
        <img src={HERO_BANNER} alt="مطروح أوليفي"
          style={{ width: "100%", display: "block", maxHeight: 620, objectFit: "cover", objectPosition: "center top" }} />
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(105deg, rgba(45,43,39,.5) 0%, rgba(45,43,39,.1) 55%, transparent 100%)" }} />
        <div className="hero-cta" style={{ position: "absolute", bottom: "14%", right: "7%", animation: "fadeUp .9s ease .3s both" }}>
          <Link href="/shop" className="btn-gold"
            style={{ display: "inline-block", background: AU, color: "#fff", padding: "14px 44px", borderRadius: 50,
              textDecoration: "none", fontWeight: 800, fontSize: 16, letterSpacing: .5,
              boxShadow: "0 8px 28px rgba(189,154,82,.55)", fontFamily: "'Readex Pro','Cairo',sans-serif" }}>
            تسوق الآن
          </Link>
        </div>
      </section>

      {/* ════════════════ STATS ════════════════ */}
      <section style={{ background: `linear-gradient(135deg, ${GD} 0%, ${G} 100%)`, padding: "22px 24px" }}>
        <div ref={stats.ref} className={`stats-row anim-up${stats.vis ? " vis" : ""}`}
          style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20, direction: "rtl" }}>
          {[
            { icon: "fa-seedling",  num: "100%",      label: "طبيعي نقي" },
            { icon: "fa-users",     num: "+10,000",   label: "عميل سعيد" },
            { icon: "fa-award",     num: "بكر ممتاز", label: "أعلى درجة جودة" },
            { icon: "fa-truck",     num: "سريع",      label: "توصيل لكل محافظة" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              animation: stats.vis ? `fadeUp .5s ease ${i * .1}s both` : "none", opacity: stats.vis ? 1 : 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(215,247,179,.18)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className={`fas ${s.icon}`} style={{ fontSize: 18, color: GL }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: AU, fontFamily: "'Readex Pro','Cairo',sans-serif" }}>{s.num}</div>
              <div style={{ fontSize: 12, color: "#c8e6a0" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ CATEGORIES ════════════════ */}
      <section style={{ background: CB, padding: "68px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", direction: "rtl" }}>
          <div style={{ textAlign: "center", marginBottom: 52, animation: "fadeUp .6s ease .1s both" }}>
            <span style={{ display: "inline-block", background: GL, color: G, fontWeight: 800, fontSize: 11,
              letterSpacing: 3, padding: "5px 20px", borderRadius: 20, marginBottom: 14 }}>تسوق حسب القسم</span>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: DK, margin: 0 }}>منتجات مطروح أوليفي</h2>
          </div>

          <div ref={cats.ref} className="cat-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 18 }}>
            {CATS.map((cat, i) => (
              <Link key={i} href={`/shop?collection=${cat.slug}`} className="cat-card"
                style={{
                  borderRadius: 20, overflow: "hidden", textDecoration: "none", display: "flex", flexDirection: "column",
                  boxShadow: "0 6px 22px rgba(0,0,0,.09)",
                  opacity: cats.vis ? 1 : 0,
                  transform: cats.vis ? "translateY(0) scale(1)" : "translateY(44px) scale(.94)",
                  transition: `opacity .55s ease ${i * .08}s, transform .55s cubic-bezier(.23,1,.32,1) ${i * .08}s`,
                }}>
                <div style={{ background: cat.bg, padding: "28px 12px 22px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="cat-ico" style={{ width: 58, height: 58, borderRadius: "50%", background: "rgba(255,255,255,.18)",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <i className={`fas ${cat.icon}`} style={{ fontSize: 24, color: "#fff" }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "center" }}>{cat.title}</h3>
                </div>
                <div style={{ background: "#fff", padding: "12px 12px 16px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#6a8a5a", lineHeight: 1.6, textAlign: "center" }}>{cat.desc}</p>
                  <span style={{ fontSize: 11, fontWeight: 800, color: G, marginTop: "auto" }}>تسوق الآن ←</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ BEST SELLERS TICKER ════════════════ */}
      <section ref={bsec.ref} style={{ background: DK, padding: "64px 0",
        opacity: bsec.vis ? 1 : 0, transform: bsec.vis ? "none" : "translateY(40px)",
        transition: "opacity .7s ease, transform .7s ease" }}>

        {/* heading */}
        <div style={{ textAlign: "center", marginBottom: 40, padding: "0 20px", direction: "rtl",
          animation: bsec.vis ? "fadeUp .6s ease .1s both" : "none" }}>
          <span style={{ display: "inline-block", background: "rgba(215,247,179,.15)", color: GL,
            fontWeight: 800, fontSize: 11, letterSpacing: 3, padding: "5px 20px", borderRadius: 20, marginBottom: 14 }}>
            المنتجات المميزة
          </span>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: "#fff", margin: 0 }}>الأكثر مبيعاً</h2>
        </div>

        {/* ticker */}
        {ticker.length > 0 ? (
          <div className="ticker-wrap"
            onMouseEnter={() => setTickerPaused(true)}
            onMouseLeave={() => setTickerPaused(false)}>
            <div className={`ticker-inner${tickerPaused ? " paused" : ""}`}
              style={{ '--dur': `${tickerDur}s` } as any}>
              {ticker.map((p, i) => {
                const img = getImg(p);
                const name = p.name_ar || p.name_en;
                const hasDisc = p.old_price && p.old_price > p.price;
                const disc = hasDisc ? Math.round((1 - p.price / p.old_price!) * 100) : 0;
                const isAdded = addedId === p.id + i;
                return (
                  <div key={i} className="prod-card"
                    style={{ width: 260, flexShrink: 0, background: "#fff", borderRadius: 20, overflow: "hidden",
                      boxShadow: "0 4px 18px rgba(0,0,0,.18)" }}>
                    <Link href={`/products/${p.id}`} style={{ textDecoration: "none", display: "block" }}>
                      <div style={{ position: "relative", height: 200, overflow: "hidden", background: CB }}>
                        <img className="prod-img" src={img} alt={name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy"
                          onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/4f7032/d7f7b3?text=${encodeURIComponent(name.slice(0,4))}`; }} />
                        {hasDisc && (
                          <span style={{ position: "absolute", top: 10, right: 10, background: "#ef4444",
                            color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                            -{disc}%
                          </span>
                        )}
                      </div>
                      <div style={{ padding: "14px 14px 8px", direction: "rtl" }}>
                        <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: DK, lineHeight: 1.4,
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          overflow: "hidden", minHeight: 38 } as any}>{name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: G }}>{p.price} ج.م</span>
                          {hasDisc && <span style={{ fontSize: 12, color: "#aaa", textDecoration: "line-through" }}>{p.old_price} ج.م</span>}
                        </div>
                      </div>
                    </Link>
                    <div style={{ padding: "0 14px 14px" }}>
                      <button onClick={() => { setAddedId(p.id + i); addToCart(p); setTimeout(() => setAddedId(null), 1500); }}
                        className="btn-primary"
                        style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: "none",
                          background: isAdded ? "#22c55e" : G, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                        {isAdded ? "تمت الإضافة" : "أضف للسلة"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* loading skeleton */
          <div style={{ display: "flex", gap: 20, padding: "0 40px", overflow: "hidden" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ width: 260, flexShrink: 0, height: 320, borderRadius: 20,
                background: "rgba(255,255,255,.08)", animation: "fadeIn 1s ease infinite alternate" }} />
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 44, padding: "0 20px" }}>
          <Link href="/shop" className="btn-outline"
            style={{ display: "inline-block", padding: "13px 48px", borderRadius: 50,
              border: `2px solid ${GL}`, color: GL, fontWeight: 800, fontSize: 15,
              textDecoration: "none", fontFamily: "'Readex Pro','Cairo',sans-serif" }}>
            عرض كل المنتجات
          </Link>
        </div>
      </section>

      {/* ════════════════ ABOUT ════════════════ */}
      <section style={{ background: `linear-gradient(135deg, ${GL} 0%, #dde8c4 100%)`, padding: "68px 20px" }}>
        <div ref={about.ref} className="about-flex"
          style={{ maxWidth: 920, margin: "0 auto", display: "flex", alignItems: "center", gap: 52, direction: "rtl" }}>
          <div className={`about-img anim-r${about.vis ? " vis" : ""}`}
            style={{ flex: "0 0 auto", width: 190, height: 190, background: CB, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `4px solid ${AU}`, overflow: "hidden", boxShadow: "0 8px 32px rgba(189,154,82,.3)",
              animation: about.vis ? "float 4s ease-in-out infinite" : "none" }}>
            <img src={LOGO} alt="مطروح أوليفي" style={{ width: "88%", height: "88%", objectFit: "contain" }} />
          </div>
          <div className={`anim-l${about.vis ? " vis" : ""}`} style={{ flex: 1 }}>
            <span style={{ display: "inline-block", background: G, color: "#fff", fontWeight: 800,
              fontSize: 11, letterSpacing: 3, padding: "4px 16px", borderRadius: 20, marginBottom: 16 }}>قصتنا</span>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: DK, margin: "0 0 16px" }}>مطروح أوليفي</h2>
            <p style={{ fontSize: 15, color: "#5a7050", lineHeight: 2, marginBottom: 24 }}>
              نحن شركة متخصصة في تقديم أجود أنواع زيت الزيتون الطبيعي من مطروح. شعارنا الدائم{" "}
              <strong style={{ color: G }}>صدق .. أمانة .. خبرة</strong>، ونسعى دائماً لأن نخلق لك من الطبيعة حياة أفضل.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["صدق", "أمانة", "خبرة", "جودة"].map((tag, i) => (
                <span key={tag} style={{ padding: "7px 22px", borderRadius: 50, background: CB, color: G,
                  fontSize: 13, fontWeight: 800, border: `2px solid ${G}`,
                  animation: about.vis ? `fadeUp .5s ease ${i * .1 + .3}s both` : "none", opacity: about.vis ? 1 : 0 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ REVIEWS ════════════════ */}
      <section style={{ background: CB, padding: "68px 20px" }}>
        <div ref={rvw.ref} style={{ maxWidth: 1200, margin: "0 auto", direction: "rtl" }}>
          <div className={`anim-up${rvw.vis ? " vis" : ""}`} style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ display: "inline-block", background: GL, color: G, fontWeight: 800,
              fontSize: 11, letterSpacing: 3, padding: "5px 20px", borderRadius: 20, marginBottom: 14 }}>آراء العملاء</span>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: DK, margin: 0 }}>ماذا يقول عملاؤنا</h2>
          </div>

          {/* reviews grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, marginBottom: 40 }}>
            {allReviews.slice(0, 6).map((r, i) => (
              <div key={i} className={`rev-card anim-up${rvw.vis ? " vis" : ""}`}
                style={{ background: "#fff", borderRadius: 20, padding: "24px 20px",
                  boxShadow: "0 4px 16px rgba(79,112,50,.08)", border: `1px solid ${GL}`,
                  transition: `opacity .55s ease ${i * .08}s, transform .55s ease ${i * .08}s`,
                  opacity: rvw.vis ? 1 : 0, transform: rvw.vis ? "translateY(0)" : "translateY(28px)" }}>
                <div style={{ color: AU, fontSize: 16, letterSpacing: 3, marginBottom: 12 }}>★★★★★</div>
                <p style={{ fontSize: 14, color: "#4a5a3a", lineHeight: 1.8, margin: "0 0 16px", fontStyle: "italic" }}>"{r.text}"</p>
                <div style={{ fontSize: 13, color: G, fontWeight: 800 }}>— {r.name}</div>
              </div>
            ))}
          </div>

          {/* add review */}
          <div className={`anim-up${rvw.vis ? " vis" : ""}`} style={{ textAlign: "center" }}>
            {submitted && (
              <div style={{ marginBottom: 16, padding: "10px 24px", borderRadius: 12, background: "#dcfce7",
                color: "#166534", fontWeight: 700, display: "inline-block" }}>تمت إضافة تقييمك</div>
            )}
            <button onClick={() => setShowForm(!showForm)} className="btn-outline"
              style={{ padding: "12px 36px", borderRadius: 50, border: `2px solid ${G}`,
                background: showForm ? G : "transparent", color: showForm ? "#fff" : G,
                fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "'Cairo',sans-serif" }}>
              أضف تقييمك
            </button>
            {showForm && (
              <div style={{ maxWidth: 440, margin: "20px auto 0", padding: 28, borderRadius: 20,
                border: `1px solid ${GL}`, background: "#fff", boxShadow: "0 4px 24px rgba(79,112,50,.1)",
                direction: "rtl", animation: "fadeUp .3s ease both" }}>
                <textarea value={newReview.text} onChange={e => setNewReview(p => ({ ...p, text: e.target.value }))}
                  placeholder="شاركنا تجربتك..." rows={3}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${GL}`,
                    fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
                <input value={newReview.name} onChange={e => setNewReview(p => ({ ...p, name: e.target.value }))}
                  placeholder="اسمك"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${GL}`,
                    fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
                <button onClick={() => {
                  if (!newReview.text.trim() || !newReview.name.trim()) return;
                  setAllReviews(prev => [{ text: newReview.text, name: newReview.name }, ...prev]);
                  setNewReview({ text: "", name: "" }); setSubmitted(true); setShowForm(false);
                  setTimeout(() => setSubmitted(false), 3000);
                }} className="btn-primary"
                  style={{ width: "100%", padding: 13, borderRadius: 12, border: "none",
                    background: G, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 15 }}>
                  إرسال التقييم
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════ FLOATING BUTTONS ════════════════ */}
      <div style={{ position: "fixed", bottom: 28, left: 28, display: "flex", flexDirection: "column", gap: 12, zIndex: 999 }}>
        <a href="https://wa.me/201229555229" target="_blank" rel="noreferrer"
          style={{ width: 56, height: 56, borderRadius: "50%", background: "#25D366", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 18px rgba(37,211,102,.5)", fontSize: 26, transition: "transform .2s",
            textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.14)"}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"}>
          <i className="fab fa-whatsapp" />
        </a>
        <a href="tel:+201229555229"
          style={{ width: 56, height: 56, borderRadius: "50%", background: G, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 18px rgba(79,112,50,.5)`, fontSize: 22, transition: "transform .2s",
            textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.14)"}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"}>
          <i className="fas fa-phone" />
        </a>
      </div>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer style={{ background: DK, borderTop: `4px solid ${AU}`, padding: "52px 24px 28px", direction: "rtl" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 36, marginBottom: 40 }}>

            <div>
              <img src={LOGO} alt="مطروح أوليفي" style={{ height: 70, marginBottom: 16, display: "block" }} />
              <p style={{ fontSize: 13, lineHeight: 2, color: "#7a9a6a", margin: "0 0 18px" }}>نخلق لك من الطبيعة حياة أفضل.</p>
              <div style={{ display: "flex", gap: 8 }}>
                {["fa-facebook-f","fa-instagram","fa-whatsapp"].map(ic => (
                  <a key={ic} href="#" style={{ width: 36, height: 36, borderRadius: "50%", background: "#3d4a2a",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                    textDecoration: "none", color: "#7a9a6a", transition: "background .2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = G}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "#3d4a2a"}>
                    <i className={`fab ${ic}`} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, letterSpacing: 3, color: AU, marginBottom: 18 }}>المتجر</p>
              {[["الرئيسية","/"],["جميع المنتجات","/shop"],["العروض","/shop?collection=offers"]].map(([l,h]) => (
                <a key={h} href={h} style={{ display: "block", fontSize: 14, color: "#7a9a6a", textDecoration: "none", marginBottom: 10, transition: "color .2s" }}
                  onMouseEnter={e => (e.target as HTMLAnchorElement).style.color = GL}
                  onMouseLeave={e => (e.target as HTMLAnchorElement).style.color = "#7a9a6a"}>{l}</a>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 11, letterSpacing: 3, color: AU, marginBottom: 18 }}>مساعدة</p>
              {[["الشحن والتوصيل","/shipping"],["اتصل بنا","/contact"]].map(([l,h]) => (
                <a key={h} href={h} style={{ display: "block", fontSize: 14, color: "#7a9a6a", textDecoration: "none", marginBottom: 10, transition: "color .2s" }}
                  onMouseEnter={e => (e.target as HTMLAnchorElement).style.color = GL}
                  onMouseLeave={e => (e.target as HTMLAnchorElement).style.color = "#7a9a6a"}>{l}</a>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 11, letterSpacing: 3, color: AU, marginBottom: 18 }}>تواصل معنا</p>
              <p style={{ fontSize: 14, color: "#7a9a6a", marginBottom: 14, fontWeight: 600 }}>01229555229</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="https://wa.me/201229555229" target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 10, background: "#25D366",
                    color: "#fff", textDecoration: "none", padding: "10px 16px", borderRadius: 12,
                    fontSize: 14, fontWeight: 700, transition: "opacity .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = ".85"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "1"}>
                  <i className="fab fa-whatsapp" style={{ fontSize: 20 }} /> واتساب
                </a>
                <a href="tel:+201229555229"
                  style={{ display: "flex", alignItems: "center", gap: 10, background: "#3d4a2a",
                    color: "#7a9a6a", textDecoration: "none", padding: "10px 16px", borderRadius: 12,
                    fontSize: 14, fontWeight: 700, border: "1px solid #4a6030", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = G; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#3d4a2a"; (e.currentTarget as HTMLAnchorElement).style.color = "#7a9a6a"; }}>
                  <i className="fas fa-phone" style={{ fontSize: 16 }} /> اتصل بنا
                </a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #3d4a2a", paddingTop: 22,
            display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#5a7050" }}>© 2026 مطروح أوليفي — صدق .. أمانة .. خبرة</p>
            <p style={{ margin: 0, fontSize: 12, color: "#5a7050" }}>الدفع عند الاستلام</p>
          </div>
        </div>
      </footer>
    </>
  );
}
