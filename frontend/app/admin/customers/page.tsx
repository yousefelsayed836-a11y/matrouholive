"use client";
import { useState, useEffect } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

interface Customer {
  customer_phone: string;
  customer_name: string;
  shipping_address: string;
  city: string;
  governorate: string;
  order_count: number;
  total_spent: number;
  last_order_date: string;
  first_order_date: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  shipping_cost: number;
  created_at: string;
  items: { product_name: string; quantity: number; price: number; size?: string }[];
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: "#fef3c7", color: "#92400e", label: "معلق" },
  processing: { bg: "#dbeafe", color: "#1e40af", label: "جاري" },
  completed:  { bg: "#dcfce7", color: "#166534", label: "مكتمل" },
  delivered:  { bg: "#dcfce7", color: "#166534", label: "تم التسليم" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b", label: "ملغي" },
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/orders/customers`)
      .then(r => r.json())
      .then(d => setCustomers(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCustomer = async (c: Customer) => {
    setSelected(c);
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders/customer/${encodeURIComponent(c.customer_phone)}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
    setOrdersLoading(false);
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (c.customer_name || "").toLowerCase().includes(q) ||
           (c.customer_phone || "").includes(q) ||
           (c.city || "").toLowerCase().includes(q) ||
           (c.governorate || "").toLowerCase().includes(q);
  });

  const fmt = (n: number) => Number(n).toLocaleString("ar-EG", { minimumFractionDigits: 0 });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e", direction: "rtl" }}>👥 العملاء</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888", direction: "rtl" }}>بيانات العملاء من الطلبات</p>
        </div>
        <div style={{ background: "#f0f5eb", borderRadius: 12, padding: "10px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#4B6741" }}>{customers.length}</div>
          <div style={{ fontSize: 12, color: "#666" }}>إجمالي العملاء</div>
        </div>
      </div>

      <input
        type="text"
        placeholder="ابحث باسم العميل أو الهاتف أو المدينة..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", maxWidth: 420, padding: "12px 16px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, marginBottom: 20, direction: "rtl", boxSizing: "border-box" }}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#888" }}>جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#888" }}>لا يوجد عملاء</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                {["العميل", "الهاتف", "العنوان", "عدد الطلبات", "إجمالي الإنفاق", "آخر طلب", ""].map(h => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "right", fontSize: 13, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.customer_phone}
                  style={{ borderBottom: "1px solid #f5f5f5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "14px 16px", direction: "rtl" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{c.customer_name || "—"}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 14, color: "#4B6741", fontWeight: 700 }}>{c.customer_phone}</div>
                  </td>
                  <td style={{ padding: "14px 16px", direction: "rtl", maxWidth: 200 }}>
                    <div style={{ fontSize: 13, color: "#555", lineHeight: 1.4 }}>
                      {[c.shipping_address, c.city, c.governorate].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <span style={{ display: "inline-block", background: "#e0e7ff", color: "#3730a3", borderRadius: 20, padding: "4px 12px", fontWeight: 700, fontSize: 13 }}>
                      {c.order_count} طلب
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#4B6741" }}>{fmt(c.total_spent)} EGP</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#888", fontSize: 12, whiteSpace: "nowrap" }}>
                    {new Date(c.last_order_date).toLocaleDateString("ar-EG")}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button onClick={() => openCustomer(c)}
                      style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#4B6741,#3a5232)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                      عرض الطلبات
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer orders modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 720, maxHeight: "88vh", overflow: "auto", padding: 28 }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, direction: "rtl" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>{selected.customer_name}</h2>
                <div style={{ fontSize: 14, color: "#4B6741", fontWeight: 700, marginTop: 4 }}>{selected.customer_phone}</div>
                {(selected.city || selected.governorate) && (
                  <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                    {[selected.shipping_address, selected.city, selected.governorate].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              <button onClick={() => setSelected(null)}
                style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#f3f4f6", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 20, direction: "rtl" }}>
              <div style={{ flex: 1, background: "#f0f5eb", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#4B6741" }}>{selected.order_count}</div>
                <div style={{ fontSize: 12, color: "#666" }}>طلبات</div>
              </div>
              <div style={{ flex: 1, background: "#fef9c3", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#854d0e" }}>{fmt(selected.total_spent)}</div>
                <div style={{ fontSize: 12, color: "#666" }}>EGP إجمالي</div>
              </div>
              <div style={{ flex: 1, background: "#ede9fe", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#5b21b6" }}>
                  {new Date(selected.first_order_date).toLocaleDateString("ar-EG")}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>أول طلب</div>
              </div>
            </div>

            {ordersLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>جاري التحميل...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, direction: "rtl" }}>
                {orders.map(o => {
                  const s = STATUS_COLORS[o.status] || { bg: "#f3f4f6", color: "#6b7280", label: o.status };
                  return (
                    <div key={o.id} style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, color: "#4B6741" }}>#{o.id.slice(-6).toUpperCase()}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                          <span style={{ fontSize: 13, color: "#888" }}>{new Date(o.created_at).toLocaleDateString("ar-EG")}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {(o.items || []).map((item, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555" }}>
                            <span>{item.product_name}{item.size ? ` (${item.size})` : ""} × {item.quantity}</span>
                            <span style={{ fontWeight: 600 }}>{fmt(item.price * item.quantity)} EGP</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                        <span style={{ color: "#888" }}>شحن: {Number(o.shipping_cost) === 0 ? "مجاني" : `${o.shipping_cost} EGP`}</span>
                        <span style={{ fontWeight: 800, color: "#1a1a2e" }}>الإجمالي: {fmt(o.total_amount)} EGP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
