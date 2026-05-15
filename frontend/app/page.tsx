"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const HERO_BANNER = "https://assets.wuiltstore.com/cmesintt84hgm01ksersa5djl_1.png";
const LOGO = "https://assets.wuiltstore.com/cm5tcbuy002ue01n3dqyt5fy9_IMG_5462.png";
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const GREEN = "#4B6741";
const GREEN_DARK = "#3A5232";
const CREAM = "#E8EDD0";
const GOLD = "#D4AF37";

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
  { text: "السيرم بتاعهم معمول من مكونات طبيعية وحسيت بفرق واضح في بشرتي بعد أسبوع بس، تمام التمام", name: "هدير مصطفى", stars: 5 },
  { text: "اشتريت زيت الجرجير للشعر وجربته أسبوعين، شعري اتحسن كتير وبدأ ينبت في الأماكن الفاضية", name: "منى رضا", stars: 5 },
  { text: "الطحينة بتاعتهم مش زي أي طحينة تانية خالص، نضيفة وطبيعية ومذاقها رائع في السلطة والفول", name: "رامي حسن", stars: 5 },
  { text: "تركيبة النخاع دي حاجة مش طبيعية! جربتها على شعري وبعد شهر حسيت إن شعري رجع زي الأول بالظبط", name: "ياسمين عمر", stars: 5 },
  { text: "البلسم من مطروح أوليفي حاجة تحفة، شعري بقى ناعم جداً ولامع من غير ما أحتاج حاجة تانية", name: "دينا مصطفى", stars: 5 },
  { text: "الخل التفاح العضوي استخدمته في الأكل وللبشرة كمان، جودة عالية جداً وسعره معقول أوي", name: "عمر فاروق", stars: 5 },
  { text: "بادي اسبلاش مطروح أوليفي ريحته جميلة جداً وبيفضل على الجسم طول اليوم، هطلب منه أكتر", name: "ريم أحمد", stars: 5 },
  { text: "جل الأوليفرا ده وقفت عليه بالصدفة وجربته على التهيج اللي عندي وفرق معايا في يومين بس", name: "طارق محمد", stars: 5 },
  { text: "دبس التمر بتاعهم طبيعي 100%، بحطه في الحليب الصبح وبيدي طاقة طول النهار. ربنا يبارك", name: "إيمان سعيد", stars: 5 },
];

const CATS = [
  { slug: "olive-oil",      fa: "fa-wine-bottle", title: "زيت الزيتون",     desc: "زيت بكر ممتاز من أشجار معمرة",        color: "#be9b53" },
  { slug: "skin-care",      fa: "fa-spa",         title: "العناية بالبشرة", desc: "منتجات طبيعية لجمالك وبشرتك",          color: "#bb8fce" },
  { slug: "hair-care",      fa: "fa-spa",         title: "العناية بالشعر",  desc: "منتجات طبيعية للعناية بشعرك",          color: "#7dcea0" },
  { slug: "natural-oils",   fa: "fa-oil-can",     title: "الزيوت الطبيعية", desc: "زيوت طبيعية 100% من أفضل المصادر",    color: "#5499c7" },
  { slug: "other-products", fa: "fa-gift",        title: "منتجات أخرى",    desc: "اكتشف مجموعة منتجاتنا المميزة",        color: "#f1948a" },
  { slug: "pickles",        fa: "fa-jar",         title: "المخللات",        desc: "مخللات طبيعية من إنتاجنا الخاص",       color: "#e8a87c" },
];

function getImg(p: Product): string {
  const img = p.main_image || (p.images && p.images.find(i => i?.startsWith("http")));
  if (!img) return `https://placehold.co/400x400/4B6741/fff?text=${encodeURIComponent((p.name_ar || p.name_en)?.slice(0, 4) || "؟")}`;
  return img.startsWith("http") ? img : `http://localhost:5000${img}`;
}

export default function HomePage() {
  const [currentReview, setCurrentReview] = useState(0);
  const [allReviews, setAllReviews] = useState(REVIEWS);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ text: "", name: "" });
  const [submitted, setSubmitted] = useState(false);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    fetchBestSellers();
    // auto-advance reviews
    const t = setInterval(() => setCurrentReview(p => (p + 1) % allReviews.length), 5000);
    return () => clearInterval(t);
  }, []);

  const fetchBestSellers = async () => {
    try {
      let res = await fetch(`${API_BASE}/products?collection=best-sellers&is_active=true&limit=8`, { cache: "no-store" });
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
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Cairo', sans-serif; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes pulse2   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }

        .cat-card  { transition: transform .3s, box-shadow .3s, filter .2s; }
        .cat-card:hover { transform: translateY(-6px) scale(1.03); box-shadow: 0 16px 40px rgba(0,0,0,0.22) !important; filter: brightness(1.08); }

        .prod-card { transition: transform .25s, box-shadow .25s; }
        .prod-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(75,103,65,0.22) !important; }
        .prod-img  { transition: transform .4s; }
        .prod-card:hover .prod-img { transform: scale(1.07); }

        .feat-card { transition: transform .3s, box-shadow .3s; border: 2px solid transparent; }
        .feat-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(75,103,65,0.16) !important; border-color: #c8d9b0; }

        .btn-green { transition: background .2s, transform .15s, box-shadow .2s; }
        .btn-green:hover { background: #3A5232 !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(75,103,65,0.35) !important; }
        .btn-gold  { transition: background .2s, transform .15s, box-shadow .2s; }
        .btn-gold:hover { background: #b8941f !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(212,175,55,0.4) !important; }

        @media (max-width: 1100px) { .cat-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 900px)  { .best-grid { grid-template-columns: repeat(3,1fr) !important; } .feat-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 900px)  {
          .cat-grid  { grid-template-columns: repeat(3,1fr) !important; }
        }
        @media (max-width: 640px)  {
          .cat-grid  { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
          .cat-title { font-size: 12px !important; }
          .cat-icon  { font-size: 28px !important; height: 54px !important; width: 54px !important; margin-bottom: 10px !important; }
          .cat-desc  { font-size: 10px !important; }
          .best-grid { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .feat-grid { grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
          .about-flex { flex-direction: column !important; text-align: center !important; }
          .about-logo { width: 110px !important; height: 110px !important; }
          .hero-btn   { bottom: 8% !important; right: 50% !important; transform: translateX(50%) !important; }
          .stats-grid { gap: 8px !important; }
        }
      `}</style>

      {/* ══════════════ الهيرو ══════════════ */}
      <section style={{ width: "100%", position: "relative", lineHeight: 0, overflow: "hidden" }}>
        <img src={HERO_BANNER} alt="مطروح أوليفي" style={{ width: "100%", display: "block", maxHeight: 620, objectFit: "cover", objectPosition: "center top" }} />
        {/* طبقة تدرج خفيفة */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, rgba(0,0,0,0.35) 0%, transparent 60%)" }} />
        <div className="hero-btn" style={{ position: "absolute", bottom: "14%", right: "7%", animation: "fadeUp .9s ease .4s both" }}>
          <Link href="/shop" className="btn-gold" style={{ display: "inline-block", background: GOLD, color: "#fff", padding: "14px 40px", borderRadius: 50, textDecoration: "none", fontWeight: 800, fontSize: 16, boxShadow: "0 8px 28px rgba(212,175,55,0.5)", letterSpacing: .5 }}>
            تسوق الآن
          </Link>
        </div>
      </section>

      {/* ══════════════ شريط الإحصائيات ══════════════ */}
      <section style={{ background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN} 100%)`, padding: "20px 24px" }}>
        <div className="stats-grid" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16, direction: "rtl" }}>
          {[
            { icon: "🌿", num: "100%",      label: "طبيعي نقي" },
            { icon: "😊", num: "+10K",      label: "عميل سعيد" },
            { icon: "🏅", num: "بكر ممتاز", label: "أعلى درجة جودة" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div style={{ fontSize: 18, fontWeight: 900, color: GOLD }}>{s.num}</div>
              <div style={{ fontSize: 12, color: "#c8d9b0" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ الأقسام ══════════════ */}
      <section style={{ background: "#fff", padding: "56px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", direction: "rtl" }}>
          {/* العنوان */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ display: "inline-block", background: "#E8EDD0", color: GREEN, fontWeight: 700, fontSize: 12, letterSpacing: 3, padding: "5px 18px", borderRadius: 20, textTransform: "uppercase", marginBottom: 12 }}>تسوق حسب القسم</span>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: "#2a3a20", margin: 0 }}>منتجات مطروح أوليفي</h2>
          </div>

          <div className="cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 20 }}>
            {CATS.map((cat, i) => (
              <Link key={i} href={`/shop?collection=${cat.slug}`} className="cat-card" style={{
                background: "#fff",
                borderRadius: 15,
                padding: "28px 16px 22px",
                display: "flex", flexDirection: "column", alignItems: "center",
                textDecoration: "none", textAlign: "center",
                boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
                borderTop: `4px solid ${cat.color}`,
                animation: `fadeUp .5s ease ${i * .08}s both`,
              }}>
                <div className="cat-icon" style={{ fontSize: 36, height: 72, width: 72, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color: cat.color }}>
                  <i className={`fas ${cat.fa}`} />
                </div>
                <h3 className="cat-title" style={{ fontWeight: 700, fontSize: 13, color: "#be9b53", margin: "0 0 8px" }}>{cat.title}</h3>
                <p className="cat-desc" style={{ fontSize: 11, color: "#be9b53", margin: 0, lineHeight: 1.5 }}>{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ الأكثر مبيعاً ══════════════ */}
      {bestSellers.length > 0 && (
        <section style={{ background: "#f5f9ee", padding: "56px 20px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", direction: "rtl" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span style={{ display: "inline-block", background: CREAM, color: GREEN, fontWeight: 700, fontSize: 12, letterSpacing: 3, padding: "5px 18px", borderRadius: 20, textTransform: "uppercase", marginBottom: 12 }}>المنتجات المميزة</span>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: "#2a3a20", margin: 0 }}>الأكثر مبيعاً ⭐</h2>
            </div>

            <div className="best-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
              {bestSellers.map((p) => {
                const img = getImg(p);
                const hasDisc = p.old_price && p.old_price > p.price;
                const disc = hasDisc ? Math.round((1 - p.price / p.old_price!) * 100) : 0;
                const name = p.name_ar || p.name_en;
                const isAdded = addedId === p.id;
                return (
                  <div key={p.id} className="prod-card" style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(75,103,65,0.10)", border: "1px solid #e8f0e0" }}>
                    <div style={{ position: "relative", height: 220, overflow: "hidden", background: CREAM }}>
                      <img className="prod-img" src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/4B6741/fff?text=${encodeURIComponent(name.slice(0, 4))}`; }} />
                      {hasDisc && <span style={{ position: "absolute", top: 10, right: 10, background: "#ef4444", color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>-{disc}%</span>}
                    </div>
                    <div style={{ padding: "14px 16px 16px" }}>
                      <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#2a3a20", lineHeight: 1.5, minHeight: 40, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as any}>{name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 17, fontWeight: 900, color: GREEN }}>{p.price} ج.م</span>
                        {hasDisc && <span style={{ fontSize: 12, color: "#bbb", textDecoration: "line-through" }}>{p.old_price} ج.م</span>}
                      </div>
                      <button onClick={() => addToCart(p)} className="btn-green" style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: "none", background: isAdded ? "#22c55e" : GREEN, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                        {isAdded ? "✅ تمت الإضافة!" : "🛒 أضف للسلة"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Link href="/shop" className="btn-green" style={{ display: "inline-block", padding: "13px 44px", borderRadius: 50, background: GREEN, color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 16px rgba(75,103,65,0.3)" }}>
                عرض كل المنتجات ←
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════ مميزاتنا ══════════════ */}
      <section style={{ background: "#fff", padding: "56px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", direction: "rtl" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ display: "inline-block", background: "#E8EDD0", color: GREEN, fontWeight: 700, fontSize: 12, letterSpacing: 3, padding: "5px 18px", borderRadius: 20, textTransform: "uppercase", marginBottom: 12 }}>لماذا نحن؟</span>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: "#2a3a20", margin: 0 }}>ما يميزنا</h2>
          </div>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
            {[
              { icon: "🫒", title: "بكر ممتاز",  desc: "أعلى درجات جودة زيت الزيتون المعترف بها دولياً", color: "#dcfce7" },
              { icon: "❄️", title: "معصور بارد", desc: "يحتفظ بكل الفوائد والنكهة الطبيعية الأصيلة",     color: "#dbeafe" },
              { icon: "🌿", title: "طبيعي 100%", desc: "بدون أي إضافات أو مواد حافظة أو تدخل صناعي",     color: "#d1fae5" },
              { icon: "🏺", title: "من مطروح",   desc: "مباشرة من أحسن مزارع الزيتون في مطروح",         color: "#fef9c3" },
            ].map((f, i) => (
              <div key={i} className="feat-card" style={{ background: "#fff", borderRadius: 20, padding: "30px 22px", textAlign: "center", boxShadow: "0 4px 20px rgba(75,103,65,0.08)" }}>
                <div style={{ width: 70, height: 70, borderRadius: "50%", background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 18px" }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#2a3a20", marginBottom: 10 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#6a8a5a", lineHeight: 1.8 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ من نحن ══════════════ */}
      <section style={{ background: `linear-gradient(135deg, ${CREAM} 0%, #dde8c4 100%)`, padding: "56px 20px" }}>
        <div className="about-flex" style={{ maxWidth: 920, margin: "0 auto", display: "flex", alignItems: "center", gap: 52, direction: "rtl" }}>
          <div className="about-logo" style={{ flex: "0 0 auto", width: 190, height: 190, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `4px solid ${GOLD}`, overflow: "hidden", boxShadow: "0 8px 32px rgba(212,175,55,0.25)" }}>
            <img src={LOGO} alt="مطروح أوليفي" style={{ width: "88%", height: "88%", objectFit: "contain" }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ display: "inline-block", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 11, letterSpacing: 3, padding: "4px 16px", borderRadius: 20, textTransform: "uppercase", marginBottom: 14 }}>قصتنا</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#2a3a20", marginBottom: 16, margin: "0 0 14px" }}>مطروح أوليفي</h2>
            <p style={{ fontSize: 15, color: "#5a7050", lineHeight: 2, marginBottom: 22 }}>
              نحن شركة متخصصة في تقديم أجود أنواع زيت الزيتون الطبيعي من مطروح. شعارنا الدائم{" "}
              <strong style={{ color: GREEN }}>صدق .. أمانة .. خبرة</strong>، ونسعى دائماً لأن نخلق لك من الطبيعة حياة أفضل.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["صدق", "أمانة", "خبرة", "جودة"].map(tag => (
                <span key={tag} style={{ padding: "7px 20px", borderRadius: 50, background: "#fff", color: GREEN, fontSize: 13, fontWeight: 800, border: `2px solid ${GREEN}` }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ آراء العملاء ══════════════ */}
      <section style={{ background: "#fff", padding: "56px 20px", textAlign: "center" }}>
        <span style={{ display: "inline-block", background: "#E8EDD0", color: GREEN, fontWeight: 700, fontSize: 12, letterSpacing: 3, padding: "5px 18px", borderRadius: 20, textTransform: "uppercase", marginBottom: 14 }}>آراء العملاء</span>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 36, color: "#2a3a20" }}>ماذا يقول عملاؤنا</h2>

        <div style={{ background: "linear-gradient(135deg,#f5f9ee,#fff)", border: `2px solid ${CREAM}`, width: 420, maxWidth: "92%", margin: "0 auto", padding: 36, borderRadius: 24, boxShadow: "0 8px 40px rgba(75,103,65,0.12)", minHeight: 210, direction: "rtl" }}>
          <div style={{ color: GOLD, fontSize: 24, marginBottom: 16, letterSpacing: 4 }}>{"★".repeat(allReviews[currentReview].stars)}</div>
          <p style={{ fontSize: 15, color: "#444", marginBottom: 20, lineHeight: 1.9, fontStyle: "italic" }}>"{allReviews[currentReview].text}"</p>
          <div style={{ fontSize: 14, color: GREEN, fontWeight: 800 }}>— {allReviews[currentReview].name}</div>
        </div>

        {/* dots */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 8 }}>
          {allReviews.map((_, i) => (
            <button key={i} onClick={() => setCurrentReview(i)} style={{ width: i === currentReview ? 24 : 8, height: 8, borderRadius: 4, border: "none", cursor: "pointer", background: i === currentReview ? GREEN : "#c8d9b0", transition: "all .3s", padding: 0 }} />
          ))}
        </div>

        {submitted && <div style={{ marginTop: 18, padding: "10px 24px", borderRadius: 10, background: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: 14, display: "inline-block" }}>✅ تمت إضافة تقييمك!</div>}

        <div style={{ marginTop: 32 }}>
          <button onClick={() => setShowForm(!showForm)} className="btn-green" style={{ padding: "12px 36px", borderRadius: 50, border: `2px solid ${GREEN}`, background: showForm ? GREEN : "transparent", color: showForm ? "#fff" : GREEN, fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
            ✍️ أضف تقييمك
          </button>
          {showForm && (
            <div style={{ maxWidth: 440, margin: "20px auto 0", padding: 28, borderRadius: 20, border: `1px solid ${CREAM}`, background: "#f5f9ee", boxShadow: "0 4px 24px rgba(75,103,65,0.1)", direction: "rtl" }}>
              <textarea value={newReview.text} onChange={e => setNewReview(p => ({ ...p, text: e.target.value }))} placeholder="شاركنا تجربتك..." rows={3} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #c8d9b0", fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 10, background: "#fff" }} />
              <input value={newReview.name} onChange={e => setNewReview(p => ({ ...p, name: e.target.value }))} placeholder="اسمك" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #c8d9b0", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14, background: "#fff" }} />
              <button onClick={submitReview} className="btn-green" style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: GREEN, color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 15 }}>إرسال التقييم ✓</button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ أزرار التواصل العائمة ══════════════ */}
      <div style={{ position: "fixed", bottom: 28, right: 28, display: "flex", flexDirection: "column", gap: 12, zIndex: 999 }}>
        <a href="https://wa.me/201229555229" target="_blank" rel="noreferrer"
          style={{ width: 56, height: 56, borderRadius: "50%", background: "#25D366", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", boxShadow: "0 4px 16px rgba(37,211,102,0.5)", fontSize: 26, transition: "transform .2s, box-shadow .2s" }}
          title="تواصل عبر واتساب"
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.12)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 24px rgba(37,211,102,0.65)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(37,211,102,0.5)"; }}>
          <i className="fab fa-whatsapp" />
        </a>
        <a href="tel:+201229555229"
          style={{ width: 56, height: 56, borderRadius: "50%", background: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", boxShadow: "0 4px 16px rgba(75,103,65,0.5)", fontSize: 22, transition: "transform .2s, box-shadow .2s" }}
          title="اتصل بنا"
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.12)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 24px rgba(75,103,65,0.65)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(75,103,65,0.5)"; }}>
          <i className="fas fa-phone" />
        </a>
      </div>

      {/* ══════════════ الفوتر ══════════════ */}
      <footer style={{ background: "#1e2d15", borderTop: `4px solid ${GOLD}`, padding: "44px 24px 24px", direction: "rtl" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 36, marginBottom: 36 }}>

            <div>
              <img src={LOGO} alt="مطروح أوليفي" style={{ height: 70, width: "auto", marginBottom: 16, display: "block" }} />
              <p style={{ fontSize: 13, lineHeight: 2, color: "#7a9a6a", margin: "0 0 16px" }}>نخلق لك من الطبيعة حياة أفضل.</p>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ e: "📘", l: "Facebook" }, { e: "📷", l: "Instagram" }, { e: "💬", l: "WhatsApp" }].map(s => (
                  <a key={s.l} href="#" title={s.l} style={{ width: 36, height: 36, borderRadius: "50%", background: "#2d4a22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, textDecoration: "none", transition: "background .2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = GREEN}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "#2d4a22"}>
                    {s.e}
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
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#6a8a5a", background: "#2d4a22", padding: "4px 12px", borderRadius: 8 }}>💵 الدفع عند الاستلام</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #2d4a22", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#5a7050" }}>© 2026 مطروح أوليفي — صدق .. أمانة .. خبرة</p>
            <p style={{ margin: 0, fontSize: 12, color: "#5a7050" }}>💵 الدفع عند الاستلام</p>
          </div>
        </div>
      </footer>
    </>
  );
}
