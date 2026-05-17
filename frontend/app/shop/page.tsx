"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  id: string;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  price: number;
  old_price?: number;
  images?: string[];
  main_image?: string;
  category_name?: string;
  category_name_ar?: string;
  category_slug?: string;
  stock?: number;
  is_active: boolean;
}

interface CartItem {
  product: { id: string; name_ar: string; name_en: string; price: number; image_url?: string; };
  qty: number;
  size: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const GREEN = "#4B6741";
const GREEN_DARK = "#3A5232";
const CREAM = "#E8EDD0";
const GOLD = "#D4AF37";

const COLLECTIONS = [
  { key: "", label: "الكل", icon: "✨" },
  { key: "زيت-زيتون", label: "زيت الزيتون", icon: "🫒" },
  { key: "مخللات", label: "المخللات", icon: "🥒" },
  { key: "زيتون", label: "الزيتون", icon: "🌿" },
  { key: "عسل", label: "العسل", icon: "🍯" },
  { key: "منتجات-طبيعية", label: "منتجات طبيعية", icon: "🌱" },
  { key: "هدايا", label: "هدايا", icon: "🎁" },
];

function getProductImage(p: Product): string {
  const img = p.main_image || (p.images && p.images.find(i => i?.startsWith("http")));
  if (!img) return `https://placehold.co/400x400/4B6741/fff?text=${encodeURIComponent((p.name_ar || p.name_en)?.slice(0, 6) || "؟؟")}`;
  if (img.startsWith("http")) return img;
  return `http://localhost:5000${img}`;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get("search") || "";
  const collectionFilter = searchParams.get("collection") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try { const saved = localStorage.getItem("cart"); if (saved) setCartItems(JSON.parse(saved)); } catch {}
    try { const wl = localStorage.getItem("wishlist"); if (wl) setWishlist(JSON.parse(wl)); } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("cart", JSON.stringify(cartItems)); window.dispatchEvent(new Event("cartUpdated")); } catch {}
  }, [cartItems]);

  useEffect(() => { fetchProducts(); }, [searchQuery, collectionFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true); setError("");
      let url = `${API_BASE}/products?is_active=true&limit=500`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (collectionFilter) url += `&collection=${encodeURIComponent(collectionFilter)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: any) { setError(err?.message || "فشل تحميل المنتجات"); }
    finally { setLoading(false); }
  };

  const addToCart = (product: Product, qty: number = 1) => {
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id);
      if (idx >= 0) { const c = [...prev]; c[idx] = { ...c[idx], qty: Math.min(10, c[idx].qty + qty) }; return c; }
      return [...prev, { product: { id: product.id, name_ar: product.name_ar || product.name_en, name_en: product.name_en, price: product.price, image_url: getProductImage(product) }, qty, size: "One Size" }];
    });
    setAddedIds(a => ({ ...a, [product.id]: true }));
    setTimeout(() => setAddedIds(a => ({ ...a, [product.id]: false })), 1800);
  };

  const toggleWishlist = (id: string) => {
    setWishlist(w => {
      const updated = { ...w, [id]: !w[id] };
      try { localStorage.setItem("wishlist", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const cartTotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "name") return (a.name_ar || a.name_en).localeCompare(b.name_ar || b.name_en);
    if (sortBy === "discount") {
      const da = a.old_price ? (1 - a.price / a.old_price) : 0;
      const db = b.old_price ? (1 - b.price / b.old_price) : 0;
      return db - da;
    }
    return 0;
  });

  const openProduct = (p: Product) => {
    setSelectedProduct(p);
    const imgs: string[] = [];
    if (p.main_image?.startsWith("http")) imgs.push(p.main_image);
    (p.images || []).forEach(i => { if (i?.startsWith("http") && !imgs.includes(i)) imgs.push(i); });
    setSelectedImages(imgs.length > 0 ? imgs : [getProductImage(p)]);
    setSelectedImgIdx(0);
  };

  const setCollection = (key: string) => {
    if (key) router.push(`/shop?collection=${encodeURIComponent(key)}`);
    else router.push("/shop");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7faf4", fontFamily: "'Cairo', sans-serif", direction: "rtl" }}>

      {/* زر السلة العائم */}
      <button onClick={() => setShowCart(true)} className="cart-fab" aria-label="سلة التسوق">
        🛒
        {cartCount > 0 && <span className="cart-fab-badge">{cartCount}</span>}
      </button>

      {/* سايدبار السلة */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-sidebar" onClick={e => e.stopPropagation()}>
            <div className="cart-sidebar-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🛒</span>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: GREEN }}>سلة التسوق</h2>
                {cartCount > 0 && <span className="cart-count-chip">{cartCount}</span>}
              </div>
              <button onClick={() => setShowCart(false)} className="cart-close-btn">×</button>
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
                <p style={{ color: "#999", fontWeight: 600, fontSize: 15 }}>السلة فارغة</p>
                <button onClick={() => setShowCart(false)} className="btn-continue-shopping">تصفح المنتجات</button>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cartItems.map((item, i) => (
                    <div key={i} className="cart-item">
                      <img src={item.product.image_url || ""} alt={item.product.name_ar}
                        style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/64x64/4B6741/fff?text=?`; }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#2a3a20", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.product.name_ar}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button onClick={() => setCartItems(p => p.map(x => x.product.id === item.product.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} className="qty-btn">−</button>
                          <span style={{ width: 28, textAlign: "center", fontSize: 13, fontWeight: 700 }}>{item.qty}</span>
                          <button onClick={() => setCartItems(p => p.map(x => x.product.id === item.product.id ? { ...x, qty: Math.min(10, x.qty + 1) } : x))} className="qty-btn">+</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <span style={{ fontWeight: 800, color: GREEN, fontSize: 14 }}>{item.product.price * item.qty} ج.م</span>
                        <button onClick={() => setCartItems(p => p.filter(x => x.product.id !== item.product.id))} className="remove-btn">🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-row"><span>المجموع الفرعي</span><span style={{ fontWeight: 700 }}>{cartTotal} ج.م</span></div>
                  <div className="cart-row" style={{ fontSize: 12, color: "#888" }}>
                    <span>الشحن</span>
                    <span style={{ fontWeight: 600 }}>يُحسب عند الطلب</span>
                  </div>
                  <div className="cart-row cart-total"><span>الإجمالي</span><span style={{ color: GREEN }}>{cartTotal} ج.م</span></div>
                  <a href="/checkout" className="btn-checkout">إتمام الطلب ←</a>
                  <button onClick={() => setShowCart(false)} className="btn-continue">متابعة التسوق</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* بانر المتجر */}
      <div className="shop-hero">
        <div className="shop-hero-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: 13 }}>الرئيسية</Link>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>←</span>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
              {searchQuery ? `بحث: ${searchQuery}` : collectionFilter ? collectionFilter : "المتجر"}
            </span>
          </div>
          <h1 className="shop-hero-title">
            {searchQuery ? `نتائج: "${searchQuery}"` : collectionFilter ? `قسم: ${collectionFilter}` : "🛒 تسوق الآن"}
          </h1>
          <p className="shop-hero-sub">منتجات طبيعية أصيلة من مطروح • جودة عالية • توصيل سريع</p>
        </div>
      </div>

      {/* شريط الفرز */}
      <div className="sort-bar">
        <div className="sort-bar-inner">
          <span className="products-count">{!loading && `${sorted.length} منتج`}</span>
          <div className="sort-controls">
            <span style={{ fontSize: 13, color: "#6a8a5a", fontWeight: 600 }}>ترتيب:</span>
            <div className="sort-pills">
              {[
                { v: "newest", l: "الأحدث" },
                { v: "price-low", l: "الأقل سعرًا" },
                { v: "price-high", l: "الأعلى سعرًا" },
                { v: "discount", l: "التخفيضات" },
              ].map(s => (
                <button key={s.v} onClick={() => setSortBy(s.v)} className={`sort-pill${sortBy === s.v ? " active" : ""}`}>{s.l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="shop-main">
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={fetchProducts} className="btn-retry">إعادة المحاولة</button>
          </div>
        )}

        {loading ? (
          <div className="products-grid">
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-img" />
                <div style={{ padding: "14px 14px 16px" }}>
                  <div className="skeleton-line" style={{ width: "75%", marginBottom: 8 }} />
                  <div className="skeleton-line" style={{ width: "45%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 72, marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontSize: 20, color: "#2a3a20", marginBottom: 8 }}>لا توجد منتجات</h2>
            <p style={{ color: "#888", marginBottom: 24 }}>{searchQuery ? `لم نجد نتائج لـ "${searchQuery}"` : "لا توجد منتجات في هذا القسم حالياً"}</p>
            <Link href="/shop" className="btn-browse-all">عرض كل المنتجات</Link>
          </div>
        ) : (
          <div className="products-grid">
            {sorted.map(p => {
              const img = getProductImage(p);
              const hasDiscount = p.old_price && p.old_price > p.price;
              const discount = hasDiscount ? Math.round((1 - p.price / p.old_price!) * 100) : 0;
              const qty = quantities[p.id] || 1;
              const displayName = p.name_ar || p.name_en;
              const inStock = true;
              const isAdded = addedIds[p.id];
              const isWished = wishlist[p.id];

              return (
                <div key={p.id} className="product-card">
                  {/* صورة المنتج */}
                  <div className="product-img-wrap" onClick={() => openProduct(p)}>
                    <img src={img} alt={displayName} className="product-img" loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/4B6741/fff?text=${encodeURIComponent(displayName?.slice(0, 4) || "؟؟")}`; }} />
                    {/* overlay actions */}
                    <div className="product-overlay">
                      <button className="overlay-btn-view" onClick={e => { e.stopPropagation(); openProduct(p); }}>عرض التفاصيل</button>
                    </div>
                    {/* badges */}
                    <div className="product-badges">
                      {hasDiscount && <span className="badge-discount">-{discount}%</span>}
                      {!inStock && <span className="badge-outofstock">نفذ</span>}
                      {!hasDiscount && <span className="badge-new">جديد</span>}
                    </div>
                    {/* wishlist */}
                    <button className={`wishlist-btn${isWished ? " wished" : ""}`} onClick={e => { e.stopPropagation(); toggleWishlist(p.id); }}>
                      {isWished ? "❤️" : "🤍"}
                    </button>
                  </div>

                  {/* تفاصيل المنتج */}
                  <div className="product-info">
                    {p.category_name_ar && <span className="product-category">{p.category_name_ar}</span>}
                    <h3 className="product-name" onClick={() => openProduct(p)}>{displayName}</h3>
                    <div style={{ color: "#D4AF37", fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>★★★★★</div>
                    <div className="product-price-row">
                      <span className="product-price">{p.price} ج.م</span>
                      {hasDiscount && <span className="product-old-price">{p.old_price} ج.م</span>}
                    </div>
                    <div className="product-actions">
                      <div className="qty-control">
                        <button onClick={() => setQuantities(q => ({ ...q, [p.id]: Math.max(1, (q[p.id] || 1) - 1) }))} className="qty-ctrl-btn">−</button>
                        <span className="qty-display">{qty}</span>
                        <button onClick={() => setQuantities(q => ({ ...q, [p.id]: Math.min(10, (q[p.id] || 1) + 1) }))} className="qty-ctrl-btn">+</button>
                      </div>
                      <button onClick={() => addToCart(p, qty)} disabled={!inStock}
                        className={`btn-add-cart${isAdded ? " added" : ""}${!inStock ? " disabled" : ""}`}>
                        {!inStock ? "نفذ" : isAdded ? "✅ أُضيف" : "🛒 أضف"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* مودال المنتج */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-inner" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>×</button>

            {/* الصورة */}
            <div className="modal-images">
              <div className="modal-main-img-wrap">
                {selectedProduct.old_price && selectedProduct.old_price > selectedProduct.price && (
                  <span className="modal-discount-badge">
                    -{Math.round((1 - selectedProduct.price / selectedProduct.old_price) * 100)}%
                  </span>
                )}
                <img src={selectedImages[selectedImgIdx] || getProductImage(selectedProduct)}
                  alt={selectedProduct.name_ar || selectedProduct.name_en}
                  className="modal-main-img"
                  onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/500x500/4B6741/fff?text=؟`; }} />
              </div>
              {selectedImages.length > 1 && (
                <div className="modal-thumbnails">
                  {selectedImages.map((img, idx) => (
                    <img key={idx} src={img} alt="" onClick={() => setSelectedImgIdx(idx)}
                      className={`modal-thumb${idx === selectedImgIdx ? " active" : ""}`} />
                  ))}
                </div>
              )}
            </div>

            {/* التفاصيل */}
            <div className="modal-details">
              {selectedProduct.category_name_ar && (
                <span className="modal-category">{selectedProduct.category_name_ar}</span>
              )}
              <h2 className="modal-product-name">{selectedProduct.name_ar || selectedProduct.name_en}</h2>

              {/* التقييم */}
              <div style={{ color: GOLD, fontSize: 16, letterSpacing: 2, marginBottom: 4 }}>
                ★★★★★ <span style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>(تقييم العملاء)</span>
              </div>

              {/* السعر */}
              <div className="modal-price-section">
                <span className="modal-price">{selectedProduct.price} ج.م</span>
                {selectedProduct.old_price && selectedProduct.old_price > selectedProduct.price && (
                  <span className="modal-old-price">{selectedProduct.old_price} ج.م</span>
                )}
              </div>

              {/* الوصف */}
              {(selectedProduct.description_ar || selectedProduct.description_en) && (
                <div className="modal-description"
                  dangerouslySetInnerHTML={{ __html: selectedProduct.description_ar || selectedProduct.description_en || "" }} />
              )}

              {/* المخزون */}
              <div className="stock-badge">✅ متوفر في المخزون</div>

              {/* الكمية وأزرار الإجراء */}
              {(
                <div className="modal-qty-row">
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#5a7050" }}>الكمية:</span>
                  <div className="qty-control">
                    <button onClick={() => setQuantities(q => ({ ...q, [selectedProduct.id]: Math.max(1, (q[selectedProduct.id] || 1) - 1) }))} className="qty-ctrl-btn">−</button>
                    <span className="qty-display">{quantities[selectedProduct.id] || 1}</span>
                    <button onClick={() => setQuantities(q => ({ ...q, [selectedProduct.id]: Math.min(10, (q[selectedProduct.id] || 1) + 1) }))} className="qty-ctrl-btn">+</button>
                  </div>
                </div>
              )}

              <div className="modal-action-btns">
                <button
                  onClick={() => { addToCart(selectedProduct, quantities[selectedProduct.id] || 1); setSelectedProduct(null); }}
                  className="btn-modal-add">
                  🛒 أضف للسلة
                </button>
                <Link href={`/products/slug?id=${selectedProduct.id}`} className="btn-modal-view">
                  عرض الصفحة الكاملة ←
                </Link>
              </div>

              {/* مميزات */}
              <div className="modal-features">
                <div className="feature-item"><span>🚚</span><span>توصيل سريع لجميع المحافظات</span></div>
                <div className="feature-item"><span>✅</span><span>منتجات طبيعية 100%</span></div>
                <div className="feature-item"><span>💳</span><span>الدفع عند الاستلام</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

        /* ===== HERO ===== */
        .shop-hero {
          background: linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN} 60%, #6a9b5a 100%);
          padding: 36px 24px 28px;
          position: relative;
          overflow: hidden;
        }
        .shop-hero::before {
          content: "🫒🌿🍯";
          position: absolute;
          right: 5%;
          top: 50%;
          transform: translateY(-50%);
          font-size: 80px;
          opacity: 0.08;
          letter-spacing: 20px;
        }
        .shop-hero-inner { max-width: 1300px; margin: 0 auto; }
        .shop-hero-title { margin: 0 0 6px; font-size: 28px; font-weight: 900; color: #fff; }
        .shop-hero-sub { margin: 0; font-size: 14px; color: rgba(255,255,255,0.75); }


        /* ===== SORT BAR ===== */
        .sort-bar { background: #f7faf4; border-bottom: 1px solid #e8edd0; padding: 12px 24px; }
        .sort-bar-inner { max-width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
        .products-count { font-size: 13px; color: #888; font-weight: 600; }
        .sort-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .sort-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .sort-pill {
          padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
          border: 1.5px solid #d0ddc0; background: #fff; color: #6a8a5a;
          cursor: pointer; transition: all 0.15s; font-family: Cairo, sans-serif;
        }
        .sort-pill:hover { border-color: ${GREEN}; color: ${GREEN}; }
        .sort-pill.active { background: ${GREEN}; color: #fff; border-color: ${GREEN}; }

        /* ===== MAIN ===== */
        .shop-main { max-width: 1300px; margin: 0 auto; padding: 28px 24px 60px; }

        /* ===== PRODUCTS GRID ===== */
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 22px; }

        /* ===== PRODUCT CARD ===== */
        .product-card {
          background: #fff; border-radius: 18px; overflow: hidden;
          border: 1px solid #e8edd0;
          box-shadow: 0 2px 12px rgba(75,103,65,0.08);
          transition: transform 0.25s, box-shadow 0.25s;
          display: flex; flex-direction: column;
        }
        .product-card:hover { transform: translateY(-6px); box-shadow: 0 10px 30px rgba(75,103,65,0.18); border-color: #c8d9b0; }

        .product-img-wrap {
          position: relative; aspect-ratio: 1; overflow: hidden;
          background: ${CREAM}; cursor: pointer;
        }
        .product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .product-card:hover .product-img { transform: scale(1.07); }

        .product-overlay {
          position: absolute; inset: 0; background: rgba(42,58,32,0.5);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.25s;
        }
        .product-card:hover .product-overlay { opacity: 1; }
        .overlay-btn-view {
          padding: 9px 20px; border-radius: 25px; border: 2px solid #fff;
          background: rgba(255,255,255,0.15); color: #fff; font-size: 13px;
          font-weight: 700; cursor: pointer; font-family: Cairo, sans-serif;
          backdrop-filter: blur(4px); transition: background 0.2s;
        }
        .overlay-btn-view:hover { background: #fff; color: ${GREEN}; }

        .product-badges { position: absolute; top: 10px; right: 10px; display: flex; flex-direction: column; gap: 4px; }
        .badge-discount { background: #ef4444; color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .badge-outofstock { background: #6b7280; color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .badge-new { background: ${GOLD}; color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }

        .wishlist-btn {
          position: absolute; top: 10px; left: 10px; width: 32px; height: 32px;
          border-radius: 50%; background: rgba(255,255,255,0.9); border: none;
          font-size: 16px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; opacity: 0; transition: opacity 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .product-card:hover .wishlist-btn { opacity: 1; }
        .wishlist-btn.wished { opacity: 1; }

        .product-info { padding: 14px 14px 16px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .product-category { font-size: 11px; color: ${GREEN}; font-weight: 700; letter-spacing: 0.5px; }
        .product-name {
          margin: 0; font-size: 14px; font-weight: 700; color: #2a3a20;
          line-height: 1.45; cursor: pointer; font-family: Cairo, sans-serif;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          min-height: 41px;
        }
        .product-name:hover { color: ${GREEN}; }
        .product-price-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .product-price { font-size: 18px; font-weight: 800; color: ${GREEN}; }
        .product-old-price { font-size: 12px; color: #bbb; text-decoration: line-through; }

        .product-actions { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
        .qty-control { display: flex; align-items: center; border: 1.5px solid #c8d9b0; border-radius: 8px; overflow: hidden; }
        .qty-ctrl-btn {
          width: 30px; height: 34px; border: none; background: #fff;
          cursor: pointer; font-size: 16px; font-weight: 700; color: ${GREEN};
          transition: background 0.15s;
        }
        .qty-ctrl-btn:hover { background: #f0f7ea; }
        .qty-display { width: 30px; text-align: center; font-size: 13px; font-weight: 700; background: #fff; line-height: 34px; }

        .btn-add-cart {
          flex: 1; height: 34px; border-radius: 8px; border: none;
          background: ${GREEN}; color: #fff; font-size: 12px; font-weight: 700;
          cursor: pointer; font-family: Cairo, sans-serif; transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-add-cart:hover { background: ${GREEN_DARK}; }
        .btn-add-cart.added { background: #22c55e; }
        .btn-add-cart.disabled { background: #ccc; cursor: not-allowed; }

        /* ===== SKELETON ===== */
        .skeleton-card { background: #fff; border-radius: 18px; overflow: hidden; border: 1px solid #e8edd0; }
        .skeleton-img { height: 220px; background: linear-gradient(90deg, #e8edd0 25%, #f0f5e8 50%, #e8edd0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .skeleton-line { height: 14px; background: linear-gradient(90deg, #e8edd0 25%, #f0f5e8 50%, #e8edd0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ===== EMPTY STATE ===== */
        .empty-state { text-align: center; padding: 80px 20px; }
        .btn-browse-all { display: inline-block; padding: 12px 28px; border-radius: 25px; background: ${GREEN}; color: #fff; text-decoration: none; font-weight: 700; font-size: 14px; }

        /* ===== ERROR ===== */
        .error-banner { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; color: #b91c1c; font-weight: 600; }
        .btn-retry { padding: 6px 16px; border-radius: 8px; border: none; background: #ef4444; color: #fff; cursor: pointer; font-family: Cairo, sans-serif; font-size: 13px; }

        /* ===== MODAL ===== */
        .modal-overlay { position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-inner {
          background: #fff; border-radius: 24px; width: 900px; max-width: 95vw;
          max-height: 90vh; overflow-y: auto; display: grid;
          grid-template-columns: 1fr 1fr; direction: rtl; position: relative;
        }
        .modal-close {
          position: absolute; top: 14px; left: 14px; width: 36px; height: 36px;
          border-radius: 50%; border: none; background: rgba(0,0,0,0.08);
          font-size: 22px; cursor: pointer; z-index: 10; color: #666;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .modal-close:hover { background: rgba(0,0,0,0.15); }

        .modal-images { background: ${CREAM}; border-radius: 24px 0 0 24px; display: flex; flex-direction: column; overflow: hidden; }
        .modal-main-img-wrap { position: relative; flex: 1; min-height: 320px; }
        .modal-main-img { width: 100%; height: 100%; object-fit: cover; min-height: 320px; }
        .modal-discount-badge { position: absolute; top: 14px; right: 14px; background: #ef4444; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; }
        .modal-thumbnails { display: flex; gap: 8px; padding: 10px 12px; overflow-x: auto; background: rgba(0,0,0,0.04); }
        .modal-thumb { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; cursor: pointer; border: 2px solid transparent; opacity: 0.65; transition: all 0.2s; flex-shrink: 0; }
        .modal-thumb.active { border-color: ${GREEN}; opacity: 1; }

        .modal-details { padding: 28px 24px; display: flex; flex-direction: column; gap: 14px; }
        .modal-category { font-size: 11px; color: ${GREEN}; font-weight: 700; letter-spacing: 0.5px; }
        .modal-product-name { margin: 0; font-size: 22px; font-weight: 800; color: #2a3a20; line-height: 1.4; }
        .modal-price-section { display: flex; align-items: center; gap: 12px; }
        .modal-price { font-size: 28px; font-weight: 900; color: ${GREEN}; }
        .modal-old-price { font-size: 16px; color: #bbb; text-decoration: line-through; }
        .modal-description { font-size: 13px; line-height: 1.85; color: #5a7050; border-top: 1px solid #e8edd0; padding-top: 12px; }
        .stock-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; background: #dcfce7; color: #166534; }
        .stock-badge.out { background: #fee2e2; color: #991b1b; }
        .modal-qty-row { display: flex; align-items: center; gap: 14px; }
        .modal-action-btns { display: flex; flex-direction: column; gap: 10px; }
        .btn-modal-add {
          width: 100%; padding: 14px; border-radius: 14px; border: none;
          background: ${GREEN}; color: #fff; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: Cairo, sans-serif; transition: background 0.2s;
        }
        .btn-modal-add:hover { background: ${GREEN_DARK}; }
        .btn-modal-add.disabled { background: #ccc; cursor: not-allowed; }
        .btn-modal-view {
          display: block; width: 100%; padding: 13px; border-radius: 14px;
          border: 2px solid ${GREEN}; color: ${GREEN}; font-size: 14px; font-weight: 700;
          text-align: center; text-decoration: none; font-family: Cairo, sans-serif;
          transition: all 0.2s; box-sizing: border-box;
        }
        .btn-modal-view:hover { background: ${GREEN}; color: #fff; }
        .modal-features { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; border-top: 1px solid #e8edd0; }
        .feature-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #6a8a5a; font-weight: 600; }

        /* ===== CART FAB ===== */
        .cart-fab {
          position: fixed; bottom: 28px; left: 28px; width: 56px; height: 56px;
          border-radius: 50%; background: ${GREEN}; color: #fff; border: none;
          font-size: 22px; cursor: pointer; z-index: 100;
          box-shadow: 0 4px 20px rgba(75,103,65,0.5);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cart-fab:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(75,103,65,0.6); }
        .cart-fab-badge {
          position: absolute; top: -4px; right: -4px; background: #ef4444; color: #fff;
          border-radius: 50%; width: 22px; height: 22px; font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #fff;
        }

        /* ===== CART SIDEBAR ===== */
        .cart-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.55); backdrop-filter: blur(2px); }
        .cart-sidebar {
          position: absolute; right: 0; top: 0; width: 400px; max-width: 95vw;
          height: 100%; background: #fff; display: flex; flex-direction: column;
          direction: rtl; box-shadow: -8px 0 40px rgba(0,0,0,0.15);
        }
        .cart-sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 20px 16px; border-bottom: 1px solid #e8edd0; }
        .cart-count-chip { background: ${GREEN}; color: #fff; border-radius: 20px; padding: 2px 10px; font-size: 12px; font-weight: 700; }
        .cart-close-btn { background: none; border: none; font-size: 30px; cursor: pointer; color: #aaa; line-height: 1; }
        .cart-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; }
        .btn-continue-shopping { margin-top: 16px; padding: 10px 24px; border-radius: 25px; border: 2px solid ${GREEN}; background: #fff; color: ${GREEN}; font-weight: 700; font-size: 14px; cursor: pointer; font-family: Cairo, sans-serif; }
        .cart-items-list { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
        .cart-item { display: flex; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #f0f5e8; align-items: flex-start; }
        .qty-btn {
          width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid ${GREEN};
          background: #fff; cursor: pointer; color: ${GREEN}; font-weight: 700;
          display: flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .remove-btn { background: none; border: none; font-size: 14px; cursor: pointer; opacity: 0.7; }
        .remove-btn:hover { opacity: 1; }
        .cart-footer { padding: 16px 20px; border-top: 1px solid #e8edd0; display: flex; flex-direction: column; gap: 10px; }
        .cart-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
        .cart-total { font-size: 17px; font-weight: 800; padding-top: 8px; border-top: 1px solid #e8edd0; }
        .free-shipping-bar { padding: 6px 0; }
        .btn-checkout {
          display: block; width: 100%; padding: 14px; border-radius: 14px;
          background: ${GREEN}; color: #fff; font-size: 15px; font-weight: 800;
          text-align: center; text-decoration: none; font-family: Cairo, sans-serif;
          transition: background 0.2s; box-sizing: border-box;
        }
        .btn-checkout:hover { background: ${GREEN_DARK}; }
        .btn-continue { background: none; border: 1.5px solid #e0e0e0; border-radius: 14px; padding: 11px; color: #666; font-size: 14px; cursor: pointer; font-family: Cairo, sans-serif; transition: border-color 0.2s; }
        .btn-continue:hover { border-color: ${GREEN}; color: ${GREEN}; }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 900px) {
          .modal-inner { grid-template-columns: 1fr; max-width: 98vw; }
          .modal-images { border-radius: 24px 24px 0 0; }
          .modal-main-img { min-height: 250px; }
        }
        @media (max-width: 768px) {
          .shop-hero-title { font-size: 22px; }
          .products-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px; }
          .product-img-wrap { aspect-ratio: 1; }
          .sort-controls { width: 100%; overflow-x: auto; }
          .sort-bar-inner { flex-direction: column; align-items: flex-start; }
          .shop-main { padding: 20px 14px 40px; }
          .modal-price { font-size: 22px; }
          .modal-product-name { font-size: 18px; }
        }
        @media (max-width: 480px) {
          .products-grid { gap: 8px; }
          .product-info { padding: 10px 10px 12px; }
          .product-price { font-size: 15px; }
          .shop-hero { padding: 24px 16px 20px; }
          .collection-bar { padding: 10px 16px; }
          .sort-bar { padding: 10px 16px; }
          .sort-pill { font-size: 11px; padding: 4px 10px; }
        }
      `}</style>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: "center", padding: 60, color: "#888", fontFamily: "Cairo, sans-serif", fontSize: 16 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        جاري تحميل المنتجات...
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
