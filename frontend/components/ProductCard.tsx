'use client';

import Link from 'next/link';

interface Product {
  id: string;
  name_en: string;
  name_ar?: string;
  price: number;
  old_price?: number;
  main_image?: string;
  images?: string[];
  material?: string;
  stock?: number;
}

const GREEN = "#4B6741";
const CREAM = "#E8EDD0";
const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getImg(p: Product) {
  const img = p.main_image || (p.images && p.images[0]);
  if (!img) return `https://placehold.co/400x400/4B6741/fff?text=${encodeURIComponent((p.name_ar || p.name_en)?.slice(0,3) || "؟")}`;
  return img.startsWith("http") ? img : `${BACKEND}${img}`;
}

export default function ProductCard({ product }: { product: Product }) {
  const name = product.name_ar || product.name_en;
  const hasDisc = product.old_price && product.old_price > product.price;
  const disc = hasDisc ? Math.round((1 - product.price / product.old_price!) * 100) : 0;
  const img = getImg(product);

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #eef4e8", boxShadow: "0 2px 14px rgba(75,103,65,.07)", transition: "transform .22s, box-shadow .22s", direction: "rtl" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 28px rgba(75,103,65,.16)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 14px rgba(75,103,65,.07)"; }}>
      <Link href={`/products/${product.id}`} style={{ textDecoration: "none", display: "block" }}>
        <div style={{ position: "relative", height: 230, background: "#f5f9ee", overflow: "hidden" }}>
          <img
            src={img}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.35s" }}
            onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/400x400/4B6741/fff?text=${encodeURIComponent(name.slice(0,3))}`; }}
          />
          {hasDisc && (
            <span style={{ position: "absolute", top: 10, right: 10, background: "#ef4444", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
              -{disc}%
            </span>
          )}
        </div>
      </Link>

      <div style={{ padding: "14px 14px 16px" }}>
        <Link href={`/products/${product.id}`} style={{ textDecoration: "none" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#1a2a10", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 38 } as any}>
            {name}
          </h3>
          {product.name_ar && (
            <p style={{ margin: "0 0 8px", fontSize: 11, color: "#aaa", lineHeight: 1.3 }}>{product.name_en}</p>
          )}
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: product.material ? 8 : 0 }}>
          <span style={{ fontSize: 17, fontWeight: 900, color: GREEN }}>{product.price} ج.م</span>
          {hasDisc && (
            <span style={{ fontSize: 12, color: "#ccc", textDecoration: "line-through" }}>{product.old_price} ج.م</span>
          )}
        </div>

        {product.material && (
          <p style={{ margin: 0, fontSize: 11, color: "#7a9a6a", fontWeight: 600 }}>{product.material}</p>
        )}
      </div>
    </div>
  );
}
