"use client";

import { useState, useEffect } from "react";

interface CityRate {
  name: string;
  cost: number;
}

interface GovRate {
  name: string;
  nameAr: string;
  cost: number; // default for new cities
  cities: CityRate[];
}

const mk = (names: string[], cost: number): CityRate[] => names.map(n => ({ name: n, cost }));

const DEFAULT_RATES: GovRate[] = [
  { name: "Cairo", nameAr: "القاهرة", cost: 60, cities: mk(["Cairo City", "Nasr City", "Heliopolis", "Maadi", "Zamalek", "New Cairo", "6th of October City", "Shorouk", "Badr City", "Obour"], 60) },
  { name: "Giza", nameAr: "الجيزة", cost: 60, cities: mk(["Giza City", "Dokki", "Mohandessin", "Haram", "Imbaba", "6th of October", "Sheikh Zayed", "Faysal"], 60) },
  { name: "Qalyubia", nameAr: "القليوبية", cost: 65, cities: mk(["Banha", "Shubra El Kheima", "Qalyub", "Khanka", "Tukh", "Qaha"], 65) },
  { name: "Alexandria", nameAr: "الإسكندرية", cost: 70, cities: mk(["Alexandria City", "Sidi Gaber", "Smouha", "Miami", "Montaza", "Borg El Arab", "Abu Qir"], 70) },
  { name: "Dakahlia", nameAr: "الدقهلية", cost: 80, cities: mk(["Mansoura", "Talkha", "Mit Ghamr", "Belqas", "Aga", "Sherbin", "Dekernes"], 80) },
  { name: "Beheira", nameAr: "البحيرة", cost: 80, cities: mk(["Damanhur", "Kafr El Dawwar", "Rashid", "Edku", "Abu Hummus"], 80) },
  { name: "Fayoum", nameAr: "الفيوم", cost: 80, cities: mk(["Fayoum City", "Ibsheway", "Sinnuris", "Tamiya", "Yusuf El Seddiq"], 80) },
  { name: "Gharbia", nameAr: "الغربية", cost: 80, cities: mk(["Tanta", "El Mahalla El Kubra", "Kafr El Zayat", "Zefta", "El Sadat City"], 80) },
  { name: "Ismailia", nameAr: "الإسماعيلية", cost: 80, cities: mk(["Ismailia City", "Fayed", "Qantara", "El Tal El Kabir"], 80) },
  { name: "Menofia", nameAr: "المنوفية", cost: 80, cities: mk(["Shebin El Kom", "Menouf", "Ashmoun", "Quesna", "Sadat City", "Birket El Sab"], 80) },
  { name: "Suez", nameAr: "السويس", cost: 80, cities: mk(["Suez City", "Ain Sokhna", "Ataqah"], 80) },
  { name: "Beni Suef", nameAr: "بني سويف", cost: 80, cities: mk(["Beni Suef City", "El Fashn", "Beba", "Nasser", "Somsta"], 80) },
  { name: "Port Said", nameAr: "بورسعيد", cost: 80, cities: mk(["Port Said City", "Port Fouad"], 80) },
  { name: "Damietta", nameAr: "دمياط", cost: 80, cities: mk(["Damietta City", "Faraskur", "Kafr Saad", "New Damietta", "Ras El Bar"], 80) },
  { name: "Sharqia", nameAr: "الشرقية", cost: 80, cities: mk(["Zagazig", "10th of Ramadan", "Belbeis", "Abu Hammad", "Minya El Qamh", "El Husseiniya"], 80) },
  { name: "Kafr El Sheikh", nameAr: "كفر الشيخ", cost: 80, cities: mk(["Kafr El Sheikh City", "Desouq", "Baltim", "Fouh", "Biala", "Sidi Salem"], 80) },
  { name: "Minya", nameAr: "المنيا", cost: 85, cities: mk(["Minya City", "Abu Qurqas", "Mallawi", "Maghagha", "Beni Mazar", "Matay"], 85) },
  { name: "Assiut", nameAr: "أسيوط", cost: 90, cities: mk(["Assiut City", "Abnub", "Manfalut", "Dairut", "El Qusiya", "Sahel Selim"], 90) },
  { name: "Sohag", nameAr: "سوهاج", cost: 90, cities: mk(["Sohag City", "Akhmim", "Tahta", "El Maragha", "Girga", "Juhayna"], 90) },
  { name: "Qena", nameAr: "قنا", cost: 95, cities: mk(["Qena City", "Nag Hammadi", "Dishna", "Farshut"], 95) },
  { name: "Red Sea", nameAr: "البحر الأحمر", cost: 100, cities: mk(["Hurghada", "Safaga", "El Quseir", "Marsa Alam", "Ras Gharib"], 100) },
  { name: "Aswan", nameAr: "أسوان", cost: 100, cities: mk(["Aswan City", "Edfu", "Kom Ombo", "Abu Simbel", "Daraw"], 100) },
  { name: "Luxor", nameAr: "الأقصر", cost: 100, cities: mk(["Luxor City", "Esna", "El Qarna", "Armant"], 100) },
  { name: "North Sinai", nameAr: "شمال سيناء", cost: 100, cities: mk(["Arish", "Rafah", "Sheikh Zuweid", "Bir El Abd"], 100) },
  { name: "Matrouh", nameAr: "مطروح", cost: 110, cities: mk(["Marsa Matrouh", "Siwa", "El Alamein", "El Dabaa"], 110) },
  { name: "South Sinai", nameAr: "جنوب سيناء", cost: 110, cities: mk(["Sharm El Sheikh", "Dahab", "Nuweiba", "Taba", "Saint Catherine", "El Tor"], 110) },
  { name: "New Valley", nameAr: "الوادي الجديد", cost: 120, cities: mk(["Kharga", "Dakhla", "Farafra", "Baris"], 120) },
];

// migrate old string[] cities to CityRate[]
function normalizeCities(cities: (string | CityRate)[], defaultCost: number): CityRate[] {
  return cities.map(c => typeof c === "string" ? { name: c, cost: defaultCost } : c);
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

interface FreeOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  governorate: string;
  total_amount: number;
  shipping_cost: number;
  status: string;
  created_at: string;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthStartStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function ShippingPage() {
  const [rates, setRates] = useState<GovRate[]>(DEFAULT_RATES);
  const [freeThreshold, setFreeThreshold] = useState(900);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newCity, setNewCity] = useState<Record<string, { name: string; cost: string }>>({});
  const [activeTab, setActiveTab] = useState<"rates" | "reports">("rates");
  const [reportFrom, setReportFrom] = useState(monthStartStr());
  const [reportTo, setReportTo] = useState(todayStr());
  const [reportOrders, setReportOrders] = useState<FreeOrder[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/settings/shipping_rates`)
      .then(r => r.json())
      .then(d => {
        if (d.value) {
          try {
            const parsed = JSON.parse(d.value);
            if (parsed.rates?.length) {
              setRates(parsed.rates.map((r: any) => ({
                ...r,
                cities: normalizeCities(r.cities || [], r.cost),
              })));
            }
            if (parsed.freeThreshold) setFreeThreshold(parsed.freeThreshold);
            if (typeof parsed.freeShippingEnabled === "boolean") setFreeShippingEnabled(parsed.freeShippingEnabled);
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
        body: JSON.stringify({ value: JSON.stringify({ rates, freeThreshold, freeShippingEnabled }) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const updateGovCost = (govName: string, cost: number) =>
    setRates(prev => prev.map(r => r.name === govName ? { ...r, cost, cities: r.cities.map(c => ({ ...c, cost })) } : r));

  const updateCityCost = (govName: string, cityName: string, cost: number) =>
    setRates(prev => prev.map(r =>
      r.name === govName
        ? { ...r, cities: r.cities.map(c => c.name === cityName ? { ...c, cost } : c) }
        : r
    ));

  const removeCity = (govName: string, cityName: string) =>
    setRates(prev => prev.map(r =>
      r.name === govName ? { ...r, cities: r.cities.filter(c => c.name !== cityName) } : r
    ));

  const addCity = (govName: string) => {
    const n = newCity[govName];
    if (!n?.name.trim()) return;
    const cityName = n.name.trim();
    const cost = parseInt(n.cost) || rates.find(r => r.name === govName)?.cost || 80;
    setRates(prev => prev.map(r =>
      r.name === govName ? { ...r, cities: [...r.cities, { name: cityName, cost }] } : r
    ));
    setNewCity(p => ({ ...p, [govName]: { name: "", cost: String(rates.find(r => r.name === govName)?.cost || 80) } }));
  };

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const params = new URLSearchParams({ free_shipping: "true" });
      if (reportFrom) params.set("date_from", reportFrom);
      if (reportTo)   params.set("date_to", reportTo);
      const r = await fetch(`${API_BASE}/orders?${params}`);
      const data = await r.json();
      setReportOrders(Array.isArray(data) ? data : []);
    } catch {}
    setReportLoading(false);
  };

  const filtered = rates.filter(r =>
    !search.trim() ||
    r.nameAr.includes(search) ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cities.some(c => c.name.toLowerCase().includes(search.toLowerCase()))
  );

  const avg = Math.round(rates.reduce((s, r) => s + r.cost, 0) / rates.length);

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#888" }}>جاري التحميل...</div>;

  return (
    <>
      <div>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e", direction: "rtl" }}>🚚 الشحن</h1>
            </div>
            {activeTab === "rates" && (
              <button onClick={save} disabled={saving}
                style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: saved ? "#22c55e" : "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15, opacity: saving ? 0.7 : 1 }}>
                {saved ? "✅ تم الحفظ!" : saving ? "جاري الحفظ..." : "💾 حفظ التغييرات"}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f3f4f6", borderRadius: 12, padding: 4, width: "fit-content" }}>
            {([["rates", "🚚 أسعار الشحن"], ["reports", "📊 تقارير الشحن المجاني"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit",
                  background: activeTab === key ? "#fff" : "transparent",
                  color: activeTab === key ? "#4B6741" : "#888",
                  boxShadow: activeTab === key ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                  transition: "all .15s" }}>
                {label}
              </button>
            ))}
          </div>

          {/* ===== REPORTS TAB ===== */}
          {activeTab === "reports" && (
            <div>
              {/* Date filter */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#666" }}>من تاريخ</p>
                  <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}
                    style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                </div>
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#666" }}>إلى تاريخ</p>
                  <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)}
                    style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                </div>
                <button onClick={fetchReport} disabled={reportLoading}
                  style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: reportLoading ? "not-allowed" : "pointer", opacity: reportLoading ? 0.7 : 1 }}>
                  {reportLoading ? "جاري البحث..." : "🔍 عرض التقرير"}
                </button>
                {/* Quick ranges */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { label: "هذا الشهر", from: monthStartStr(), to: todayStr() },
                    { label: "آخر 7 أيام", from: (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0,10); })(), to: todayStr() },
                    { label: "آخر 30 يوم",  from: (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0,10); })(), to: todayStr() },
                  ].map(q => (
                    <button key={q.label} onClick={() => { setReportFrom(q.from); setReportTo(q.to); }}
                      style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #ddd", background: "#f9fafb", color: "#555", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary cards */}
              {reportOrders.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "عدد أوردرات الشحن المجاني", value: reportOrders.length, color: "#4B6741" },
                    { label: "إجمالي مبيعات هذه الأوردرات", value: `${reportOrders.reduce((s, o) => s + Number(o.total_amount), 0).toLocaleString("ar-EG")} ج.م`, color: "#1e40af" },
                    { label: "توفير الشحن (لو اتحسب)", value: `${(reportOrders.length * 80).toLocaleString("ar-EG")} ج.م`, color: "#92400e" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 11, color: "#888", lineHeight: 1.4 }}>{s.label}</p>
                      <p style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Table */}
              {reportOrders.length === 0 && !reportLoading ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa", background: "#fff", borderRadius: 16 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                  <p style={{ margin: 0, fontSize: 15 }}>اضغط "عرض التقرير" لعرض أوردرات الشحن المجاني</p>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, direction: "rtl" }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "2px solid #f0f0f0" }}>
                          {["التاريخ", "الاسم", "الهاتف", "المدينة", "المحافظة", "الإجمالي", "الحالة"].map(h => (
                            <th key={h} style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportOrders.map((o, i) => (
                          <tr key={o.id} style={{ borderBottom: "1px solid #f5f5f5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={{ padding: "11px 14px", color: "#666", whiteSpace: "nowrap" }}>
                              {new Date(o.created_at).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" })}
                            </td>
                            <td style={{ padding: "11px 14px", fontWeight: 600, color: "#1a1a2e" }}>{o.customer_name}</td>
                            <td style={{ padding: "11px 14px", color: "#555", direction: "ltr", textAlign: "right" }}>{o.customer_phone}</td>
                            <td style={{ padding: "11px 14px", color: "#555" }}>{o.city || "—"}</td>
                            <td style={{ padding: "11px 14px", color: "#555" }}>{o.governorate || "—"}</td>
                            <td style={{ padding: "11px 14px", fontWeight: 700, color: "#4B6741" }}>{Number(o.total_amount).toLocaleString("ar-EG")} ج.م</td>
                            <td style={{ padding: "11px 14px" }}>
                              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                background: o.status === "delivered" ? "#dcfce7" : o.status === "cancelled" ? "#fee2e2" : "#fef3c7",
                                color: o.status === "delivered" ? "#166534" : o.status === "cancelled" ? "#991b1b" : "#92400e" }}>
                                {o.status === "pending" ? "قيد الانتظار" : o.status === "processing" ? "جاري" : o.status === "shipped" ? "شُحن" : o.status === "delivered" ? "تم التسليم" : o.status === "cancelled" ? "ملغي" : o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== RATES TAB ===== */}
          {activeTab === "rates" && <>

          {/* Free Shipping Toggle */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 32 }}>🎁</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>الشحن المجاني</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>
                {freeShippingEnabled ? "مفعّل — الأوردرات فوق الحد تحصل على شحن مجاني" : "موقف — كل الأوردرات تدفع رسوم الشحن"}
              </p>
            </div>
            <button onClick={() => setFreeShippingEnabled(v => !v)}
              style={{ width: 56, height: 28, borderRadius: 14, border: "none", cursor: "pointer", position: "relative", background: freeShippingEnabled ? "#4B6741" : "#ddd", transition: "background 0.2s", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 3, left: freeShippingEnabled ? 30 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
            </button>
          </div>

          {freeShippingEnabled && (
            <div style={{ background: "#f5f9ee", borderRadius: 16, padding: 20, marginBottom: 20, border: "1.5px solid #c8d9b0", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 24 }}>💰</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>الحد الأدنى للشحن المجاني</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#666" }}>الأوردرات بأكثر من هذا المبلغ تحصل على شحن مجاني تلقائياً</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={freeThreshold} onChange={e => setFreeThreshold(Number(e.target.value))}
                  style={{ width: 120, padding: "10px 14px", borderRadius: 10, border: "2px solid #4B6741", fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none" }} />
                <span style={{ fontWeight: 700, color: "#888" }}>EGP</span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "المحافظات", value: rates.length, color: "#4B6741" },
              { label: "متوسط الشحن", value: `${avg} EGP`, color: "#1e40af" },
              { label: "الشحن المجاني", value: freeShippingEnabled ? `فوق ${freeThreshold} EGP` : "موقف", color: freeShippingEnabled ? "#166534" : "#ef4444" },
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

          {/* Governorates */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(gov => {
              const isOpen = expandedId === gov.name;
              const nc = newCity[gov.name] || { name: "", cost: String(gov.cost) };
              return (
                <div key={gov.name} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: isOpen ? "1.5px solid #c8d9b0" : "1.5px solid transparent" }}>

                  {/* Governorate header row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", cursor: "pointer" }}
                    onClick={() => setExpandedId(isOpen ? null : gov.name)}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>{gov.nameAr}</span>
                      <span style={{ fontSize: 12, color: "#aaa", marginRight: 8 }}>{gov.name}</span>
                      <span style={{ fontSize: 12, color: "#888" }}>({gov.cities.length} مدينة)</span>
                    </div>
                    {/* Default cost for this governorate */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>سعر افتراضي</span>
                      <input type="number" value={gov.cost}
                        onChange={e => updateGovCost(gov.name, Number(e.target.value))}
                        style={{ width: 72, padding: "6px 8px", borderRadius: 8, border: "1.5px solid #c8d9b0", fontSize: 13, fontWeight: 700, textAlign: "center", outline: "none", color: "#4B6741" }} />
                      <span style={{ fontSize: 12, color: "#888" }}>EGP</span>
                    </div>
                    <span style={{ fontSize: 16, color: "#aaa", userSelect: "none", marginRight: 4 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>

                  {/* Expanded: per-city pricing table */}
                  {isOpen && (
                    <div style={{ borderTop: "1px solid #f0f0f0", padding: "12px 18px 16px" }}>
                      <p style={{ margin: "0 0 10px", fontSize: 12, color: "#888", fontWeight: 600 }}>سعر الشحن لكل مدينة</p>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                        {gov.cities.map(city => (
                          <div key={city.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "#f9fafb", borderRadius: 10, border: "1px solid #eee" }}>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{city.name}</span>
                            <input type="number" value={city.cost}
                              onChange={e => updateCityCost(gov.name, city.name, Number(e.target.value))}
                              style={{ width: 72, padding: "5px 8px", borderRadius: 7, border: "1.5px solid #c8d9b0", fontSize: 13, fontWeight: 700, textAlign: "center", outline: "none", color: "#4B6741" }} />
                            <span style={{ fontSize: 12, color: "#888", minWidth: 28 }}>EGP</span>
                            <button onClick={() => removeCity(gov.name, city.name)}
                              style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px" }}>×</button>
                          </div>
                        ))}
                        {gov.cities.length === 0 && (
                          <p style={{ color: "#bbb", fontSize: 13, margin: 0, fontStyle: "italic" }}>لا توجد مدن — أضف مدينة أدناه</p>
                        )}
                      </div>

                      {/* Add city */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input placeholder="اسم المدينة" value={nc.name}
                          onChange={e => setNewCity(p => ({ ...p, [gov.name]: { ...nc, name: e.target.value } }))}
                          onKeyDown={e => e.key === "Enter" && addCity(gov.name)}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                        <input type="number" placeholder="السعر" value={nc.cost}
                          onChange={e => setNewCity(p => ({ ...p, [gov.name]: { ...nc, cost: e.target.value } }))}
                          style={{ width: 80, padding: "8px 10px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 13, fontWeight: 700, textAlign: "center", outline: "none" }} />
                        <span style={{ fontSize: 12, color: "#888" }}>EGP</span>
                        <button onClick={() => addCity(gov.name)}
                          style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#4B6741", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
                          + إضافة
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
          </>}
      </div>
    </>
  );
}
