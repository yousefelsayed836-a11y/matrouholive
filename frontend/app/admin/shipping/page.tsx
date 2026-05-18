"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface GovRate {
  name: string;
  nameAr: string;
  cost: number;
  cities: string[];
}

interface ShippingData {
  rates: GovRate[];
  freeThreshold: number;
}

const DEFAULT_RATES: GovRate[] = [
  { name: "Cairo", nameAr: "القاهرة", cost: 60, cities: ["Cairo City", "Nasr City", "Heliopolis", "Maadi", "Zamalek", "New Cairo", "6th of October City", "Shorouk", "Badr City", "Obour"] },
  { name: "Giza", nameAr: "الجيزة", cost: 60, cities: ["Giza City", "Dokki", "Mohandessin", "Haram", "Imbaba", "6th of October", "Sheikh Zayed", "Faysal"] },
  { name: "Qalyubia", nameAr: "القليوبية", cost: 65, cities: ["Banha", "Shubra El Kheima", "Qalyub", "Khanka", "Tukh", "Qaha"] },
  { name: "Alexandria", nameAr: "الإسكندرية", cost: 70, cities: ["Alexandria City", "Sidi Gaber", "Smouha", "Miami", "Montaza", "Borg El Arab", "Abu Qir"] },
  { name: "Dakahlia", nameAr: "الدقهلية", cost: 80, cities: ["Mansoura", "Talkha", "Mit Ghamr", "Belqas", "Aga", "Sherbin", "Dekernes"] },
  { name: "Beheira", nameAr: "البحيرة", cost: 80, cities: ["Damanhur", "Kafr El Dawwar", "Rashid", "Edku", "Abu Hummus"] },
  { name: "Fayoum", nameAr: "الفيوم", cost: 80, cities: ["Fayoum City", "Ibsheway", "Sinnuris", "Tamiya", "Yusuf El Seddiq"] },
  { name: "Gharbia", nameAr: "الغربية", cost: 80, cities: ["Tanta", "El Mahalla El Kubra", "Kafr El Zayat", "Zefta", "El Sadat City"] },
  { name: "Ismailia", nameAr: "الإسماعيلية", cost: 80, cities: ["Ismailia City", "Fayed", "Qantara", "El Tal El Kabir"] },
  { name: "Menofia", nameAr: "المنوفية", cost: 80, cities: ["Shebin El Kom", "Menouf", "Ashmoun", "Quesna", "Sadat City", "Birket El Sab"] },
  { name: "Suez", nameAr: "السويس", cost: 80, cities: ["Suez City", "Ain Sokhna", "Ataqah"] },
  { name: "Beni Suef", nameAr: "بني سويف", cost: 80, cities: ["Beni Suef City", "El Fashn", "Beba", "Nasser", "Somsta"] },
  { name: "Port Said", nameAr: "بورسعيد", cost: 80, cities: ["Port Said City", "Port Fouad"] },
  { name: "Damietta", nameAr: "دمياط", cost: 80, cities: ["Damietta City", "Faraskur", "Kafr Saad", "New Damietta", "Ras El Bar"] },
  { name: "Sharqia", nameAr: "الشرقية", cost: 80, cities: ["Zagazig", "10th of Ramadan", "Belbeis", "Abu Hammad", "Minya El Qamh", "El Husseiniya"] },
  { name: "Kafr El Sheikh", nameAr: "كفر الشيخ", cost: 80, cities: ["Kafr El Sheikh City", "Desouq", "Baltim", "Fouh", "Biala", "Sidi Salem"] },
  { name: "Minya", nameAr: "المنيا", cost: 85, cities: ["Minya City", "Abu Qurqas", "Mallawi", "Maghagha", "Beni Mazar", "Matay"] },
  { name: "Assiut", nameAr: "أسيوط", cost: 90, cities: ["Assiut City", "Abnub", "Manfalut", "Dairut", "El Qusiya", "Sahel Selim"] },
  { name: "Sohag", nameAr: "سوهاج", cost: 90, cities: ["Sohag City", "Akhmim", "Tahta", "El Maragha", "Girga", "Juhayna"] },
  { name: "Qena", nameAr: "قنا", cost: 95, cities: ["Qena City", "Nag Hammadi", "Dishna", "Farshut"] },
  { name: "Red Sea", nameAr: "البحر الأحمر", cost: 100, cities: ["Hurghada", "Safaga", "El Quseir", "Marsa Alam", "Ras Gharib"] },
  { name: "Aswan", nameAr: "أسوان", cost: 100, cities: ["Aswan City", "Edfu", "Kom Ombo", "Abu Simbel", "Daraw"] },
  { name: "Luxor", nameAr: "الأقصر", cost: 100, cities: ["Luxor City", "Esna", "El Qarna", "Armant"] },
  { name: "North Sinai", nameAr: "شمال سيناء", cost: 100, cities: ["Arish", "Rafah", "Sheikh Zuweid", "Bir El Abd"] },
  { name: "Matrouh", nameAr: "مطروح", cost: 110, cities: ["Marsa Matrouh", "Siwa", "El Alamein", "El Dabaa"] },
  { name: "South Sinai", nameAr: "جنوب سيناء", cost: 110, cities: ["Sharm El Sheikh", "Dahab", "Nuweiba", "Taba", "Saint Catherine", "El Tor"] },
  { name: "New Valley", nameAr: "الوادي الجديد", cost: 120, cities: ["Kharga", "Dakhla", "Farafra", "Baris"] },
];

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

export default function ShippingPage() {
  const [rates, setRates] = useState<GovRate[]>(DEFAULT_RATES);
  const [freeThreshold, setFreeThreshold] = useState(900);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newCityInput, setNewCityInput] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${API_BASE}/settings/shipping_rates`)
      .then(r => r.json())
      .then(d => {
        if (d.value) {
          try {
            const parsed = JSON.parse(d.value);
            if (parsed.rates?.length) setRates(parsed.rates);
            if (parsed.freeThreshold) setFreeThreshold(parsed.freeThreshold);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/settings/shipping_rates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: JSON.stringify({ rates, freeThreshold }) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const updateCost = (name: string, cost: number) =>
    setRates(prev => prev.map(r => r.name === name ? { ...r, cost } : r));

  const addCity = (name: string) => {
    const city = (newCityInput[name] || "").trim();
    if (!city) return;
    setRates(prev => prev.map(r => r.name === name ? { ...r, cities: [...r.cities, city] } : r));
    setNewCityInput(p => ({ ...p, [name]: "" }));
  };

  const removeCity = (name: string, city: string) =>
    setRates(prev => prev.map(r => r.name === name ? { ...r, cities: r.cities.filter(c => c !== city) } : r));

  const filtered = rates.filter(r =>
    !search.trim() ||
    r.nameAr.includes(search) ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cities.some(c => c.toLowerCase().includes(search.toLowerCase()))
  );

  const avg = Math.round(rates.reduce((s, r) => s + r.cost, 0) / rates.length);

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#888" }}>جاري التحميل...</div>;

  return (
    <>
      <style jsx global>{`* { box-sizing: border-box; } body { margin: 0; font-family: 'Segoe UI', sans-serif; background: #f5f5f5; }`}</style>

      <div style={{ minHeight: "100vh", padding: 24 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <Link href="/admin" style={{ color: "#4B6741", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>← Back to Dashboard</Link>
              <h1 style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 800, color: "#1a1a2e" }}>🚚 أسعار الشحن</h1>
              <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>التعديلات تنعكس فوراً على الموقع عند الحفظ</p>
            </div>
            <button onClick={save} disabled={saving}
              style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: saved ? "#22c55e" : "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15, opacity: saving ? 0.7 : 1 }}>
              {saved ? "✅ تم الحفظ!" : saving ? "جاري الحفظ..." : "💾 حفظ التغييرات"}
            </button>
          </div>

          {/* Free Shipping Threshold */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 32 }}>🎁</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>حد الشحن المجاني</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>الأوردرات فوق هذا المبلغ تحصل على شحن مجاني</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="number" value={freeThreshold}
                onChange={e => setFreeThreshold(Number(e.target.value))}
                style={{ width: 120, padding: "10px 14px", borderRadius: 10, border: "2px solid #4B6741", fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none" }} />
              <span style={{ fontWeight: 700, color: "#888" }}>EGP</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "المحافظات", value: rates.length, color: "#4B6741" },
              { label: "متوسط الشحن", value: `${avg} EGP`, color: "#1e40af" },
              { label: "الشحن المجاني فوق", value: `${freeThreshold} EGP`, color: "#166534" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{s.label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <input type="text" placeholder="🔍 ابحث بالمحافظة أو المدينة..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #ddd", fontSize: 14, marginBottom: 16, outline: "none", fontFamily: "inherit" }} />

          {/* Governorates List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(gov => {
              const isOpen = expandedId === gov.name;
              return (
                <div key={gov.name} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: isOpen ? "1.5px solid #c8d9b0" : "1.5px solid transparent" }}>

                  {/* Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }}
                    onClick={() => setExpandedId(isOpen ? null : gov.name)}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>{gov.nameAr}</span>
                      <span style={{ fontSize: 12, color: "#aaa", marginRight: 8 }}>{gov.name}</span>
                      <span style={{ fontSize: 12, color: "#888", marginRight: 8 }}>({gov.cities.length} مدينة)</span>
                    </div>
                    {/* Cost inline edit */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                      <input
                        type="number"
                        value={gov.cost}
                        onChange={e => updateCost(gov.name, Number(e.target.value))}
                        style={{ width: 80, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #c8d9b0", fontSize: 14, fontWeight: 700, textAlign: "center", outline: "none", color: "#4B6741" }}
                      />
                      <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>EGP</span>
                    </div>
                    <span style={{ fontSize: 18, color: "#aaa", userSelect: "none" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>

                  {/* Expanded: cities */}
                  {isOpen && (
                    <div style={{ padding: "0 18px 16px", borderTop: "1px solid #f0f0f0" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12, marginBottom: 10 }}>
                        {gov.cities.map(city => (
                          <span key={city} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 20, background: "#f0f7ee", border: "1px solid #c8d9b0", fontSize: 12, fontWeight: 600, color: "#3a5232" }}>
                            {city}
                            <button onClick={() => removeCity(gov.name, city)}
                              style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1, fontWeight: 700 }}>×</button>
                          </span>
                        ))}
                        {gov.cities.length === 0 && <span style={{ color: "#bbb", fontSize: 12, fontStyle: "italic" }}>لا توجد مدن</span>}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          placeholder="+ إضافة مدينة..."
                          value={newCityInput[gov.name] || ""}
                          onChange={e => setNewCityInput(p => ({ ...p, [gov.name]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && addCity(gov.name)}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                        />
                        <button onClick={() => addCity(gov.name)}
                          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#4B6741", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                          إضافة
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 24, textAlign: "left" }}>
            <button onClick={save} disabled={saving}
              style={{ padding: "14px 36px", borderRadius: 12, border: "none", background: saved ? "#22c55e" : "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 16, opacity: saving ? 0.7 : 1 }}>
              {saved ? "✅ تم الحفظ!" : saving ? "جاري الحفظ..." : "💾 حفظ كل التغييرات"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
