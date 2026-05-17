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
  onUploadImage: (file: File) => void;
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
  form, onChange, formId, categories, uploadingImage, onUploadImage
}: ProductFormFieldsProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

      <div>
        <label style={labelStyle}>Name (English) *</label>
        <input
          type="text"
          value={form.name_en}
          onChange={e => onChange("name_en", e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Name (Arabic)</label>
        <input
          type="text"
          value={form.name_ar}
          onChange={e => onChange("name_ar", e.target.value)}
          style={{ ...inputStyle, direction: "rtl" }}
        />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Description (English)</label>
        <textarea
          value={form.description_en}
          onChange={e => onChange("description_en", e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Description (Arabic)</label>
        <textarea
          value={form.description_ar}
          onChange={e => onChange("description_ar", e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", direction: "rtl" }}
        />
      </div>

      <div>
        <label style={labelStyle}>Price (EGP) *</label>
        <input
          type="number"
          value={form.price}
          onChange={e => onChange("price", e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Old Price (EGP)</label>
        <input
          type="number"
          value={form.old_price}
          onChange={e => onChange("old_price", e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>توفر المنتج *</label>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => onChange("stock", "100")}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 10, border: "2px solid",
              borderColor: Number(form.stock) > 0 ? "#22c55e" : "#ddd",
              background: Number(form.stock) > 0 ? "#dcfce7" : "#fff",
              color: Number(form.stock) > 0 ? "#166534" : "#999",
              fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
            }}>
            ✅ متوفر
          </button>
          <button
            type="button"
            onClick={() => onChange("stock", "0")}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 10, border: "2px solid",
              borderColor: Number(form.stock) === 0 ? "#ef4444" : "#ddd",
              background: Number(form.stock) === 0 ? "#fee2e2" : "#fff",
              color: Number(form.stock) === 0 ? "#991b1b" : "#999",
              fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
            }}>
            ❌ نفذ المخزون
          </button>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Material</label>
        <input
          type="text"
          value={form.material}
          onChange={e => onChange("material", e.target.value)}
          placeholder="Gold, Silver, Stainless Steel..."
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Category</label>
        <select
          value={form.category_id}
          onChange={e => onChange("category_id", e.target.value)}
          style={inputStyle}
        >
          <option value="">— No Category —</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name_en}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Water Resistance</label>
        <input
          type="text"
          value={form.water_resistance}
          onChange={e => onChange("water_resistance", e.target.value)}
          placeholder="e.g. 30m, 50m"
          style={inputStyle}
        />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Size Info</label>
        <input
          type="text"
          value={form.size_info}
          onChange={e => onChange("size_info", e.target.value)}
          placeholder="Adjustable, One Size, 16cm..."
          style={inputStyle}
        />
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>Product Image</label>
        <input
          type="text"
          value={form.main_image}
          onChange={e => onChange("main_image", e.target.value)}
          placeholder="https://... or upload below"
          style={{ ...inputStyle, marginBottom: 8 }}
        />
        <label style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 8, border: "2px dashed #4B6741",
          cursor: uploadingImage ? "not-allowed" : "pointer",
          color: "#4B6741", fontWeight: 600, fontSize: 13,
          opacity: uploadingImage ? 0.6 : 1,
        }}>
          {uploadingImage ? "⏳ Uploading..." : "📤 Upload Image from Device"}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            disabled={uploadingImage}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onUploadImage(file);
            }}
          />
        </label>
        {form.main_image && (
          <div style={{ marginTop: 10 }}>
            <img
              src={form.main_image.startsWith("http") ? form.main_image : `http://localhost:5000${form.main_image}`}
              alt="Preview"
              style={{ width: 100, height: 100, borderRadius: 10, objectFit: "cover", border: "2px solid #4B6741" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
      </div>

      <div style={{
        gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", background: "#fff", borderRadius: 10
      }}>
        <input
          type="checkbox"
          id={`${formId}_is_active`}
          checked={form.is_active}
          onChange={e => onChange("is_active", e.target.checked)}
          style={{ width: 20, height: 20, cursor: "pointer" }}
        />
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
          <button
            type="button"
            onClick={() => {
              const v: Variant = { option_name: "", option_value: "", quantity: 1, price_override: null, sku: "" };
              onChange("variants", [...(form.variants || []), v]);
            }}
            style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            + إضافة متغير
          </button>
        </div>

        {(form.variants || []).length > 0 && (
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 100px 90px 36px", gap: 8, padding: "0 4px" }}>
              {["اسم الخيار", "القيمة", "الكمية", "سعر مخصص", "SKU", ""].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 700, color: "#888" }}>{h}</span>
              ))}
            </div>

            {(form.variants as Variant[]).map((v, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 100px 90px 36px", gap: 8, alignItems: "center", background: "#fafafa", borderRadius: 8, padding: "8px" }}>
                <input
                  value={v.option_name}
                  onChange={e => {
                    const updated = [...form.variants];
                    updated[i] = { ...updated[i], option_name: e.target.value };
                    onChange("variants", updated);
                  }}
                  placeholder="مثال: اللون"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: "100%", boxSizing: "border-box" }}
                />
                <input
                  value={v.option_value}
                  onChange={e => {
                    const updated = [...form.variants];
                    updated[i] = { ...updated[i], option_value: e.target.value };
                    onChange("variants", updated);
                  }}
                  placeholder="مثال: أحمر"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: "100%", boxSizing: "border-box" }}
                />
                <input
                  type="number"
                  value={v.quantity}
                  min={0}
                  onChange={e => {
                    const updated = [...form.variants];
                    updated[i] = { ...updated[i], quantity: Number(e.target.value) };
                    onChange("variants", updated);
                  }}
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: "100%", boxSizing: "border-box" }}
                />
                <input
                  type="number"
                  value={v.price_override ?? ""}
                  min={0}
                  onChange={e => {
                    const updated = [...form.variants];
                    updated[i] = { ...updated[i], price_override: e.target.value ? Number(e.target.value) : null };
                    onChange("variants", updated);
                  }}
                  placeholder="اختياري"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: "100%", boxSizing: "border-box" }}
                />
                <input
                  value={v.sku}
                  onChange={e => {
                    const updated = [...form.variants];
                    updated[i] = { ...updated[i], sku: e.target.value };
                    onChange("variants", updated);
                  }}
                  placeholder="SKU"
                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: "100%", boxSizing: "border-box" }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = (form.variants as Variant[]).filter((_, j) => j !== i);
                    onChange("variants", updated);
                  }}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#fee2e2", color: "#ef4444", fontWeight: 700, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

