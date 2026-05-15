"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CartItem {
  product: { id: string; name_ar: string; name_en: string; price: number; image_url?: string; };
  qty: number;
  size: string;
}

const GREEN = "#4B6741";
const CREAM = "#E8EDD0";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    try { const saved = localStorage.getItem("cart"); if (saved) setCart(JSON.parse(saved)); } catch {}
  }, []);

  const save = (newCart: CartItem[]) => {
    setCart(newCart);
    try { localStorage.setItem("cart", JSON.stringify(newCart)); window.dispatchEvent(new Event("cartUpdated")); } catch {}
  };

  const updateQty = (id: string, delta: number) =>
    save(cart.map(i => i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));

  const removeItem = (id: string) =>
    save(cart.filter(i => i.product.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const freeShipping = subtotal >= 500;
  const shipping = freeShipping ? 0 : 80;
  const total = subtotal + shipping;
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f9ee", fontFamily: "Cairo, sans-serif", direction: "rtl" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 20px;
          align-items: start;
        }
        .cart-item-row {
          display: flex;
          gap: 14px;
          padding: 16px 0;
        }
        .cart-item-img { width: 80px; height: 80px; flex-shrink: 0; }
        .cart-item-total { font-weight: 800; color: ${GREEN}; font-size: 15px; flex-shrink: 0; align-self: center; }

        @media (max-width: 700px) {
          .cart-layout {
            grid-template-columns: 1fr !important;
          }
          .cart-summary-sticky { position: static !important; }
          .cart-item-img { width: 64px !important; height: 64px !important; }
          .cart-item-total { font-size: 14px !important; }
          .cart-header h1 { font-size: 18px !important; }
          .cart-wrap { padding: 16px 12px !important; }
        }
      `}</style>

      <div className="cart-wrap" style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        {/* رأس الصفحة */}
        <div className="cart-header" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: GREEN, textDecoration: "none", fontSize: 13, fontFamily: "Cairo, sans-serif" }}>الرئيسية</Link>
          <span style={{ color: "#aaa" }}>←</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#2a3a20" }}>🛒 سلة التسوق ({count} منتج)</h1>
        </div>

        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 20px", background: "#fff", borderRadius: 20, boxShadow: "0 4px 20px rgba(75,103,65,0.08)" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
            <p style={{ fontSize: 18, color: "#999", marginBottom: 20 }}>السلة فارغة</p>
            <Link href="/shop" style={{ padding: "12px 32px", borderRadius: 50, background: GREEN, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              تسوق الآن ←
            </Link>
          </div>
        ) : (
          <div className="cart-layout">

            {/* قائمة المنتجات */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "8px 16px", boxShadow: "0 4px 20px rgba(75,103,65,0.08)" }}>
              {cart.map((item, idx) => (
                <div key={idx} className="cart-item-row" style={{ borderBottom: idx < cart.length - 1 ? "1px solid #f0f0f0" : "none" }}>

                  {/* صورة */}
                  <div className="cart-item-img" style={{ borderRadius: 12, overflow: "hidden", background: CREAM, flexShrink: 0 }}>
                    {item.product.image_url
                      ? <img src={item.product.image_url} alt={item.product.name_ar} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80/4B6741/fff?text=?"; }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🫒</div>
                    }
                  </div>

                  {/* التفاصيل */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#2a3a20", fontSize: 14, lineHeight: 1.4 }}>
                      {item.product.name_ar || item.product.name_en}
                    </p>
                    <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: GREEN }}>{item.product.price} ج.م</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <button onClick={() => updateQty(item.product.id, -1)}
                        style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid #c8d9b0`, background: "#fff", cursor: "pointer", color: GREEN, fontWeight: 700, fontSize: 16, lineHeight: 1 }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 22, textAlign: "center", fontSize: 15 }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, 1)}
                        style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid #c8d9b0`, background: "#fff", cursor: "pointer", color: GREEN, fontWeight: 700, fontSize: 16, lineHeight: 1 }}>+</button>
                      <button onClick={() => removeItem(item.product.id)}
                        style={{ marginRight: "auto", color: "#e74c3c", background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: "4px 8px" }}>🗑 حذف</button>
                    </div>
                  </div>

                  {/* الإجمالي */}
                  <div className="cart-item-total">{item.product.price * item.qty} ج.م</div>
                </div>
              ))}

              <div style={{ paddingTop: 14, paddingBottom: 4 }}>
                <Link href="/shop" style={{ color: GREEN, textDecoration: "none", fontSize: 13 }}>← متابعة التسوق</Link>
              </div>
            </div>

            {/* ملخص الطلب */}
            <div>
              <div className="cart-summary-sticky" style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 4px 20px rgba(75,103,65,0.08)", position: "sticky", top: 80 }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 800, color: "#2a3a20" }}>📦 ملخص الطلب</h3>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: "#888" }}>المجموع الفرعي</span>
                  <span style={{ fontWeight: 700 }}>{subtotal} ج.م</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14, color: "#888" }}>
                  <span>الشحن</span>
                  <span style={{ fontWeight: 700 }}>يُحسب عند الطلب</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, marginBottom: 18, borderTop: `2px solid ${GREEN}`, paddingTop: 14 }}>
                  <span>الإجمالي</span>
                  <span style={{ color: GREEN }}>{total} ج.م</span>
                </div>

                <Link href="/checkout" style={{
                  display: "block", width: "100%", padding: "14px", borderRadius: 14,
                  background: GREEN, color: "#fff", textAlign: "center",
                  textDecoration: "none", fontWeight: 800, fontSize: 16, boxSizing: "border-box"
                }}>
                  إتمام الطلب ←
                </Link>

                <div style={{ textAlign: "center", marginTop: 14, padding: "10px 0", background: "#fef3c7", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#92400e" }}>
                  💵 الدفع عند الاستلام
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
