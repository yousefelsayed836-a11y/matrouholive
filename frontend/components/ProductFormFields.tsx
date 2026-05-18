"use client";

import React from "react";

interface Category {
  id: string;
  name_en: string;
  slug: string;
}

export interface Variant {
  option_name: string;
  option_value: string;
  quantity: number;
  price_override: number | null;
  sku: string;
}

interface ProductFormFieldsProps {
  form: any;
  onChange: (field: string, value: any) => void;
  formId: string;
  categories: Category[];
  uploadingImage: boolean;
  onUploadImages: (files: File[]) => void;
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 6
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box"
};

const ACCENT = "#4B6741";

export default function ProductFormFields({
  form, onChange, formId, categories, uploadingImage, onUploadImages
}: ProductFormFieldsProps) {
  const selectedIds: string[] = Array.isArray(form.category_ids) ? form.category_ids
    : form.category_id ? [form.category_id] : [];

  const images: string[] = Array.isArray(form.images)
    ? form.images.filter(Boolean)
    : form.main_image ? [form.main_image] : [];

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    onChange("images", next);
    onChange("main_image", next[0] || "");
  };

  const toggleCategory = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    onChange("category_ids", next);
    onChange("category_id", next[0] || "");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

      <div>
        <label style={labelStyle}>Name (English) *</label>
        <input type="text" value={form.name_en}
          onChange={e => onChange("name_en", e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Name (Arabic)</label>
        <input type="text" value={form.name_ar}
          onChange={e => onChange("name_ar", e.target.value)}
          style={{ ...inputStyle, direction: "rtl" }} />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Description (English)</label>
        <textarea value={form.description_en}
          onChange={e => onChange("description_en", e.target.value)}
          rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Description (Arabic)</label>
        <textarea value={form.description_ar}
          onChange={e => onChange("description_ar", e.target.value)}
          rows={3} style={{ ...inputStyle, resize: "vertical", direction: "rtl" }} />
      </div>

      <div>
        <label style={labelStyle}>Price (EGP) *</label>
        <input type="number" value={form.price}
          onChange={e => onChange("price", e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Old Price (EGP)</label>
        <input type="number" value={form.old_price}
          onChange={e => onChange("old_price", e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>توفر المنتج *</label>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button type="button" onClick={() => onChange("stock", "100")} style={{
            flex: 1, padding: "11px 0", borderRadius: 10, border: "2px solid",
            borderColor: Number(form.stock) > 0 ? "#22c55e" : "#ddd",
            background: Number(form.stock) > 0 ? "#dcfce7" : "#fff",
            color: Number(form.stock) > 0 ? "#166534" : "#999",
            fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>✅ متوفر</button>
          <button type="button" onClick={() => onChange("stock", "0")} style={{
            flex: 1, padding: "11px 0", borderRadius: 10, border: "2px solid",
            borderColor: Number(form.stock) === 0 ? "#ef4444" : "#ddd",
            background: Number(form.stock) === 0 ? "#fee2e2" : "#fff",
            color: Number(form.stock) === 0 ? "#991b1b" : "#999",
            fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>❌ نفذ المخزون</button>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Material</label>
        <input type="text" value={form.material}
          onChange={e => onChange("material", e.target.value)}
          placeholder="Gold, Silver, Stainless Steel..." style={inputStyle} />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>المجموعات (ممكن تختار أكتر من واحدة)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#fafafa" }}>
          {categories.map(cat => {
            const selected = selectedIds.includes(cat.id);
            return (
              <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)} style={{
                padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 13,
                background: selected ? ACCENT : "#e5e7eb",
                color: selected ? "#fff" : "#555",
              }}>
                {selected ? "✓ " : ""}{cat.name_en}
              </button>
            );
          })}
          {categories.length === 0 && <span style={{ color: "#aaa", fontSize: 13 }}>لا توجد فئات...</span>}
        </div>
        {selectedIds.length > 0 && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>تم اختيار {selectedIds.length} مجموعة</p>}
      </div>

      <div>
        <label style={labelStyle}>Water Resistance</label>
        <input type="text" value={form.water_resistance}
          onChange={e => onChange("water_resistance", e.target.value)}
          placeholder="e.g. 30m, 50m" style={inputStyle} />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Size Info</label>
        <input type="text" value={form.size_info}
          onChange={e => onChange("size_info", e.target.value)}
          placeholder="Adjustable, One Size, 16cm..." style={inputStyle} />
      </div>

      {/* ===== Images Section ===== */}
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>صور المنتج {images.length > 0 && `(${images.length} صورة — الأولى هي الرئيسية)`}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: 10, border: "1px solid #ddd", borderRadius: 10, background: "#fafafa", minHeight: 110 }}>
          {images.map((img, idx) => (
            <div key={idx} style={{ position: "relative", flexShrink: 0 }}>
              <img src={img} alt={`img-${idx}`}
                style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 10,
                  border: idx === 0 ? `3px solid ${ACCENT}` : "2px solid #ddd" }}
                onError={e => { (e.target as HTMLImageElement).style.opacity = "0.3"; }} />
              {idx === 0 && (
                <span style={{ position: "absolute", bottom: 3, left: 3, background: ACCENT, color: "#fff",
                  fontSize: 9, padding: "2px 5px", borderRadius: 4, fontWeight: 700 }}>رئيسية</span>
              )}
              <button type="button" onClick={() => removeImage(idx)}
                style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22,
                  borderRadius: "50%", border: "none", background: "#ef4444", color: "#fff",
                  cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex",
                  alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
            </div>
          ))}

          {/* Upload button */}
          <label style={{ width: 90, height: 90, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 4,
            border: `2px dashed ${ACCENT}`, borderRadius: 10,
            cursor: uploadingImage ? "not-allowed" : "pointer",
            color: ACCENT, opacity: uploadingImage ? 0.5 : 1, flexShrink: 0 }}>
            {uploadingImage
              ? <span style={{ fontSize: 22 }}>⏳</span>
              : <><span style={{ fontSize: 28, lineHeight: 1 }}>+</span><span style={{ fontSize: 11, fontWeight: 700 }}>أضف صور</span></>}
            <input type="file" accept="image/*" multiple style={{ display: "none" }}
              disabled={uploadingImage}
              onChange={e => { if (e.target.files?.length) onUploadImages(Array.from(e.target.files)); }} />
          </label>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#aaa" }}>ممكن ترفع أكتر من صورة في نفس الوقت — اضغط وحدد كلهم</p>
      </div>

      <div style={{
        gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", background: "#fff", borderRadius: 10
      }}>
        <input type="checkbox" id={`${formId}_is_active`} checked={form.is_active}
          onChange={e => onChange("is_active", e.target.checked)}
          style={{ width: 20, height: 20, cursor: "pointer" }} />
        <label htmlFor={`${formId}_is_active`} style={{ fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Product is Active (visible on store)
        </label>
        <span style={{ marginLeft: "auto", fontSize: 12, color: form.is_active ? "#22c55e" : "#6b7280", fontWeight: 700 }}>
          {form.is_active ? "● ACTIVE" : "○ DRAFT"}
        </span>
      </div>

      {/* ===== Variants Section ===== */}
      <div style={{ gridColumn: "1 / -1", borderRadius: 12, border: `1.5px solid #e0ebd6`, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f0f5eb" }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#2d4a28" }}>🎨 المتغيرات (Variants)</span>
            <span style={{ marginRight: 8, fontSize: 12, color: "#888" }}>
              {(form.variants || []).length > 0 ? `${(form.variants || []).length} متغير` : "لا توجد متغيرات"}
            </span>
          </div>
          <button type="button"
            onClick={() => onChange("variants", [...(form.variants || []), { option_name: "", option_value: "", quantity: 1, price_override: null, sku: "" }])}
            style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            + إضافة متغير
          </button>
        </div>

        {(form.variants || []).length > 0 && (
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 100px 90px 36px", gap: 8, padding: "0 4px" }}>
              {["اسم الخيار", "القيمة", "الكمية", "سعر مخصص", "SKU", ""].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 700, color: "#888" }}>{h}</span>
              ))}
            </div>
            {(form.variants as Variant[]).map((v, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 100px 90px 36px", gap: 8, alignItems: "center", background: "#fafafa", borderRadius: 8, padding: 8 }}>
                {[
                  { val: v.option_name, key: "option_name", ph: "مثال: اللون" },
                  { val: v.option_value, key: "option_value", ph: "مثال: أحمر" },
                ].map(f => (
                  <input key={f.key} value={f.val} placeholder={f.ph}
                    onChange={e => { const u = [...form.variants]; u[i] = { ...u[i], [f.key]: e.target.value }; onChange("variants", u); }}
                    style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
                ))}
                <input type="number" value={v.quantity} min={0}
                  onChange={e => { const u = [...form.variants]; u[i] = { ...u[i], quantity: Number(e.target.value) }; onChange("variants", u); }}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
                <input type="number" value={v.price_override ?? ""} min={0} placeholder="اختياري"
                  onChange={e => { const u = [...form.variants]; u[i] = { ...u[i], price_override: e.target.value ? Number(e.target.value) : null }; onChange("variants", u); }}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
                <input value={v.sku} placeholder="SKU"
                  onChange={e => { const u = [...form.variants]; u[i] = { ...u[i], sku: e.target.value }; onChange("variants", u); }}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
                <button type="button"
                  onClick={() => onChange("variants", (form.variants as Variant[]).filter((_, j) => j !== i))}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#fee2e2", color: "#ef4444", fontWeight: 700, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
