"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const HERO_BANNER = "https://assets.wuiltstore.com/cmesintt84hgm01ksersa5djl_1.png";
const LOGO = "https://assets.wuiltstore.com/cm5tcbuy002ue01n3dqyt5fy9_IMG_5462.png";
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const GREEN = "#4f7032";
const GREEN_DARK = "#3d5828";
const CREAM = "#d7f7b3";
const CREAM_BG = "#f1f7c9";
const GOLD = "#bd9a52";
const DARK = "#2d2b27";

interface Product {
  id: string; name_en: string; name_ar?: string;
  price: number; old_price?: number;
  images?: string[]; main_image?: string; stock?: number;
}
interface CartItem {
  product: { id: string; name_ar: string; name_en: string; price: number; image_url?: string };
  qty: number; size: string;
}

const REVIEWS = [
  { text: "والله زيت الزيتون بتاعهم تحفة! ريحته حلوة جداً والطعم أصلي مش زي اللي في المحلات", name: "أحمد محمود", stars: 5 },
  { text: "اشتريت منهم زجاجة تجربة وعجبتني جداً، دلوقتي بطلب كميات كبيرة. التغليف ممتاز والمنتج وصل سليم", name: "فاطمة علي", stars: 5 },
  { text: "زيت مطروح ده فعلاً له طعم مختلف عن أي زيت تاني. أنصح بيه لكل الأسرة", name: "محمود سامي", stars: 5 },
  { text: "جربت الشامبو بتاعهم بالروزماري وربنا يبارك، شعري بقى أكثف ومش بيتكسر زي الأول خالص", name: "نور الهدى", stars: 5 },
  { text: "الصابون المغربي ده غير حياتي! بشرتي بقت ناعمة وصافية من أول استخدام، هطلب منه كميات", name: "سارة خالد", stars: 5 },
  { text: "جربت كتير أنواع زيت زيتون بس ده الأحسن لحد دلوقتي. لونه ذهبي وطعمه أصيل جداً", name: "كريم عبدالله", stars: 5 },
  { text: "السيرم بتاعهم معمول من مكونات طبيعية وحسيت بفرق واضح في بشرتي بعد أسبوع بس", name: "هدير مصطفى", stars: 5 },
  { text: "اشتريت زيت الجرجير للشعر وجربته أسبوعين، شعري اتحسن كتير وبدأ ينبت في الأماكن الفاضية", name: "منى رضا", stars: 5 },
  { text: "الطحينة بتاعتهم مش زي أي طحينة تانية خالص، نضيفة وطبيعية ومذاقها رائع", name: "رامي حسن", stars: 5 },
  { text: "تركيبة النخاع دي حاجة مش طبيعية! جربتها على شعري وبعد شهر حسيت إن شعري رجع زي الأول", name: "ياسمين عمر", stars: 5 },
  { text: "البلسم من مطروح أوليفي حاجة تحفة، شعري بقى ناعم جداً ولامع من غير ما أحتاج حاجة تانية", name: "دينا مصطفى", stars: 5 },
  { text: "الخل التفاح العضوي استخدمته في الأكل وللبشرة كمان، جودة عالية جداً وسعره معقول", name: "عمر فاروق", stars: 5 },
];

const CATS = [
  { slug: "زيت-الزيتون",      title: "زيت الزيتون",      desc: "زيت بكر ممتاز من أشجار معمرة",          grad: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DARK} 100%)`,    icon: "fa-wine-bottle" },
  { slug: "العنايه-بالبشره",  title: "العناية بالبشرة",   desc: "منتجات طبيعية لجمالك وبشرتك",            grad: `linear-gradient(135deg, ${GOLD} 0%, #8a6e38 100%)`,            icon: "fa-spa" },
  { slug: "العنايه-بالشعر",   title: "العناية بالشعر",    desc: "زيوت وتركيبات طبيعية لشعرك",             grad: `linear-gradient(135deg, #6b9e48 0%, ${GREEN} 100%)`,            icon: "fa-leaf" },
  { slug: "الزيوت-الطبيعيه",  title: "الزيوت الطبيعية",   desc: "زيوت طبيعية من أفضل المصادر",            grad: `linear-gradient(135deg, #5a8a3a 0%, ${GREEN_DARK} 100%)`,      icon: "fa-oil-can" },
  { slug: "منتجات-اخري",      title: "منتجات أخرى",       desc: "اكتشف مجموعة منتجاتنا المميزة",          grad: `linear-gradient(135deg, #bd9a52 0%, #7a5e28 100%)`,            icon: "fa-box-open" },
  { slug: "مخللات",            title: "المخللات",           desc: "مخللات طبيعية من إنتاجنا الخاص",         grad: `linear-gradient(135deg, #4a7a2a 0%, #2d5018 100%)`,            icon: "fa-jar" },
];

function getImg(p: Product): string {
  const img = p.main_image || (p.images && p.images[0]);
  if (!img) return `https://placehold.co/400x400/4f7032/fff?text=${encodeURIComponent((p.name_ar || p.name_en)?.slice(0, 4) || "؟")}`;
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  return `http://localhost:5000${img}`;
}

export default function HomePage() {
  const [currentReview, setCurrentReview] = useState(0);
  const [allReviews, setAllReviews] = useState(REVIEWS);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ text: "", name: "" });
  const [submitted, setSubmitted] = useState(false);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [catsVisible, setCatsVisible] = useState(false);
  const [prodsVisible, setProdsVisible] = useState(false);
  const catsRef = useRef<HTMLDivElement>(null);
  const prodsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBestSellers();
    const t = setInterval(() => setCurrentReview(p => (p + 1) % allReviews.length), 5000);

    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setCatsVisible(true); }, { threshold: 0.1 });
    const obs2 = new IntersectionObserver(([e]) => { if (e.isIntersecting) setProdsVisible(true); }, { threshold: 0.05 });
    if (catsRef.current) obs.observe(catsRef.current);
    if (prodsRef.current) obs2.observe(prodsRef.current);

    return () => { clearInterval(t); obs.disconnect(); obs2.disconnect(); };
  }, []);

  const fetchBestSellers = async () => {
    try {
      let res = await fetch(`${API_BASE}/products?collection=${encodeURIComponent("الا-كثر-مبيعا")}&is_active=true&limit=8`, { cache: "no-store" });
      let data = await res.json();
      let prods = data.products || [];
      if (prods.length < 4) {
        res = await fetch(`${API_BASE}/products?is_active=true&limit=8`, { cache: "no-store" });
        data = await res.json();
        prods = data.products || [];
      }
      setBestSellers(prods);
    } catch {}
  };

  const addToCart = (product: Product) => {
    const item: CartItem = {
      product: { id: product.id, name_ar: product.name_ar || product.name_en, name_en: product.name_en, price: product.price, image_url: getImg(product) },
      qty: 1, size: "One Size",
    };
    try {
      const saved = localStorage.getItem("cart");
      let cart: CartItem[] = saved ? JSON.parse(saved) : [];
      const idx = cart.findIndex(i => i.product.id === product.id);
      cart = idx >= 0 ? cart.map((x, i) => i === idx ? { ...x, qty: Math.min(10, x.qty + 1) } : x) : [...cart, item];
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1500);
    } catch {}
  };

  const submitReview = () => {
    if (!newReview.text.trim() || !newReview.name.trim()) return;
    setAllReviews(p => [{ text: newReview.text, name: newReview.name, stars: 5 }, ...p]);
    setNewReview({ text: "", name: "" });
    setSubmitted(true); setShowForm(false); setCurrentReview(0);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap');
        * { font-family: 'Cairo', 'Tajawal', sans-serif; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }

        .cat-card {
          transition: transform .35s cubic-bezier(.23,1,.32,1), box-shadow .35s, opacity .5s, translate .5s;
        }
        .cat-card:hover {
          transform: translateY(-10px) scale(1.04) !important;
          box-shadow: 0 24px 56px rgba(0,0,0,0.22) !important;
        }
        .cat-card .cat-icon-wrap { transition: transform .35s; }
        .cat-card:hover .cat-icon-wrap { transform: scale(1.15) rotate(-4deg); }

        .prod-card { transition: transform .28s, box-shadow .28s; cursor: pointer; }
        .prod-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(79,112,50,0.18) !important; }
        .prod-img  { transition: transform .45s; }
        .prod-card:hover .prod-img { transform: scale(1.08); }

        .btn-green { transition: background .2s, transform .15s, box-shadow .2s; }
        .btn-green:hover { background: #3d5828 !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,112,50,0.35) !important; }
        .btn-gold  { transition: background .2s, transform .15s, box-shadow .2s; }
        .btn-gold:hover { background: #a07d3a !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(189,154,82,0.45) !important; }

        .section-badge { display: inline-block; background: ${CREAM}; color: ${GREEN}; font-weight: 800; font-size: 11px; letter-spacing: 3px; padding: 5px 18px; border-radius: 20px; text-transform: uppercase; margin-bottom: 14px; }
        .section-title { font-family: 'Tajawal', 'Cairo', sans-serif; font-size: 30px; font-weight: 800; color: ${DARK}; margin: 0; line-height: 1.3; }

        @media (max-width: 1100px) { .cat-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 900px)  { .best-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 640px)  {
          .cat-grid  { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
          .best-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .about-flex { flex-direction: column !important; text-align: center !important; }
          .about-logo { width: 110px !important; height: 110px !important; }
          .hero-btn   { bottom: 8% !important; right: 50% !important; transform: translateX(50%) !important; }
          .stats-grid { gap: 8px !important; }
          .section-title { font-size: 22px !important; }
        }
      `}</style>

      {/* ══ الهيرو ══ */}
      <section style={{ width: "100%", position: "relative", lineHeight: 0, overflow: "hidden" }}>
        <img src={HERO_BANNER} alt="مطروح أوليفي" style={{ width: "100%", display: "block", maxHeight: 620, objectFit: "cover", objectPosition: "center top" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, rgba(0,0,0,0.38) 0%, transparent 65%)" }} />
        <div className="hero-btn" style={{ position: "absolute", bottom: "14%", right: "7%", animation: "fadeUp .9s ease .4s both" }}>
          <Link href="/shop" className="btn-gold" style={{ display: "inline-block", background: GOLD, color: "#fff", padding: "14px 44px", borderRadius: 50, textDecoration: "none", fontWeight: 800, fontSize: 16, boxShadow: "0 8px 28px rgba(189,154,82,0.55)", letterSpacing: .5 }}>
            تسوق الآن
          </Link>
        </div>
      </section>

      {/* ══ شريط الإحصائيات ══ */}
      <section style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN} 100%)`, padding: "20px 24px" }}>
        <div className="stats-grid" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16, direction: "rtl" }}>
          {[
            { icon: "fa-seedling", num: "100%",      label: "طبيعي نقي" },
            { icon: "fa-users",   num: "+10K",       label: "عميل سعيد" },
            { icon: "fa-award",   num: "بكر ممتاز",  label: "أعلى درجة جودة" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <i className={`fas ${s.icon}`} style={{ fontSize: 22, color: CREAM }} />
              <div style={{ fontSize: 18, fontWeight: 900, color: GOLD }}>{s.num}</div>
              <div style={{ fontSize: 12, color: "#c8e6a0" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ تسوق حسب القسم ══ */}
      <section style={{ background: CREAM_BG, padding: "64px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", direction: "rtl" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="section-badge">تسوق حسب القسم</span>
            <h2 className="section-title">منتجات مطروح أوليفي</h2>
          </div>

          <div ref={catsRef} className="cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 20 }}>
            {CATS.map((cat, i) => (
              <Link key={i} href={`/shop?collection=${cat.slug}`} className="cat-card"
                style={{
                  borderRadius: 20, overflow: "hidden", textDecoration: "none", display: "flex", flexDirection: "column",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.10)",
                  opacity: catsVisible ? 1 : 0,
                  transform: catsVisible ? "translateY(0)" : "translateY(40px)",
                  transition: `opacity .55s ease ${i * 0.08}s, transform .55s cubic-bezier(.23,1,.32,1) ${i * 0.08}s, box-shadow .35s, scale .35s`,
                }}>
                {/* أعلى الكارت — خلفية ملونة */}
                <div style={{ background: cat.grad, padding: "28px 16px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="cat-icon-wrap" style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <i className={`fas ${cat.icon}`} style={{ fontSize: 24, color: "#fff" }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff", textAlign: "center", lineHeight: 1.4 }}>{cat.title}</h3>
                </div>
                {/* أسفل الكارت */}
                <div style={{ background: "#fff", padding: "12px 14px 16px", flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#6a8a5a", lineHeight: 1.6, textAlign: "center" }}>{cat.desc}</p>
                  <div style={{ marginTop: 10, textAlign: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>تسوق الآن ←</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ الأكثر مبيعاً ══ */}
      {bestSellers.length > 0 && (
        <section style={{ background: CREAM_BG, padding: "56px 20px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", direction: "rtl" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span className="section-badge">المنتجات المميزة</span>
              <h2 className="section-title">الأكثر مبيعاً</h2>
            </div>

            <div ref={prodsRef} className="best-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
              {bestSellers.map((p, i) => {
                const img = getImg(p);
                const hasDisc = p.old_price && p.old_price > p.price;
                const disc = hasDisc ? Math.round((1 - p.price / p.old_price!) * 100) : 0;
                const name = p.name_ar || p.name_en;
                const isAdded = addedId === p.id;
                return (
                  <div key={p.id} className="prod-card"
                    style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(79,112,50,0.10)", border: "1px solid #e8f0e0",
                      opacity: prodsVisible ? 1 : 0, transform: prodsVisible ? "translateY(0)" : "translateY(30px)",
                      transition: `opacity .5s ease ${i * 0.07}s, transform .5s cubic-bezier(.23,1,.32,1) ${i * 0.07}s, box-shadow .28s` }}>
                    <Link href={`/products/${p.id}`} style={{ textDecoration: "none", display: "block" }}>
                      <div style={{ position: "relative", height: 220, overflow: "hidden", background: CREAM_BG }}>
                        <img className="prod-img" src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy"
                          onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/4f7032/fff?text=${encodeURIComponent(name.slice(0, 4))}`; }} />
                        {hasDisc && <span style={{ position: "absolute", top: 10, right: 10, background: "#ef4444", color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>-{disc}%</span>}
                      </div>
                      <div style={{ padding: "14px 16px 10px" }}>
                        <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: DARK, lineHeight: 1.5, minHeight: 40, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as any}>{name}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 17, fontWeight: 900, color: GREEN }}>{p.price} ج.م</span>
                          {hasDisc && <span style={{ fontSize: 12, color: "#bbb", textDecoration: "line-through" }}>{p.old_price} ج.م</span>}
                        </div>
                      </div>
                    </Link>
                    <div style={{ padding: "0 16px 16px" }}>
                      <button onClick={() => addToCart(p)} className="btn-green"
                        style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: "none", background: isAdded ? "#22c55e" : GREEN, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                        {isAdded ? "تمت الإضافة" : "أضف للسلة"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", marginTop: 44 }}>
              <Link href="/shop" className="btn-green" style={{ display: "inline-block", padding: "13px 48px", borderRadius: 50, background: GREEN, color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 16px rgba(79,112,50,0.3)" }}>
                عرض كل المنتجات
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ من نحن ══ */}
      <section style={{ background: `linear-gradient(135deg, ${CREAM} 0%, #dde8c4 100%)`, padding: "64px 20px" }}>
        <div className="about-flex" style={{ maxWidth: 920, margin: "0 auto", display: "flex", alignItems: "center", gap: 52, direction: "rtl" }}>
          <div className="about-logo" style={{ flex: "0 0 auto", width: 190, height: 190, background: CREAM_BG, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `4px solid ${GOLD}`, overflow: "hidden", boxShadow: "0 8px 32px rgba(189,154,82,0.25)" }}>
            <img src={LOGO} alt="مطروح أوليفي" style={{ width: "88%", height: "88%", objectFit: "contain" }} />
          </div>
          <div style={{ flex: 1 }}>
            <span className="section-badge" style={{ background: GREEN, color: "#fff" }}>قصتنا</span>
            <h2 style={{ fontFamily: "Tajawal, Cairo, sans-serif", fontSize: 28, fontWeight: 800, color: DARK, margin: "0 0 16px" }}>مطروح أوليفي</h2>
            <p style={{ fontSize: 15, color: "#5a7050", lineHeight: 2, marginBottom: 22 }}>
              نحن شركة متخصصة في تقديم أجود أنواع زيت الزيتون الطبيعي من مطروح. شعارنا الدائم{" "}
              <strong style={{ color: GREEN }}>صدق .. أمانة .. خبرة</strong>، ونسعى دائماً لأن نخلق لك من الطبيعة حياة أفضل.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["صدق", "أمانة", "خبرة", "جودة"].map(tag => (
                <span key={tag} style={{ padding: "7px 20px", borderRadius: 50, background: CREAM_BG, color: GREEN, fontSize: 13, fontWeight: 800, border: `2px solid ${GREEN}` }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ آراء العملاء ══ */}
      <section style={{ background: CREAM_BG, padding: "64px 20px", textAlign: "center" }}>
        <span className="section-badge">آراء العملاء</span>
        <h2 className="section-title" style={{ marginBottom: 40 }}>ماذا يقول عملاؤنا</h2>

        <div style={{ background: "linear-gradient(135deg,#f9fdf0,#fff)", border: `1.5px solid ${CREAM}`, width: 440, maxWidth: "92%", margin: "0 auto", padding: "36px 32px", borderRadius: 24, boxShadow: "0 8px 40px rgba(79,112,50,0.12)", minHeight: 210, direction: "rtl" }}>
          <div style={{ color: GOLD, fontSize: 22, marginBottom: 16, letterSpacing: 4 }}>{"★".repeat(allReviews[currentReview].stars)}</div>
          <p style={{ fontSize: 15, color: "#4a5a3a", marginBottom: 20, lineHeight: 1.9, fontStyle: "italic" }}>"{allReviews[currentReview].text}"</p>
          <div style={{ fontSize: 14, color: GREEN, fontWeight: 800 }}>— {allReviews[currentReview].name}</div>
        </div>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 8 }}>
          {allReviews.map((_, i) => (
            <button key={i} onClick={() => setCurrentReview(i)} style={{ width: i === currentReview ? 24 : 8, height: 8, borderRadius: 4, border: "none", cursor: "pointer", background: i === currentReview ? GREEN : "#c8e6a0", transition: "all .3s", padding: 0 }} />
          ))}
        </div>

        {submitted && <div style={{ marginTop: 18, padding: "10px 24px", borderRadius: 10, background: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: 14, display: "inline-block" }}>تمت إضافة تقييمك</div>}

        <div style={{ marginTop: 32 }}>
          <button onClick={() => setShowForm(!showForm)} className="btn-green"
            style={{ padding: "12px 36px", borderRadius: 50, border: `2px solid ${GREEN}`, background: showForm ? GREEN : "transparent", color: showForm ? "#fff" : GREEN, fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
            أضف تقييمك
          </button>
          {showForm && (
            <div style={{ maxWidth: 440, margin: "20px auto 0", padding: 28, borderRadius: 20, border: `1px solid ${CREAM}`, background: CREAM_BG, boxShadow: "0 4px 24px rgba(79,112,50,0.1)", direction: "rtl" }}>
              <textarea value={newReview.text} onChange={e => setNewReview(p => ({ ...p, text: e.target.value }))} placeholder="شاركنا تجربتك..." rows={3} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #c8e6a0", fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 10, background: "#fff" }} />
              <input value={newReview.name} onChange={e => setNewReview(p => ({ ...p, name: e.target.value }))} placeholder="اسمك" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #c8e6a0", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14, background: "#fff" }} />
              <button onClick={submitReview} className="btn-green" style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: GREEN, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 15 }}>إرسال التقييم</button>
            </div>
          )}
        </div>
      </section>

      {/* ══ أزرار عائمة ══ */}
      <div style={{ position: "fixed", bottom: 28, right: 28, display: "flex", flexDirection: "column", gap: 12, zIndex: 999 }}>
        <a href="https://wa.me/201229555229" target="_blank" rel="noreferrer"
          style={{ width: 56, height: 56, borderRadius: "50%", background: "#25D366", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", boxShadow: "0 4px 16px rgba(37,211,102,0.5)", fontSize: 26, transition: "transform .2s, box-shadow .2s" }}
          title="تواصل عبر واتساب"
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.12)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"; }}>
          <i className="fab fa-whatsapp" />
        </a>
        <a href="tel:+201229555229"
          style={{ width: 56, height: 56, borderRadius: "50%", background: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", boxShadow: "0 4px 16px rgba(79,112,50,0.5)", fontSize: 22, transition: "transform .2s, box-shadow .2s" }}
          title="اتصل بنا"
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.12)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"; }}>
          <i className="fas fa-phone" />
        </a>
      </div>

      {/* ══ الفوتر ══ */}
      <footer style={{ background: "#1e2d15", borderTop: `4px solid ${GOLD}`, padding: "48px 24px 24px", direction: "rtl" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 36, marginBottom: 36 }}>

            <div>
              <img src={LOGO} alt="مطروح أوليفي" style={{ height: 70, width: "auto", marginBottom: 16, display: "block" }} />
              <p style={{ fontSize: 13, lineHeight: 2, color: "#7a9a6a", margin: "0 0 16px" }}>نخلق لك من الطبيعة حياة أفضل.</p>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { icon: "fa-facebook-f", label: "Facebook" },
                  { icon: "fa-instagram",  label: "Instagram" },
                  { icon: "fa-whatsapp",   label: "WhatsApp", fab: true },
                ].map(s => (
                  <a key={s.label} href="#" title={s.label}
                    style={{ width: 36, height: 36, borderRadius: "50%", background: "#2d4a22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, textDecoration: "none", transition: "background .2s", color: "#7a9a6a" }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = GREEN}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "#2d4a22"}>
                    <i className={`${s.fab ? "fab" : "fab"} fa-${s.icon}`} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: GOLD, marginBottom: 18 }}>المتجر</p>
              {[["الرئيسية", "/"], ["جميع المنتجات", "/shop"], ["العروض", "/shop?collection=offers"]].map(([l, h]) => (
                <a key={h} href={h} style={{ display: "block", fontSize: 14, color: "#7a9a6a", textDecoration: "none", marginBottom: 10, transition: "color .2s" }}
                  onMouseEnter={e => (e.target as HTMLAnchorElement).style.color = CREAM}
                  onMouseLeave={e => (e.target as HTMLAnchorElement).style.color = "#7a9a6a"}>{l}</a>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: GOLD, marginBottom: 18 }}>مساعدة</p>
              {[["الشحن والتوصيل", "/shipping"], ["سياسة الإرجاع", "/returns"], ["اتصل بنا", "/contact"]].map(([l, h]) => (
                <a key={h} href={h} style={{ display: "block", fontSize: 14, color: "#7a9a6a", textDecoration: "none", marginBottom: 10, transition: "color .2s" }}
                  onMouseEnter={e => (e.target as HTMLAnchorElement).style.color = CREAM}
                  onMouseLeave={e => (e.target as HTMLAnchorElement).style.color = "#7a9a6a"}>{l}</a>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: GOLD, marginBottom: 18 }}>تواصل معنا</p>
              <p style={{ fontSize: 13, color: "#7a9a6a", marginBottom: 14, fontWeight: 600 }}>01229555229</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="https://wa.me/201229555229" target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 10, background: "#25D366", color: "#fff", textDecoration: "none", padding: "10px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700, transition: "opacity .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "1"}>
                  <i className="fab fa-whatsapp" style={{ fontSize: 20 }} /> واتساب
                </a>
                <a href="tel:+201229555229"
                  style={{ display: "flex", alignItems: "center", gap: 10, background: "#2d4a22", color: "#7a9a6a", textDecoration: "none", padding: "10px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "1px solid #3d6a32", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = GREEN; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#2d4a22"; (e.currentTarget as HTMLAnchorElement).style.color = "#7a9a6a"; }}>
                  <i className="fas fa-phone" style={{ fontSize: 16 }} /> اتصل بنا
                </a>
              </div>
              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 12, color: "#6a8a5a", background: "#2d4a22", padding: "5px 14px", borderRadius: 8 }}>الدفع عند الاستلام</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #2d4a22", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#5a7050" }}>© 2026 مطروح أوليفي — صدق .. أمانة .. خبرة</p>
            <p style={{ margin: 0, fontSize: 12, color: "#5a7050" }}>الدفع عند الاستلام</p>
          </div>
        </div>
      </footer>
    </>
  );
}
