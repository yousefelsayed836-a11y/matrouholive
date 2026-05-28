"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const HERO_BANNER = "https://assets.wuiltstore.com/cmesintt84hgm01ksersa5djl_1.png";
const LOGO      = "https://assets.wuiltstore.com/cm5tcbuy002ue01n3dqyt5fy9_IMG_5462.png";
const API_BASE  = (process.env.NEXT_PUBLIC_API_URL || "https://api.matrouholive.com") + "/api";

const G  = "#4f7032";
const GD = "#3d5828";
const GL = "#d7f7b3";
const CB = "#f1f7c9";
const AU = "#bd9a52";
const DK = "#2d2b27";

interface Product {
  id: string; name_en: string; name_ar?: string;
  price: number; old_price?: number;
  images?: string[]; main_image?: string;
}
interface CartItem {
  product: { id: string; name_ar: string; name_en: string; price: number; image_url?: string };
  qty: number; size: string;
}
interface Review { id?: number; name: string; text: string; stars?: number; }
interface HeroSlide { id: string; desktop: string; mobile?: string; show: "both" | "desktop" | "mobile"; }

const FALLBACK_REVIEWS: Review[] = [
  { name: "أحمد محمود",  text: "والله زيت الزيتون بتاعهم تحفة! ريحته حلوة جداً والطعم أصلي" },
  { name: "فاطمة علي",   text: "اشتريت منهم زجاجة تجربة وعجبتني جداً، دلوقتي بطلب كميات كبيرة" },
  { name: "محمود سامي",  text: "زيت مطروح ده فعلاً له طعم مختلف عن أي زيت تاني" },
  { name: "نور الهدى",   text: "جربت الشامبو بتاعهم بالروزماري وربنا يبارك، شعري بقى أكثف" },
  { name: "سارة خالد",   text: "الصابون المغربي ده غير حياتي! بشرتي بقت ناعمة وصافية" },
  { name: "كريم عبدالله", text: "جربت كتير أنواع زيت زيتون بس ده الأحسن لحد دلوقتي" },
];

const CATS = [
  { slug: "زيت-الزيتون",     title: "زيت الزيتون",     desc: "زيت بكر ممتاز",          bg: G,         icon: "fa-wine-bottle" },
  { slug: "العنايه-بالبشره", title: "العناية بالبشرة",  desc: "منتجات طبيعية للبشرة",   bg: AU,        icon: "fa-spa" },
  { slug: "العنايه-بالشعر",  title: "العناية بالشعر",   desc: "زيوت وتركيبات للشعر",    bg: GD,        icon: "fa-leaf" },
  { slug: "الزيوت-الطبيعيه", title: "الزيوت الطبيعية",  desc: "زيوت طبيعية 100%",       bg: "#5a8a3a", icon: "fa-oil-can" },
  { slug: "منتجات-اخري",     title: "منتجات أخرى",      desc: "مجموعة متنوعة",           bg: "#7a5e28", icon: "fa-box-open" },
  { slug: "مخللات",           title: "المخللات",          desc: "مخللات طبيعية طازجة",    bg: "#2d5018", icon: "fa-jar" },
];

function getImg(p: Product): string {
  const img = p.main_image || (p.images && p.images[0]);
  if (!img) return `https://placehold.co/400x400/4f7032/d7f7b3?text=${encodeURIComponent((p.name_ar || p.name_en).slice(0, 4))}`;
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  return img;
}

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

/* card width + gap for the bestsellers scroller */
const CARD_W = 270;
const CARD_GAP = 20;

export default function HomePage() {
  const [siteSettings, setSiteSettings] = useState({ name:"مطروح أوليفي", whatsapp:"", address:"", announcement:"" });
  const [heroSlides, setHeroSlides]     = useState<HeroSlide[]>([{ id: "default", desktop: HERO_BANNER, show: "both" }]);
  const [isMobile, setIsMobile]         = useState(false);
  const [heroIdx, setHeroIdx]           = useState(0);
  const [heroAnim, setHeroAnim]         = useState(true);
  const [bestSellers, setBestSellers]   = useState<Product[]>([]);
  const [addedId, setAddedId]           = useState<string | null>(null);
  const [scrollIdx, setScrollIdx]       = useState(0);        // current first visible card

  const [reviews, setReviews]           = useState<Review[]>(FALLBACK_REVIEWS);
  const [currentRev, setCurrentRev]     = useState(0);
  const [showForm, setShowForm]         = useState(false);
  const [newReview, setNewReview]       = useState({ text: "", name: "" });
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [revAnim, setRevAnim]           = useState(true);     // fade trigger

  const scrollRef = useRef<HTMLDivElement>(null);
  const stats  = useVisible();
  const cats   = useVisible(0.08);
  const bsec   = useVisible(0.05);
  const about  = useVisible(0.1);
  const rvw    = useVisible(0.1);

  /* fetch products + reviews + hero slides on mount */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/settings/hero_slides`);
        const d = await r.json();
        if (d.value) {
          const slides: HeroSlide[] = JSON.parse(d.value);
          if (slides.length > 0) setHeroSlides(slides);
        }
      } catch {}
    })();

    (async () => {
      try {
        const r = await fetch(`${API_BASE}/settings/site_settings`);
        const d = await r.json();
        if (d.value) setSiteSettings(s => ({ ...s, ...JSON.parse(d.value) }));
      } catch {}
    })();

    (async () => {
      try {
        let r = await fetch(`${API_BASE}/products?collection=${encodeURIComponent("الا-كثر-مبيعا")}&is_active=true&limit=12`);
        let d = await r.json();
        let prods: Product[] = d.products || [];
        if (prods.length < 3) {
          r = await fetch(`${API_BASE}/products?is_active=true&limit=12`);
          d = await r.json();
          prods = d.products || [];
        }
        setBestSellers(prods);
      } catch {}
    })();

    (async () => {
      try {
        const r = await fetch(`${API_BASE}/reviews`);
        const d = await r.json();
        if (d.reviews?.length) setReviews(d.reviews);
      } catch {}
    })();
  }, []);

  /* detect mobile for hero slide filtering */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* hero advances only on manual tap — no auto-advance */

  /* auto-advance review every 5s */
  useEffect(() => {
    const t = setInterval(() => {
      setRevAnim(false);
      setTimeout(() => {
        setCurrentRev(i => (i + 1) % reviews.length);
        setRevAnim(true);
      }, 300);
    }, 5000);
    return () => clearInterval(t);
  }, [reviews.length]);

  /* scroll bestsellers carousel */
  /* slides visible on current device */
  const visibleSlides = heroSlides.filter(s => isMobile ? s.show !== "desktop" : s.show !== "mobile");
  const heroTotal = visibleSlides.length;
  const safeHeroIdx = heroTotal > 0 ? heroIdx % heroTotal : 0;

  const goHeroNext = () => {
    if (heroTotal <= 1) return;
    setHeroAnim(false);
    setTimeout(() => { setHeroIdx(i => (i + 1) % heroTotal); setHeroAnim(true); }, 300);
  };

  const visibleCards = typeof window !== "undefined" ? Math.floor((window.innerWidth - 80) / (CARD_W + CARD_GAP)) || 2 : 4;
  const maxIdx = Math.max(0, bestSellers.length - visibleCards);

  const scrollTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, maxIdx));
    setScrollIdx(clamped);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: clamped * (CARD_W + CARD_GAP), behavior: "smooth" });
    }
  };

  /* sync scrollIdx when user manually scrolls */
  const onScroll = () => {
    if (scrollRef.current) {
      const idx = Math.round(scrollRef.current.scrollLeft / (CARD_W + CARD_GAP));
      setScrollIdx(idx);
    }
  };

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
      setAddedId(p.id); setTimeout(() => setAddedId(null), 1500);
    } catch {}
  };

  const submitReview = async () => {
    if (!newReview.text.trim() || !newReview.name.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newReview.name.trim(), text: newReview.text.trim(), stars: 5 }),
      });
      const d = await r.json();
      if (d.reviews?.length) {
        setReviews(d.reviews);
        setCurrentRev(0); // jump to the new review (first = latest)
      } else {
        setReviews(prev => [{ name: newReview.name, text: newReview.text, stars: 5 }, ...prev]);
        setCurrentRev(0);
      }
      setNewReview({ text: "", name: "" });
      setSubmitted(true); setShowForm(false);
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      // optimistic fallback
      setReviews(prev => [{ name: newReview.name, text: newReview.text, stars: 5 }, ...prev]);
      setCurrentRev(0);
      setNewReview({ text: "", name: "" }); setShowForm(false);
    } finally { setSubmitting(false); }
  };

  const goReview = (dir: 1 | -1) => {
    setRevAnim(false);
    setTimeout(() => {
      setCurrentRev(i => (i + dir + reviews.length) % reviews.length);
      setRevAnim(true);
    }, 200);
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&family=Cairo:wght@300;400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        * { font-family: 'Cairo', sans-serif; }
        h1,h2,h3,h4,h5,h6 { font-family: 'Readex Pro','Cairo',sans-serif; }

        @keyframes fadeUp  { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes revFade { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }

        .anim-up  { opacity:0;transform:translateY(32px);transition:opacity .65s cubic-bezier(.23,1,.32,1),transform .65s cubic-bezier(.23,1,.32,1); }
        .anim-up.vis { opacity:1;transform:translateY(0); }
        .anim-r   { opacity:0;transform:translateX(32px);transition:opacity .6s ease,transform .6s ease; }
        .anim-r.vis { opacity:1;transform:translateX(0); }
        .anim-l   { opacity:0;transform:translateX(-32px);transition:opacity .6s ease,transform .6s ease; }
        .anim-l.vis { opacity:1;transform:translateX(0); }

        .cat-card { transition:transform .32s cubic-bezier(.23,1,.32,1),box-shadow .32s; }
        .cat-card:hover { transform:translateY(-10px) scale(1.04)!important;box-shadow:0 22px 52px rgba(0,0,0,.22)!important; }
        .cat-card .cat-ico { transition:transform .32s; }
        .cat-card:hover .cat-ico { transform:scale(1.18) rotate(-5deg); }

        .prod-card { transition:transform .25s ease,box-shadow .25s ease; }
        .prod-card:hover { transform:translateY(-6px)!important;box-shadow:0 16px 38px rgba(79,112,50,.2)!important; }
        .prod-img  { transition:transform .42s ease; }
        .prod-card:hover .prod-img { transform:scale(1.08); }

        /* bestsellers scroller */
        .bs-scroll { display:flex;gap:${CARD_GAP}px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:4px; }
        .bs-scroll::-webkit-scrollbar { display:none; }
        .bs-scroll > * { scroll-snap-align:start;flex-shrink:0; }

        /* arrow buttons */
        .arr-btn { width:46px;height:46px;border-radius:50%;border:2px solid rgba(255,255,255,.25);
          background:rgba(255,255,255,.12);color:#fff;font-size:18px;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          transition:background .2s,transform .15s;backdrop-filter:blur(4px); }
        .arr-btn:hover { background:rgba(255,255,255,.28);transform:scale(1.1); }
        .arr-btn:disabled { opacity:.28;cursor:default;transform:none; }

        /* review card */
        .rev-visible { animation:revFade .35s ease both; }

        .btn-primary { transition:background .2s,transform .15s,box-shadow .2s; }
        .btn-primary:hover { background:${GD}!important;transform:translateY(-2px);box-shadow:0 8px 22px rgba(79,112,50,.38)!important; }
        .btn-gold { transition:background .2s,transform .15s,box-shadow .2s; }
        .btn-gold:hover { background:#9e7d3a!important;transform:translateY(-2px);box-shadow:0 8px 22px rgba(189,154,82,.45)!important; }
        .btn-outline { transition:all .2s; }
        .btn-outline:hover { background:${GL}!important;color:${DK}!important;transform:translateY(-2px); }


        /* Stats – desktop */
        .stats-section { padding:26px 24px; }
        .stats-grid { gap:16px; }
        .stat-item { gap:8px; }
        .stat-ico { width:48px;height:48px; }
        .stat-ico i { font-size:20px; }
        .stat-num { font-size:20px; }
        .stat-label { font-size:12px; }

        @media (max-width:1100px) { .cat-grid { grid-template-columns:repeat(3,1fr)!important; } }

        /* Stats – mobile: compact single row */
        @media (max-width:640px) {
          .stats-section { padding:10px 8px; }
          .stats-grid { gap:4px; }
          .stat-item { gap:3px; }
          .stat-ico { width:28px!important;height:28px!important; }
          .stat-ico i { font-size:12px!important; }
          .stat-num { font-size:11px!important; }
          .stat-label { font-size:9px!important; }
        }
        @media (max-width:640px)  {
          .cat-grid { grid-template-columns:repeat(2,1fr)!important;gap:12px!important; }
          .about-flex { flex-direction:column!important;text-align:center!important; }
          .about-img  { width:130px!important;height:130px!important; }
          .hero-cta   { bottom:8%!important;right:50%!important;transform:translateX(50%)!important; }
        }
      `}</style>

      {/* ══ ANNOUNCEMENT BAR ══ */}
      {siteSettings.announcement && (
        <div style={{ background:GD, color:"#fff", textAlign:"center", padding:"9px 20px",
          fontSize:13, fontWeight:600, direction:"rtl", letterSpacing:.3 }}>
          {siteSettings.announcement}
        </div>
      )}

      {/* ══ HERO SLIDESHOW ══ */}
      <section style={{ position:"relative",lineHeight:0,overflow:"hidden",background:"#1a1a1a",
        cursor: heroTotal > 1 ? "pointer" : "default" }}
        onClick={goHeroNext}>
        {visibleSlides.map((slide, i) => {
          const isActive = i === safeHeroIdx;
          return (
            <div key={slide.id} style={{
              position: i === 0 ? "relative" : "absolute",
              inset: 0, lineHeight: 0,
              opacity: isActive ? (heroAnim ? 1 : 0) : 0,
              transition: "opacity .55s ease",
              pointerEvents: "none",
              zIndex: isActive ? 1 : 0,
            }}>
              {/* On mobile: show mobile image if exists, else desktop. On desktop: always desktop */}
              <img
                src={isMobile && slide.mobile ? slide.mobile : slide.desktop}
                alt="مطروح أوليفي"
                style={{ width:"100%", display:"block", maxHeight: isMobile ? 600 : 620,
                  objectFit:"cover", objectPosition:"center top" }}
              />
            </div>
          );
        })}

        {/* Gradient overlay */}
        <div style={{ position:"absolute",inset:0,zIndex:2,
          background:"linear-gradient(105deg,rgba(45,43,39,.52) 0%,rgba(45,43,39,.12) 55%,transparent 100%)",
          pointerEvents:"none" }} />

        {/* Shop Now button */}
        <div className="hero-cta" style={{ position:"absolute",bottom:"14%",right:"7%",zIndex:4,animation:"fadeUp .9s ease .3s both" }}
          onClick={e => e.stopPropagation()}>
          <Link href="/shop" className="btn-gold"
            style={{ display:"inline-block",background:AU,color:"#fff",padding:"14px 44px",borderRadius:50,
              textDecoration:"none",fontWeight:800,fontSize:16,letterSpacing:.5,
              boxShadow:"0 8px 28px rgba(189,154,82,.55)" }}>
            تسوق الآن
          </Link>
        </div>

        {/* Slide dots */}
        {heroTotal > 1 && (
          <div style={{ position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",
            zIndex:4,display:"flex",gap:8 }}
            onClick={e => e.stopPropagation()}>
            {visibleSlides.map((_,i) => (
              <button key={i} onClick={() => { setHeroAnim(false); setTimeout(() => { setHeroIdx(i); setHeroAnim(true); }, 300); }}
                style={{ width: i===safeHeroIdx?24:8, height:8, borderRadius:8, border:"none", cursor:"pointer",
                  background: i===safeHeroIdx ? AU : "rgba(255,255,255,.5)",
                  transition:"width .3s ease,background .3s ease", padding:0 }} />
            ))}
          </div>
        )}
      </section>

      {/* ══ STATS ══ */}
      <section className="stats-section" style={{ background:`linear-gradient(135deg,${GD} 0%,${G} 100%)` }}>
        <div ref={stats.ref} className={`anim-up stats-grid${stats.vis?" vis":""}`}
          style={{ maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(4,1fr)",direction:"rtl" }}>
          {[
            { icon:"fa-seedling", num:"100%",      label:"طبيعي نقي" },
            { icon:"fa-users",    num:"+10,000",   label:"عميل سعيد" },
            { icon:"fa-award",    num:"بكر ممتاز", label:"أعلى درجة جودة" },
            { icon:"fa-truck",    num:"سريع",      label:"توصيل لكل محافظة" },
          ].map((s,i) => (
            <div key={i} className="stat-item" style={{ textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",
              opacity:stats.vis?1:0,animation:stats.vis?`fadeUp .5s ease ${i*.1}s both`:"none" }}>
              <div className="stat-ico" style={{ borderRadius:"50%",background:"rgba(215,247,179,.18)",
                display:"flex",alignItems:"center",justifyContent:"center" }}>
                <i className={`fas ${s.icon}`} style={{ color:GL }} />
              </div>
              <div className="stat-num" style={{ fontWeight:900,color:AU,lineHeight:1.2 }}>{s.num}</div>
              <div className="stat-label" style={{ color:"#c8e6a0",lineHeight:1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CATEGORIES ══ */}
      <section style={{ background:CB,padding:"68px 20px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",direction:"rtl" }}>
          <div style={{ textAlign:"center",marginBottom:52,animation:"fadeUp .6s ease .1s both" }}>
            <span style={{ display:"inline-block",background:GL,color:G,fontWeight:800,fontSize:11,
              letterSpacing:3,padding:"5px 20px",borderRadius:20,marginBottom:14 }}>تسوق حسب القسم</span>
            <h2 style={{ fontSize:32,fontWeight:700,color:DK,margin:0 }}>منتجات مطروح أوليفي</h2>
          </div>
          <div ref={cats.ref} className="cat-grid"
            style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:18 }}>
            {CATS.map((cat,i) => (
              <Link key={i} href={`/shop?collection=${cat.slug}`} className="cat-card"
                style={{ borderRadius:20,overflow:"hidden",textDecoration:"none",display:"flex",flexDirection:"column",
                  boxShadow:"0 6px 22px rgba(0,0,0,.09)",
                  opacity:cats.vis?1:0,
                  transform:cats.vis?"translateY(0) scale(1)":"translateY(44px) scale(.94)",
                  transition:`opacity .55s ease ${i*.08}s,transform .55s cubic-bezier(.23,1,.32,1) ${i*.08}s` }}>
                <div style={{ background:cat.bg,padding:"28px 12px 22px",display:"flex",flexDirection:"column",alignItems:"center" }}>
                  <div className="cat-ico" style={{ width:58,height:58,borderRadius:"50%",background:"rgba(255,255,255,.18)",
                    display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12 }}>
                    <i className={`fas ${cat.icon}`} style={{ fontSize:24,color:"#fff" }} />
                  </div>
                  <h3 style={{ margin:0,fontSize:13,fontWeight:700,color:"#fff",textAlign:"center" }}>{cat.title}</h3>
                </div>
                <div style={{ background:"#fff",padding:"12px 12px 16px",flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
                  <p style={{ margin:0,fontSize:11,color:"#6a8a5a",lineHeight:1.6,textAlign:"center" }}>{cat.desc}</p>
                  <span style={{ fontSize:11,fontWeight:800,color:G,marginTop:"auto" }}>تسوق الآن ←</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BEST SELLERS ══ */}
      <section ref={bsec.ref} style={{ background:DK,padding:"64px 0",
        opacity:bsec.vis?1:0,transform:bsec.vis?"none":"translateY(40px)",transition:"opacity .7s ease,transform .7s ease" }}>

        <div style={{ padding:"0 24px",direction:"rtl",maxWidth:1300,margin:"0 auto" }}>
          {/* heading + arrows */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32,flexWrap:"wrap",gap:12 }}>
            <div style={{ animation:bsec.vis?"fadeUp .6s ease .1s both":"none",opacity:bsec.vis?1:0 }}>
              <span style={{ display:"inline-block",background:"rgba(215,247,179,.15)",color:GL,
                fontWeight:800,fontSize:11,letterSpacing:3,padding:"5px 20px",borderRadius:20,marginBottom:12 }}>
                المنتجات المميزة
              </span>
              <h2 style={{ fontSize:30,fontWeight:700,color:"#fff",margin:0 }}>الأكثر مبيعاً</h2>
            </div>
            {bestSellers.length > 0 && (
              <div style={{ display:"flex",gap:10 }}>
                <button className="arr-btn" onClick={() => scrollTo(scrollIdx + 1)} disabled={scrollIdx >= maxIdx}
                  title="التالي">
                  <i className="fas fa-chevron-left" />
                </button>
                <button className="arr-btn" onClick={() => scrollTo(scrollIdx - 1)} disabled={scrollIdx <= 0}
                  title="السابق">
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            )}
          </div>

          {/* cards row */}
          {bestSellers.length > 0 ? (
            <div ref={scrollRef} className="bs-scroll" onScroll={onScroll}>
              {bestSellers.map((p, i) => {
                const img = getImg(p);
                const name = p.name_ar || p.name_en;
                const hasDisc = p.old_price && p.old_price > p.price;
                const disc = hasDisc ? Math.round((1 - p.price / p.old_price!) * 100) : 0;
                const isAdded = addedId === p.id;
                return (
                  <div key={p.id} className="prod-card"
                    style={{ width:CARD_W,background:"#fff",borderRadius:20,overflow:"hidden",
                      boxShadow:"0 4px 18px rgba(0,0,0,.22)",
                      opacity:bsec.vis?1:0,transform:bsec.vis?"translateY(0)":"translateY(28px)",
                      transition:`opacity .5s ease ${i*.07}s,transform .5s cubic-bezier(.23,1,.32,1) ${i*.07}s` }}>
                    <Link href={`/products/${p.id}`} style={{ textDecoration:"none",display:"block" }}>
                      <div style={{ position:"relative",height:200,overflow:"hidden",background:CB }}>
                        <img className="prod-img" src={img} alt={name}
                          style={{ width:"100%",height:"100%",objectFit:"cover" }} loading="lazy"
                          onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/4f7032/d7f7b3?text=${encodeURIComponent(name.slice(0,4))}`; }} />
                        {hasDisc && <span style={{ position:"absolute",top:10,right:10,background:"#ef4444",
                          color:"#fff",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:800 }}>-{disc}%</span>}
                      </div>
                      <div style={{ padding:"14px 14px 8px",direction:"rtl" }}>
                        <p style={{ margin:"0 0 6px",fontSize:13,fontWeight:700,color:DK,lineHeight:1.4,
                          display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",
                          overflow:"hidden",minHeight:38 } as any}>{name}</p>
                        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <span style={{ fontSize:16,fontWeight:900,color:G }}>{p.price} ج.م</span>
                          {hasDisc && <span style={{ fontSize:12,color:"#aaa",textDecoration:"line-through" }}>{p.old_price} ج.م</span>}
                        </div>
                      </div>
                    </Link>
                    <div style={{ padding:"0 14px 14px" }}>
                      <button onClick={() => addToCart(p)} className="btn-primary"
                        style={{ width:"100%",padding:"9px 0",borderRadius:10,border:"none",
                          background:isAdded?"#22c55e":G,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer" }}>
                        {isAdded?"تمت الإضافة":"أضف للسلة"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display:"flex",gap:20,overflow:"hidden" }}>
              {[...Array(4)].map((_,i) => (
                <div key={i} style={{ width:CARD_W,flexShrink:0,height:300,borderRadius:20,
                  background:"rgba(255,255,255,.07)" }} />
              ))}
            </div>
          )}

          {/* dots */}
          {bestSellers.length > visibleCards && (
            <div style={{ display:"flex",justifyContent:"center",gap:8,marginTop:28 }}>
              {Array.from({ length: maxIdx + 1 }).map((_,i) => (
                <button key={i} onClick={() => scrollTo(i)}
                  style={{ width:i===scrollIdx?24:8,height:8,borderRadius:4,border:"none",cursor:"pointer",padding:0,
                    background:i===scrollIdx?AU:"rgba(255,255,255,.25)",transition:"all .3s" }} />
              ))}
            </div>
          )}

          <div style={{ textAlign:"center",marginTop:40 }}>
            <Link href="/shop" className="btn-outline"
              style={{ display:"inline-block",padding:"13px 48px",borderRadius:50,
                border:`2px solid ${GL}`,color:GL,fontWeight:800,fontSize:15,textDecoration:"none" }}>
              عرض كل المنتجات
            </Link>
          </div>
        </div>
      </section>

      {/* ══ ABOUT ══ */}
      <section style={{ background:`linear-gradient(135deg,${GL} 0%,#dde8c4 100%)`,padding:"68px 20px" }}>
        <div ref={about.ref} className="about-flex"
          style={{ maxWidth:920,margin:"0 auto",display:"flex",alignItems:"center",gap:52,direction:"rtl" }}>
          <div className={`about-img anim-r${about.vis?" vis":""}`}
            style={{ flex:"0 0 auto",width:190,height:190,background:CB,borderRadius:"50%",
              display:"flex",alignItems:"center",justifyContent:"center",
              border:`4px solid ${AU}`,overflow:"hidden",boxShadow:"0 8px 32px rgba(189,154,82,.3)",
              animation:about.vis?"float 4s ease-in-out infinite":"none" }}>
            <img src={LOGO} alt="مطروح أوليفي" style={{ width:"88%",height:"88%",objectFit:"contain" }} />
          </div>
          <div className={`anim-l${about.vis?" vis":""}`} style={{ flex:1 }}>
            <span style={{ display:"inline-block",background:G,color:"#fff",fontWeight:800,
              fontSize:11,letterSpacing:3,padding:"4px 16px",borderRadius:20,marginBottom:16 }}>قصتنا</span>
            <h2 style={{ fontSize:28,fontWeight:700,color:DK,margin:"0 0 16px" }}>مطروح أوليفي</h2>
            <p style={{ fontSize:15,color:"#5a7050",lineHeight:2,marginBottom:24 }}>
              نحن شركة متخصصة في تقديم أجود أنواع زيت الزيتون الطبيعي من مطروح. شعارنا الدائم{" "}
              <strong style={{ color:G }}>صدق .. أمانة .. خبرة</strong>، ونسعى دائماً لأن نخلق لك من الطبيعة حياة أفضل.
            </p>
            <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
              {["صدق","أمانة","خبرة","جودة"].map((tag,i) => (
                <span key={tag} style={{ padding:"7px 22px",borderRadius:50,background:CB,color:G,
                  fontSize:13,fontWeight:800,border:`2px solid ${G}`,
                  opacity:about.vis?1:0,animation:about.vis?`fadeUp .5s ease ${i*.1+.3}s both`:"none" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ REVIEWS ══ */}
      <section style={{ background:CB,padding:"68px 20px" }}>
        <div ref={rvw.ref} style={{ maxWidth:700,margin:"0 auto",direction:"rtl" }}>
          <div className={`anim-up${rvw.vis?" vis":""}`} style={{ textAlign:"center",marginBottom:44 }}>
            <span style={{ display:"inline-block",background:GL,color:G,fontWeight:800,
              fontSize:11,letterSpacing:3,padding:"5px 20px",borderRadius:20,marginBottom:14 }}>آراء العملاء</span>
            <h2 style={{ fontSize:32,fontWeight:700,color:DK,margin:0 }}>ماذا يقول عملاؤنا</h2>
          </div>

          {/* single review card */}
          <div className={`anim-up${rvw.vis?" vis":""}`} style={{ position:"relative" }}>
            <div key={currentRev} className={revAnim?"rev-visible":""}
              style={{ background:"#fff",borderRadius:24,padding:"40px 36px",textAlign:"center",
                boxShadow:"0 8px 40px rgba(79,112,50,.12)",border:`1.5px solid ${GL}`,minHeight:200 }}>
              <div style={{ color:AU,fontSize:22,letterSpacing:4,marginBottom:18 }}>★★★★★</div>
              <p style={{ fontSize:16,color:"#4a5a3a",lineHeight:1.9,marginBottom:22,fontStyle:"italic",
                maxWidth:520,margin:"0 auto 22px" }}>
                "{reviews[currentRev]?.text}"
              </p>
              <div style={{ fontSize:14,color:G,fontWeight:800 }}>— {reviews[currentRev]?.name}</div>
            </div>

            {/* side arrows */}
            <button onClick={() => goReview(-1)}
              style={{ position:"absolute",top:"50%",right:-22,transform:"translateY(-50%)",
                width:44,height:44,borderRadius:"50%",border:`2px solid ${GL}`,background:"#fff",
                color:G,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 2px 12px rgba(79,112,50,.15)",transition:"all .2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = G; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.color = G; }}>
              <i className="fas fa-chevron-right" />
            </button>
            <button onClick={() => goReview(1)}
              style={{ position:"absolute",top:"50%",left:-22,transform:"translateY(-50%)",
                width:44,height:44,borderRadius:"50%",border:`2px solid ${GL}`,background:"#fff",
                color:G,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 2px 12px rgba(79,112,50,.15)",transition:"all .2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = G; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.color = G; }}>
              <i className="fas fa-chevron-left" />
            </button>
          </div>

          {/* dots */}
          <div style={{ display:"flex",justifyContent:"center",gap:8,marginTop:24 }}>
            {reviews.map((_,i) => (
              <button key={i} onClick={() => { setRevAnim(false); setTimeout(() => { setCurrentRev(i); setRevAnim(true); }, 200); }}
                style={{ width:i===currentRev?24:8,height:8,borderRadius:4,border:"none",cursor:"pointer",padding:0,
                  background:i===currentRev?G:GL,transition:"all .3s" }} />
            ))}
          </div>

          {/* add review */}
          <div style={{ marginTop:40,textAlign:"center" }}>
            {submitted && (
              <div style={{ marginBottom:16,padding:"10px 24px",borderRadius:12,background:"#dcfce7",
                color:"#166534",fontWeight:700,display:"inline-block",animation:"fadeUp .3s ease both" }}>
                ظهر تقييمك للجميع
              </div>
            )}
            <button onClick={() => setShowForm(!showForm)}
              style={{ padding:"12px 36px",borderRadius:50,border:`2px solid ${G}`,
                background:showForm?G:"transparent",color:showForm?"#fff":G,
                fontWeight:800,cursor:"pointer",fontSize:14,transition:"all .2s" }}>
              أضف تقييمك
            </button>
            {showForm && (
              <div style={{ maxWidth:480,margin:"20px auto 0",padding:28,borderRadius:20,
                border:`1px solid ${GL}`,background:"#fff",boxShadow:"0 4px 24px rgba(79,112,50,.1)",
                direction:"rtl",animation:"fadeUp .3s ease both" }}>
                <textarea value={newReview.text} onChange={e => setNewReview(p => ({ ...p, text: e.target.value }))}
                  placeholder="شاركنا تجربتك مع منتجاتنا..." rows={4}
                  style={{ width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${GL}`,
                    fontSize:14,resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10,
                    fontFamily:"'Cairo',sans-serif" }} />
                <input value={newReview.name} onChange={e => setNewReview(p => ({ ...p, name: e.target.value }))}
                  placeholder="اسمك"
                  style={{ width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${GL}`,
                    fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:16,
                    fontFamily:"'Cairo',sans-serif" }} />
                <button onClick={submitReview} disabled={submitting} className="btn-primary"
                  style={{ width:"100%",padding:13,borderRadius:12,border:"none",
                    background:G,color:"#fff",fontWeight:800,cursor:submitting?"wait":"pointer",fontSize:15,
                    fontFamily:"'Cairo',sans-serif",opacity:submitting?.6:1 }}>
                  {submitting?"جاري الإرسال...":"إرسال التقييم"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ FLOATING BUTTONS ══ */}
      <div style={{ position:"fixed",bottom:28,left:28,display:"flex",flexDirection:"column",gap:12,zIndex:999 }}>
        <a href="https://wa.me/201229555229" target="_blank" rel="noreferrer"
          style={{ width:56,height:56,borderRadius:"50%",background:"#25D366",color:"#fff",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 4px 18px rgba(37,211,102,.5)",fontSize:26,transition:"transform .2s",textDecoration:"none" }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform="scale(1.14)"}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform="scale(1)"}>
          <i className="fab fa-whatsapp" />
        </a>
        <a href="tel:+201229555229"
          style={{ width:56,height:56,borderRadius:"50%",background:G,color:"#fff",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:`0 4px 18px rgba(79,112,50,.5)`,fontSize:22,transition:"transform .2s",textDecoration:"none" }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform="scale(1.14)"}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform="scale(1)"}>
          <i className="fas fa-phone" />
        </a>
      </div>

      {/* ══ FOOTER ══ */}
      <footer style={{ background:DK,borderTop:`4px solid ${AU}`,padding:"52px 24px 28px",direction:"rtl" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:36,marginBottom:40 }}>
            <div>
              <img src={LOGO} alt="مطروح أوليفي" style={{ height:70,marginBottom:16,display:"block" }} />
              <p style={{ fontSize:13,lineHeight:2,color:"#7a9a6a",margin:"0 0 18px" }}>نخلق لك من الطبيعة حياة أفضل.</p>
              <div style={{ display:"flex",gap:8 }}>
                {["fa-facebook-f","fa-instagram","fa-whatsapp"].map(ic => (
                  <a key={ic} href="#"
                    style={{ width:36,height:36,borderRadius:"50%",background:"#3d4a2a",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,
                      textDecoration:"none",color:"#7a9a6a",transition:"background .2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background=G}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background="#3d4a2a"}>
                    <i className={`fab ${ic}`} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize:11,letterSpacing:3,color:AU,marginBottom:18 }}>المتجر</p>
              {[["الرئيسية","/"],["جميع المنتجات","/shop"],["العروض","/shop?collection=offers"]].map(([l,h]) => (
                <a key={h} href={h} style={{ display:"block",fontSize:14,color:"#7a9a6a",textDecoration:"none",marginBottom:10,transition:"color .2s" }}
                  onMouseEnter={e => (e.target as HTMLAnchorElement).style.color=GL}
                  onMouseLeave={e => (e.target as HTMLAnchorElement).style.color="#7a9a6a"}>{l}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize:11,letterSpacing:3,color:AU,marginBottom:18 }}>مساعدة</p>
              {[["الشحن والتوصيل","/shipping"],["اتصل بنا","/contact"]].map(([l,h]) => (
                <a key={h} href={h} style={{ display:"block",fontSize:14,color:"#7a9a6a",textDecoration:"none",marginBottom:10,transition:"color .2s" }}
                  onMouseEnter={e => (e.target as HTMLAnchorElement).style.color=GL}
                  onMouseLeave={e => (e.target as HTMLAnchorElement).style.color="#7a9a6a"}>{l}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize:11,letterSpacing:3,color:AU,marginBottom:18 }}>تواصل معنا</p>
              <p style={{ fontSize:14,color:"#7a9a6a",marginBottom:14,fontWeight:600 }}>01229555229</p>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <a href="https://wa.me/201229555229" target="_blank" rel="noreferrer"
                  style={{ display:"flex",alignItems:"center",gap:10,background:"#25D366",color:"#fff",
                    textDecoration:"none",padding:"10px 16px",borderRadius:12,fontSize:14,fontWeight:700,transition:"opacity .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity=".85"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity="1"}>
                  <i className="fab fa-whatsapp" style={{ fontSize:20 }} /> واتساب
                </a>
                <a href="tel:+201229555229"
                  style={{ display:"flex",alignItems:"center",gap:10,background:"#3d4a2a",color:"#7a9a6a",
                    textDecoration:"none",padding:"10px 16px",borderRadius:12,fontSize:14,fontWeight:700,
                    border:"1px solid #4a6030",transition:"all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background=G; (e.currentTarget as HTMLAnchorElement).style.color="#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background="#3d4a2a"; (e.currentTarget as HTMLAnchorElement).style.color="#7a9a6a"; }}>
                  <i className="fas fa-phone" style={{ fontSize:16 }} /> اتصل بنا
                </a>
              </div>
            </div>
          </div>
          <div style={{ borderTop:"1px solid #3d4a2a",paddingTop:22,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8 }}>
            <p style={{ margin:0,fontSize:12,color:"#5a7050" }}>© 2026 مطروح أوليفي — صدق .. أمانة .. خبرة</p>
            <p style={{ margin:0,fontSize:12,color:"#5a7050" }}>الدفع عند الاستلام</p>
          </div>
        </div>
      </footer>
    </>
  );
}
