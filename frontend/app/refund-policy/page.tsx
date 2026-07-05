"use client";
import Link from "next/link";

const G  = "#4f7032";
const GL = "#d7f7b3";
const CB = "#f1f7c9";
const AU = "#bd9a52";
const DK = "#2d2b27";

export default function RefundPolicyPage() {
  return (
    <div style={{ minHeight: "100vh", background: CB, fontFamily: "'Readex Pro', 'Cairo', sans-serif", direction: "rtl" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&family=Cairo:wght@300;400;600;700;800;900&display=swap');
        * { font-family: 'Cairo', 'Readex Pro', sans-serif; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ background: GL, padding: "12px 24px", borderBottom: "1px solid #c8d9b0" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", fontSize: 13, color: "#6a8a5a", display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/" style={{ color: G, textDecoration: "none", fontWeight: 600 }}>الرئيسية</Link>
          <span style={{ color: "#aaa" }}>←</span>
          <span style={{ color: DK, fontWeight: 700 }}>سياسة الإرجاع والاستبدال</span>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px 60px" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", boxShadow: "0 4px 24px rgba(79,112,50,0.08)", border: "1px solid #e8f0e0" }}>

          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, color: DK }}>سياسة الإرجاع والاستبدال</h1>
          <p style={{ margin: "0 0 32px", fontSize: 13, color: "#aaa" }}>آخر تحديث: يوليو 2026</p>

          <Section title="1. مدة الإرجاع">
            <p>يحق للعميل طلب إرجاع المنتج خلال <strong>7 أيام</strong> من تاريخ الاستلام، بشرط أن يكون المنتج في حالته الأصلية ولم يُستخدم.</p>
          </Section>

          <Section title="2. شروط قبول الإرجاع">
            <ul>
              <li>المنتج في حالته الأصلية غير مفتوح أو مستخدم.</li>
              <li>العبوة الأصلية سليمة.</li>
              <li>يرفق العميل فاتورة الشراء أو رقم الطلب.</li>
              <li>لم يمر أكثر من 7 أيام على تاريخ الاستلام.</li>
            </ul>
          </Section>

          <Section title="3. حالات لا يُقبل فيها الإرجاع">
            <ul>
              <li>المنتجات التي فُتحت وجُرِّبت.</li>
              <li>المنتجات التالفة بسبب سوء الاستخدام.</li>
              <li>الطلبات التي مضى عليها أكثر من 7 أيام من تاريخ الاستلام.</li>
              <li>المنتجات المخفضة أو العروض الخاصة (يُذكر ذلك وقت الشراء).</li>
            </ul>
          </Section>

          <Section title="4. طريقة الإرجاع">
            <p>لطلب الإرجاع أو الاستبدال، يرجى التواصل معنا عبر:</p>
            <ul>
              <li>واتساب: <a href="https://wa.me/201229555229" style={{ color: G, fontWeight: 700 }}>01229555229</a></li>
              <li>الاتصال المباشر: <a href="tel:+201229555229" style={{ color: G, fontWeight: 700 }}>01229555229</a></li>
            </ul>
            <p>سنقوم بالتواصل معك لترتيب استلام المنتج أو تحديد موعد للاستبدال.</p>
          </Section>

          <Section title="5. استرداد المبلغ">
            <p>في حال الموافقة على الإرجاع، يتم استرداد المبلغ كاملاً <strong>نقداً عند استلام المنتج المُعاد</strong>، أو عن طريق إضافته كرصيد للطلب القادم حسب اتفاق الطرفين.</p>
            <p>تكلفة شحن الإرجاع يتحملها العميل إلا في حالة وجود عيب مصنعي.</p>
          </Section>

          <Section title="6. المنتجات التالفة أو الخاطئة">
            <p>إذا استلمت منتجاً تالفاً أو مختلفاً عن طلبك، يرجى التواصل معنا خلال <strong>48 ساعة</strong> من الاستلام مع إرفاق صور للمنتج، وسنتكفل بالاستبدال الكامل أو رد المبلغ دون أي تكاليف إضافية.</p>
          </Section>

          <div style={{ marginTop: 36, padding: "18px 22px", background: "#f0fdf4", borderRadius: 14, border: "1.5px solid #86efac" }}>
            <p style={{ margin: 0, fontSize: 14, color: "#166534", fontWeight: 600 }}>
              📞 للاستفسار: <a href="https://wa.me/201229555229" style={{ color: G }}>واتساب 01229555229</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: "#4f7032", borderRight: "4px solid #4f7032", paddingRight: 12 }}>{title}</h2>
      <div style={{ fontSize: 14, lineHeight: 2.1, color: "#444" }}>{children}</div>
    </div>
  );
}
