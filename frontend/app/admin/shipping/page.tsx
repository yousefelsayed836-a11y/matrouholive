"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Zone {
  id: string;
  name: string;
  cost: number;
  cities: string[];
}

interface ShippingData {
  zones: Zone[];
  freeThreshold: number;
}

const DEFAULT_DATA: ShippingData = {
  freeThreshold: 900,
  zones: [
    { id: "z1", name: "القاهرة الكبرى", cost: 60, cities: ["القاهرة", "الجيزة", "القليوبية"] },
    { id: "z2", name: "الدلتا", cost: 80, cities: ["الدقهلية", "الغربية", "المنوفية", "البحيرة", "كفر الشيخ", "دمياط", "الشرقية"] },
    { id: "z3", name: "الإسكندرية والساحل", cost: 70, cities: ["الإسكندرية", "مطروح"] },
    { id: "z4", name: "قناة السويس", cost: 80, cities: ["الإسماعيلية", "السويس", "بورسعيد"] },
    { id: "z5", name: "الصعيد", cost: 90, cities: ["المنيا", "بني سويف", "الفيوم", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان"] },
    { id: "z6", name: "البحر الأحمر وسيناء", cost: 110, cities: ["البحر الأحمر", "جنوب سيناء", "شمال سيناء"] },
    { id: "z7", name: "الوادي الجديد", cost: 120, cities: ["الوادي الجديد"] },
  ],
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

export default function ShippingPage() {
  const [data, setData] = useState<ShippingData>(DEFAULT_DATA);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Editing state
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editZoneName, setEditZoneName] = useState("");
  const [editZoneCost, setEditZoneCost] = useState(0);
  const [newCityInput, setNewCityInput] = useState<Record<string, string>>({});

  // New zone form
  const [showAddZone, setShowAddZone] = useState(false);
  const [newZone, setNewZone] = useState({ name: "", cost: 80, cities: "" });

  useEffect(() => {
    fetch(`${API_BASE}/settings/shipping_rates`)
      .then(r => r.json())
      .then(d => {
        if (d.value) {
          try { setData(JSON.parse(d.value)); } catch {}
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
        body: JSON.stringify({ value: JSON.stringify(data) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const updateZoneCost = (id: string, cost: number) =>
    setData(d => ({ ...d, zones: d.zones.map(z => z.id === id ? { ...z, cost } : z) }));

  const startEditZone = (z: Zone) => {
    setEditingZoneId(z.id);
    setEditZoneName(z.name);
    setEditZoneCost(z.cost);
  };

  const saveEditZone = () => {
    setData(d => ({ ...d, zones: d.zones.map(z => z.id === editingZoneId ? { ...z, name: editZoneName, cost: editZoneCost } : z) }));
    setEditingZoneId(null);
  };

  const deleteZone = (id: string) =>
    setData(d => ({ ...d, zones: d.zones.filter(z => z.id !== id) }));

  const addCity = (zoneId: string) => {
    const city = (newCityInput[zoneId] || "").trim();
    if (!city) return;
    setData(d => ({ ...d, zones: d.zones.map(z => z.id === zoneId ? { ...z, cities: [...z.cities, city] } : z) }));
    setNewCityInput(prev => ({ ...prev, [zoneId]: "" }));
  };

  const removeCity = (zoneId: string, city: string) =>
    setData(d => ({ ...d, zones: d.zones.map(z => z.id === zoneId ? { ...z, cities: z.cities.filter(c => c !== city) } : z) }));

  const addZone = () => {
    if (!newZone.name.trim()) return;
    const cities = newZone.cities.split(",").map(c => c.trim()).filter(Boolean);
    setData(d => ({ ...d, zones: [...d.zones, { id: `z${Date.now()}`, name: newZone.name.trim(), cost: newZone.cost, cities }] }));
    setNewZone({ name: "", cost: 80, cities: "" });
    setShowAddZone(false);
  };

  const filteredZones = data.zones.filter(z => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return z.name.includes(q) || z.cities.some(c => c.includes(q));
  });

  const totalCities = data.zones.reduce((s, z) => s + z.cities.length, 0);

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
              <h1 style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 800, color: "#1a1a2e" }}>🚚 مناطق الشحن</h1>
              <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>إدارة مناطق الشحن والمدن وتسعيرها</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddZone(true)}
                style={{ padding: "11px 22px", borderRadius: 12, border: "2px solid #4B6741", background: "#fff", color: "#4B6741", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                + إضافة منطقة
              </button>
              <button onClick={save} disabled={saving}
                style={{ padding: "11px 28px", borderRadius: 12, border: "none", background: saved ? "#22c55e" : "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                {saved ? "✅ تم الحفظ!" : saving ? "جاري الحفظ..." : "💾 حفظ التغييرات"}
              </button>
            </div>
          </div>

          {/* Free Shipping Threshold */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 32 }}>🎁</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>الشحن المجاني</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>الأوردرات فوق هذا المبلغ تحصل على شحن مجاني</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="number" value={data.freeThreshold}
                onChange={e => setData(d => ({ ...d, freeThreshold: Number(e.target.value) }))}
                style={{ width: 120, padding: "10px 14px", borderRadius: 10, border: "2px solid #4B6741", fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none" }} />
              <span style={{ fontWeight: 700, color: "#888" }}>EGP</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "المناطق", value: data.zones.length, color: "#4B6741" },
              { label: "المدن الكلية", value: totalCities, color: "#1e40af" },
              { label: "الشحن المجاني فوق", value: `${data.freeThreshold} EGP`, color: "#166534" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{s.label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <input type="text" placeholder="🔍 ابحث باسم المنطقة أو المدينة..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid #ddd", fontSize: 14, marginBottom: 20, outline: "none", fontFamily: "inherit" }} />

          {/* Add Zone Form */}
          {showAddZone && (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", border: "2px solid #4B6741" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1a1a2e", fontSize: 16, fontWeight: 800 }}>➕ إضافة منطقة جديدة</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 12 }}>
                <input placeholder="اسم المنطقة (مثلاً: الدلتا)" value={newZone.name}
                  onChange={e => setNewZone(p => ({ ...p, name: e.target.value }))}
                  style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="number" placeholder="سعر الشحن" value={newZone.cost}
                    onChange={e => setNewZone(p => ({ ...p, cost: Number(e.target.value) }))}
                    style={{ width: 120, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, fontWeight: 700, textAlign: "center", outline: "none" }} />
                  <span style={{ color: "#888", fontWeight: 600 }}>EGP</span>
                </div>
              </div>
              <input placeholder="المدن (افصل بفاصلة: القاهرة, الجيزة, ...)" value={newZone.cities}
                onChange={e => setNewZone(p => ({ ...p, cities: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={addZone}
                  style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  إضافة
                </button>
                <button onClick={() => setShowAddZone(false)}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #ddd", background: "#fff", color: "#666", fontWeight: 600, cursor: "pointer" }}>
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Zones List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredZones.map(zone => (
              <div key={zone.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

                {/* Zone Header */}
                {editingZoneId === zone.id ? (
                  <div style={{ padding: "14px 20px", background: "#f5f9ee", borderBottom: "1px solid #e2ead8", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input value={editZoneName} onChange={e => setEditZoneName(e.target.value)}
                      style={{ flex: 1, minWidth: 160, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #4B6741", fontSize: 15, fontWeight: 700, outline: "none", fontFamily: "inherit" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="number" value={editZoneCost} onChange={e => setEditZoneCost(Number(e.target.value))}
                        style={{ width: 100, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #4B6741", fontSize: 15, fontWeight: 700, textAlign: "center", outline: "none" }} />
                      <span style={{ color: "#888", fontSize: 13, fontWeight: 600 }}>EGP</span>
                    </div>
                    <button onClick={saveEditZone}
                      style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#4B6741", color: "#fff", fontWeight: 700, cursor: "pointer" }}>حفظ</button>
                    <button onClick={() => setEditingZoneId(null)}
                      style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#666", cursor: "pointer" }}>إلغاء</button>
                  </div>
                ) : (
                  <div style={{ padding: "14px 20px", background: "#f5f9ee", borderBottom: "1px solid #e2ead8", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>{zone.name}</span>
                      <span style={{ fontSize: 13, color: "#888" }}>{zone.cities.length} مدينة</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 18, color: "#4B6741" }}>{zone.cost} EGP</span>
                      <button onClick={() => startEditZone(zone)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #4B6741", background: "#fff", color: "#4B6741", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                        ✏️ تعديل
                      </button>
                      <button onClick={() => deleteZone(zone.id)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #ef4444", background: "#fff", color: "#ef4444", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                )}

                {/* Cities */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {zone.cities.map(city => (
                      <span key={city} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "#f0f7ee", border: "1px solid #c8d9b0", fontSize: 13, fontWeight: 600, color: "#3a5232" }}>
                        {city}
                        <button onClick={() => removeCity(zone.id, city)}
                          style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1, fontWeight: 700 }}>×</button>
                      </span>
                    ))}
                    {zone.cities.length === 0 && (
                      <span style={{ color: "#bbb", fontSize: 13, fontStyle: "italic" }}>لا يوجد مدن في هذه المنطقة</span>
                    )}
                  </div>

                  {/* Add city input */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      placeholder="+ إضافة مدينة..."
                      value={newCityInput[zone.id] || ""}
                      onChange={e => setNewCityInput(p => ({ ...p, [zone.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && addCity(zone.id)}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                    />
                    <button onClick={() => addCity(zone.id)}
                      style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#4B6741", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                      إضافة
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredZones.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 16, color: "#888" }}>
              مفيش مناطق مطابقة للبحث
            </div>
          )}

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
