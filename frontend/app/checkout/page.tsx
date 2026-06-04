"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CartItem {
  product: { id: string; name_en: string; price: number; image_url?: string; };
  qty: number;
  size: string;
}

import { trackInitiateCheckout, trackPurchase } from "@/lib/pixel";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

// كل المحافظات والمدن المصرية
const EGYPT_DATA: Record<string, { nameAr: string; cities: string[] }> = {
  "Cairo": { nameAr: "القاهرة", cities: ["Cairo City", "Nasr City", "Heliopolis", "Maadi", "Zamalek", "New Cairo", "6th of October City", "Shorouk", "Badr City", "Obour"] },
  "Giza": { nameAr: "الجيزة", cities: ["Giza City", "Dokki", "Mohandessin", "Haram", "Imbaba", "6th of October", "Sheikh Zayed", "Faysal"] },
  "Alexandria": { nameAr: "الإسكندرية", cities: ["Alexandria City", "Sidi Gaber", "Smouha", "Miami", "Montaza", "Borg El Arab", "Abu Qir"] },
  "Dakahlia": { nameAr: "الدقهلية", cities: ["Mansoura", "Talkha", "Mit Ghamr", "Belqas", "Aga", "Sherbin", "Dekernes"] },
  "Red Sea": { nameAr: "البحر الأحمر", cities: ["Hurghada", "Safaga", "El Quseir", "Marsa Alam", "Ras Gharib"] },
  "Beheira": { nameAr: "البحيرة", cities: ["Damanhur", "Kafr El Dawwar", "Rashid", "Edku", "Abu Hummus"] },
  "Fayoum": { nameAr: "الفيوم", cities: ["Fayoum City", "Ibsheway", "Sinnuris", "Tamiya", "Yusuf El Seddiq"] },
  "Gharbia": { nameAr: "الغربية", cities: ["Tanta", "El Mahalla El Kubra", "Kafr El Zayat", "Zefta", "El Sadat City"] },
  "Ismailia": { nameAr: "الإسماعيلية", cities: ["Ismailia City", "Fayed", "Qantara", "El Tal El Kabir"] },
  "Menofia": { nameAr: "المنوفية", cities: ["Shebin El Kom", "Menouf", "Ashmoun", "Quesna", "Sadat City", "Birket El Sab"] },
  "Minya": { nameAr: "المنيا", cities: ["Minya City", "Abu Qurqas", "Mallawi", "Maghagha", "Beni Mazar", "Matay"] },
  "Qalyubia": { nameAr: "القليوبية", cities: ["Banha", "Shubra El Kheima", "Qalyub", "Khanka", "Tukh", "Qaha"] },
  "New Valley": { nameAr: "الوادي الجديد", cities: ["Kharga", "Dakhla", "Farafra", "Baris"] },
  "Suez": { nameAr: "السويس", cities: ["Suez City", "Ain Sokhna", "Ataqah"] },
  "Aswan": { nameAr: "أسوان", cities: ["Aswan City", "Edfu", "Kom Ombo", "Abu Simbel", "Daraw"] },
  "Assiut": { nameAr: "أسيوط", cities: ["Assiut City", "Abnub", "Manfalut", "Dairut", "El Qusiya", "Sahel Selim"] },
  "Beni Suef": { nameAr: "بني سويف", cities: ["Beni Suef City", "El Fashn", "Beba", "Nasser", "Somsta"] },
  "Port Said": { nameAr: "بورسعيد", cities: ["Port Said City", "Port Fouad"] },
  "Damietta": { nameAr: "دمياط", cities: ["Damietta City", "Faraskur", "Kafr Saad", "New Damietta", "Ras El Bar"] },
  "Sharqia": { nameAr: "الشرقية", cities: ["Zagazig", "10th of Ramadan", "Belbeis", "Abu Hammad", "Minya El Qamh", "El Husseiniya"] },
  "South Sinai": { nameAr: "جنوب سيناء", cities: ["Sharm El Sheikh", "Dahab", "Nuweiba", "Taba", "Saint Catherine", "El Tor"] },
  "Kafr El Sheikh": { nameAr: "كفر الشيخ", cities: ["Kafr El Sheikh City", "Desouq", "Baltim", "Fouh", "Biala", "Sidi Salem"] },
  "Matrouh": { nameAr: "مطروح", cities: ["Marsa Matrouh", "Siwa", "El Alamein", "El Dabaa"] },
  "Luxor": { nameAr: "الأقصر", cities: ["Luxor City", "Esna", "El Qarna", "Armant"] },
  "Qena": { nameAr: "قنا", cities: ["Qena City", "Nag Hammadi", "Luxor", "Dishna", "Farshut"] },
  "North Sinai": { nameAr: "شمال سيناء", cities: ["Arish", "Rafah", "Sheikh Zuweid", "Bir El Abd"] },
  "Sohag": { nameAr: "سوهاج", cities: ["Sohag City", "Akhmim", "Tahta", "El Maragha", "Girga", "Juhayna"] },
};

const DEFAULT_SHIPPING = 80;

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({
    fullName: "", phone: "", phone2: "",
    governorate: "", city: "", address: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  // govName -> { cost, cities: [{name, cost}] }
  const [govData, setGovData] = useState<Record<string, { cost: number; cities: { name: string; cost: number }[] }>>({});
  const [freeThreshold, setFreeThreshold] = useState(900);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) {
        const items = JSON.parse(saved);
        setCart(items);
        const total = items.reduce((s: number, i: any) => s + i.product.price * i.qty, 0);
        trackInitiateCheckout(total, items.reduce((s: number, i: any) => s + i.qty, 0));
        const sid = sessionStorage.getItem("sid") || Math.random().toString(36).slice(2);
        sessionStorage.setItem("sid", sid);
        fetch(`${API_BASE}/analytics/event`, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_type: "checkout_start", session_id: sid, metadata: { items: items.length, total } }) }).catch(() => {});
      }
    } catch {}

    fetch(`${API_BASE}/settings/shipping_rates`)
      .then(r => r.json())
      .then(d => {
        if (d.value) {
          try {
            const parsed = JSON.parse(d.value);
            if (parsed.rates?.length) {
              const map: Record<string, { cost: number; cities: { name: string; cost: number }[] }> = {};
              parsed.rates.forEach((r: any) => {
                const cities = (r.cities || []).map((c: any) =>
                  typeof c === "string" ? { name: c, cost: r.cost } : c
                );
                map[r.name] = { cost: r.cost, cities };
              });
              setGovData(map);
            }
            if (parsed.freeThreshold) setFreeThreshold(parsed.freeThreshold);
            if (typeof parsed.freeShippingEnabled === "boolean") setFreeShippingEnabled(parsed.freeShippingEnabled);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const selectedGov = form.governorate ? govData[form.governorate] : null;
  const selectedCityObj = selectedGov?.cities.find(c => c.name === form.city);
  const govShipping = selectedCityObj?.cost ?? selectedGov?.cost ?? DEFAULT_SHIPPING;
  const freeShipping = freeShippingEnabled && subtotal >= freeThreshold;
  const shippingCost = freeShipping ? 0 : (form.governorate ? govShipping : 0);
  const finalTotal = subtotal + shippingCost;

  const cities = form.governorate
    ? (selectedGov?.cities.length ? selectedGov.cities.map(c => c.name) : EGYPT_DATA[form.governorate]?.cities || [])
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (cart.length === 0) { setErrorMsg("Your cart is empty!"); return; }
    if (!form.fullName.trim()) { setErrorMsg("Please enter your full name"); return; }
    if (!form.phone.trim() || form.phone.length < 10) { setErrorMsg("Please enter a valid phone number (10+ digits)"); return; }
    if (!form.phone2.trim() || form.phone2.length < 10) { setErrorMsg("Please enter WhatsApp number for deposit confirmation"); return; }
    if (!form.governorate) { setErrorMsg("Please select your governorate"); return; }
    if (!form.city) { setErrorMsg("Please select your city"); return; }
    if (!form.address.trim()) { setErrorMsg("Please enter your address"); return; }

    setSubmitting(true);
    try {
      const payload = {
        customer_name: form.fullName.trim(),
        customer_phone: form.phone.trim(),
        phone2: form.phone2.trim() || null,
        shipping_address: `${form.address}, ${form.city}, ${form.governorate}`,
        customer_city: form.city,
        city: form.city,
        governorate: form.governorate,
        address: form.address.trim(),
        notes: form.notes.trim() || null,
        shipping_cost: shippingCost,
        subtotal,
        total_amount: finalTotal,
        payment_method: "cash_on_delivery",
        status: "pending",
        items: cart.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name_en,
          quantity: i.qty,
          price: i.product.price,
          size: i.size,
          total: i.product.price * i.qty,
        })),
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const oid = data.order?.id || data.id || "";
        setOrderId(oid);
        trackPurchase(oid, finalTotal, cart.map(i => ({ id: i.product.id, qty: i.qty, price: i.product.price })));
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cartUpdated"));
        setSuccess(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || err.message || "Failed to place order");
      }
    } catch (err: any) {
      setErrorMsg("Network error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f7c9", direction: "rtl" }}>
      <div style={{ background: "#f1f7c9", borderRadius: 24, padding: 48, textAlign: "center", maxWidth: 480, boxShadow: "0 8px 40px rgba(75,103,65,0.15)", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: "#2a3a20", fontSize: 26, fontWeight: 800, margin: "0 0 12px" }}>تم الطلب بنجاح!</h2>
        {orderId && <p style={{ color: "#888", margin: "0 0 8px" }}>رقم الطلب: #{orderId.slice(-6)}</p>}
        <p style={{ color: "#555", fontSize: 15, margin: "0 0 24px" }}>شكراً {form.fullName}! سنتواصل معك على {form.phone} لتأكيد الطلب.</p>
        <div style={{ background: "#f1f7c9", borderRadius: 12, padding: "14px 20px", marginBottom: 24, textAlign: "right" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: "#888", fontSize: 13 }}>المجموع الفرعي</span><span style={{ fontWeight: 600 }}>{subtotal} ج.م</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: "#888", fontSize: 13 }}>الشحن إلى {form.governorate}</span><span style={{ fontWeight: 700, color: shippingCost === 0 ? "#166534" : "#333" }}>{shippingCost === 0 ? "مجاني 🎉" : `${shippingCost} ج.م`}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", paddingTop: 8, marginTop: 8 }}><span style={{ fontWeight: 700 }}>الإجمالي</span><span style={{ fontWeight: 800, color: "#4f7032", fontSize: 18 }}>{finalTotal} ج.م</span></div>
        </div>
        <Link href="/" style={{ display: "block", padding: "14px 32px", borderRadius: 12, background: "#4f7032", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
          متابعة التسوق ←
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#f1f7c9", minHeight: "100vh", padding: "24px 14px", fontFamily: "'Readex Pro', 'Cairo', sans-serif", direction: "rtl" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&family=Cairo:wght@300;400;600;700;800;900&display=swap');
        .co-layout { display: grid; grid-template-columns: 1fr 360px; gap: 20px; align-items: start; }
        .co-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .co-summary-sticky { position: sticky; top: 80px; }
        @media (max-width: 768px) {
          .co-layout { grid-template-columns: 1fr !important; }
          .co-form-row { grid-template-columns: 1fr !important; }
          .co-summary-sticky { position: static !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2a3a20", margin: "0 0 20px", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>🛒 إتمام الطلب</h1>

        <div className="co-layout">
          {/* نموذج التوصيل */}
          <div style={{ background: "#f1f7c9", borderRadius: 20, padding: "20px 18px", boxShadow: "0 4px 20px rgba(75,103,65,0.08)" }}>
            <h2 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 700, color: "#2a3a20", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>📋 بيانات التوصيل</h2>

            {errorMsg && <div style={{ background: "#ef444418", border: "1px solid #ef4444", borderRadius: 10, padding: 12, marginBottom: 16, color: "#ef4444", fontWeight: 600, fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>⚠️ {errorMsg}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div className="co-form-row">
                <div>
                  <label style={labelStyle}>الاسم الكامل *</label>
                  <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="اسمك بالكامل" style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>رقم الهاتف *</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} placeholder="01XXXXXXXXX" style={inputStyle} required maxLength={11} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>واتساب * <span style={{ color: "#4f7032", fontSize: 11 }}>(للتأكيد)</span></label>
                <input value={form.phone2} onChange={e => setForm(p => ({ ...p, phone2: e.target.value.replace(/\D/g, "") }))} placeholder="رقم واتساب للتأكيد" style={inputStyle} maxLength={11} required />
              </div>

              <div className="co-form-row">
                <div>
                  <label style={labelStyle}>المحافظة *</label>
                  <select value={form.governorate} onChange={e => setForm(p => ({ ...p, governorate: e.target.value, city: "" }))} style={{ ...inputStyle, cursor: "pointer" }} required>
                    <option value="">اختر المحافظة</option>
                    {Object.entries(EGYPT_DATA).map(([key, val]) => (
                      <option key={key} value={key}>{val.nameAr} — {key}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>المدينة *</label>
                  <select value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }} required disabled={!form.governorate}>
                    <option value="">اختر المدينة</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {form.governorate && govShipping > 0 && (
                <div style={{ background: freeShipping ? "#dcfce7" : "#d7f7b3", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, border: `1px solid ${freeShipping ? "#86efac" : "#c8e6a0"}` }}>
                  <span style={{ fontSize: 18 }}>{freeShipping ? "🎉" : "🚚"}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: freeShipping ? "#166534" : "#4f7032", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>
                    {freeShipping
                      ? `شحن مجاني إلى ${form.governorate} 🎁`
                      : `تكلفة الشحن إلى ${form.governorate}: ${govShipping} ج.م`}
                  </span>
                </div>
              )}

              {/* Progress bar when close to free shipping */}
              {freeShippingEnabled && !freeShipping && subtotal > 0 && (
                <div style={{ background: "#fff8e1", borderRadius: 10, padding: "10px 14px", border: "1px solid #fde68a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#92400e", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>🚚 أضف {(freeThreshold - subtotal).toLocaleString()} ج.م للشحن المجاني!</span>
                    <span style={{ fontSize: 12, color: "#b45309", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>{subtotal}/{freeThreshold}</span>
                  </div>
                  <div style={{ height: 6, background: "#fde68a", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (subtotal / freeThreshold) * 100)}%`, background: "#f59e0b", borderRadius: 3, transition: "width 0.3s" }} />
                  </div>
                </div>
              )}

              <div>
                <label style={labelStyle}>العنوان التفصيلي *</label>
                <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="الشارع، المبنى، الشقة..." style={inputStyle} required />
              </div>

              <div>
                <label style={labelStyle}>ملاحظات (اختياري)</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="أي تعليمات إضافية..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              <button type="submit" disabled={submitting || cart.length === 0}
                style={{ padding: "16px", borderRadius: 14, border: "none", background: "#4f7032", color: "#fff", fontSize: 16, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>
                {submitting ? "جاري إرسال الطلب..." : `إرسال الطلب — ${finalTotal} ج.م`}
              </button>
            </form>
          </div>

          {/* ملخص الطلب */}
          <div>
            <div className="co-summary-sticky" style={{ background: "#f1f7c9", borderRadius: 20, padding: 20, boxShadow: "0 4px 20px rgba(75,103,65,0.08)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#2a3a20", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>📦 ملخص الطلب</h3>

              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, color: "#aaa" }}>
                  <div style={{ fontSize: 40 }}>🛒</div>
                  <p style={{ fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>السلة فارغة</p>
                  <Link href="/shop" style={{ color: "#4f7032", fontWeight: 600, textDecoration: "none", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>← تسوق الآن</Link>
                </div>
              ) : (
                <>
                  <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
                    {cart.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #d7f7b3" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#d7f7b3" }}>
                          {item.product.image_url ? (
                            <img src={item.product.image_url} alt={item.product.name_en} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🫒</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#2a3a20", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>{(item.product as any).name_ar || item.product.name_en}</div>
                          <div style={{ fontSize: 12, color: "#888", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>الكمية: {item.qty}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: "#4f7032", fontSize: 13, flexShrink: 0 }}>{item.product.price * item.qty} ج.م</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: "2px solid #d7f7b3", paddingTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "#888", fontSize: 14, fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>المجموع الفرعي</span>
                      <span style={{ fontWeight: 600 }}>{subtotal} ج.م</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{ color: "#888", fontSize: 14, fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>الشحن {form.governorate ? `(${form.governorate})` : ""}</span>
                      {freeShipping
                        ? <span style={{ fontWeight: 700, color: "#166534", fontSize: 14 }}>مجاني 🎉</span>
                        : <span style={{ fontWeight: 600, color: "#333" }}>{form.governorate ? `${shippingCost} ج.م` : "—"}</span>}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "2px solid #4f7032" }}>
                      <span style={{ fontWeight: 800, fontSize: 16, fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>الإجمالي</span>
                      <span style={{ fontWeight: 800, fontSize: 20, color: "#4f7032" }}>{finalTotal} ج.م</span>
                    </div>
                    <div style={{ background: "#fef3c7", borderRadius: 10, padding: "10px 14px", marginTop: 8, textAlign: "center", fontSize: 13, fontWeight: 600, color: "#92400e", fontFamily: "'Readex Pro', 'Cairo', sans-serif" }}>
                      💵 الدفع عند الاستلام
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: "#5a7050", marginBottom: 6, fontFamily: "'Readex Pro', 'Cairo', sans-serif" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #c8e6a0", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f1f7c9", fontFamily: "'Readex Pro', 'Cairo', sans-serif" };