const { Resend } = require('resend');

const resend = new Resend('re_fDJXD7dM_GPbSHeTPCfsRezHsPeD4d3BN');

const STATUS_LABELS = {
  pending: 'قيد الانتظار',
  processing: 'جاري التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

function buildOrderEmailHtml(order, items) {
  const orderId = String(order.id).slice(-6).toUpperCase();
  const statusLabel = STATUS_LABELS[order.status] || order.status || 'قيد الانتظار';

  const itemsRows = (items || []).map(item => {
    const itemTotal = item.total !== undefined ? item.total : item.price * item.quantity;
    return `
      <tr>
        <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb;">${item.product_name || '-'}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:center;">${Number(item.price).toFixed(2)} ج.م</td>
        <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:center;">${Number(itemTotal).toFixed(2)} ج.م</td>
      </tr>`;
  }).join('');

  const shippingDisplay = Number(order.shipping_cost) === 0
    ? 'مجاني 🎉'
    : `${Number(order.shipping_cost).toFixed(2)} ج.م`;

  const phone2Row = order.phone2
    ? `<tr><td style="padding:6px 12px; color:#6b7280; font-weight:600;">هاتف بديل:</td><td style="padding:6px 12px;">${order.phone2}</td></tr>`
    : '';

  const notesRow = order.notes
    ? `<tr><td style="padding:6px 12px; color:#6b7280; font-weight:600;">ملاحظات:</td><td style="padding:6px 12px;">${order.notes}</td></tr>`
    : '';

  const governorateDisplay = order.governorate ? ` - ${order.governorate}` : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>طلب جديد #${orderId}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#15803d); padding:28px 32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">🫒 مطروح أوليف</h1>
              <p style="margin:8px 0 0; color:#bbf7d0; font-size:14px;">طلب جديد وصل!</p>
            </td>
          </tr>

          <!-- Order ID badge -->
          <tr>
            <td style="padding:24px 32px 0; text-align:center;">
              <span style="display:inline-block; background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; border-radius:8px; padding:8px 20px; font-size:18px; font-weight:700;">
                طلب رقم #${orderId}
              </span>
            </td>
          </tr>

          <!-- Customer Info -->
          <tr>
            <td style="padding:24px 32px 0;">
              <h2 style="margin:0 0 12px; font-size:16px; color:#111827; border-bottom:2px solid #d1fae5; padding-bottom:8px;">بيانات العميل</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#374151;">
                <tr>
                  <td style="padding:6px 12px; color:#6b7280; font-weight:600;">الاسم:</td>
                  <td style="padding:6px 12px;">${order.customer_name}</td>
                </tr>
                <tr style="background:#f9fafb;">
                  <td style="padding:6px 12px; color:#6b7280; font-weight:600;">الهاتف:</td>
                  <td style="padding:6px 12px;">${order.customer_phone}</td>
                </tr>
                ${phone2Row}
                <tr style="background:#f9fafb;">
                  <td style="padding:6px 12px; color:#6b7280; font-weight:600;">العنوان:</td>
                  <td style="padding:6px 12px;">${order.shipping_address || '-'}</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px; color:#6b7280; font-weight:600;">المدينة / المحافظة:</td>
                  <td style="padding:6px 12px;">${order.city || '-'}${governorateDisplay}</td>
                </tr>
                ${notesRow}
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding:24px 32px 0;">
              <h2 style="margin:0 0 12px; font-size:16px; color:#111827; border-bottom:2px solid #d1fae5; padding-bottom:8px;">المنتجات</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#374151; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                <thead>
                  <tr style="background:#f0fdf4;">
                    <th style="padding:10px 12px; text-align:right; font-weight:600; color:#15803d; border-bottom:2px solid #bbf7d0;">المنتج</th>
                    <th style="padding:10px 12px; text-align:center; font-weight:600; color:#15803d; border-bottom:2px solid #bbf7d0;">الكمية</th>
                    <th style="padding:10px 12px; text-align:center; font-weight:600; color:#15803d; border-bottom:2px solid #bbf7d0;">السعر</th>
                    <th style="padding:10px 12px; text-align:center; font-weight:600; color:#15803d; border-bottom:2px solid #bbf7d0;">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows || '<tr><td colspan="4" style="padding:12px; text-align:center; color:#9ca3af;">لا توجد منتجات</td></tr>'}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding:20px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#374151;">
                <tr>
                  <td style="padding:6px 0; color:#6b7280;">الشحن:</td>
                  <td style="padding:6px 0; text-align:left; color:${Number(order.shipping_cost) === 0 ? '#16a34a' : '#374151'}; font-weight:${Number(order.shipping_cost) === 0 ? '700' : '400'};">${shippingDisplay}</td>
                </tr>
                <tr style="border-top:2px solid #d1fae5;">
                  <td style="padding:10px 0 0; font-size:16px; font-weight:700; color:#111827;">الإجمالي الكلي:</td>
                  <td style="padding:10px 0 0; text-align:left; font-size:18px; font-weight:700; color:#15803d;">${Number(order.total_amount).toFixed(2)} ج.م</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status -->
          <tr>
            <td style="padding:20px 32px 28px; text-align:center;">
              <span style="display:inline-block; background:#fef9c3; color:#854d0e; border:1px solid #fde68a; border-radius:20px; padding:6px 18px; font-size:13px; font-weight:600;">
                الحالة: ${statusLabel}
              </span>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0fdf4; padding:16px 32px; text-align:center; border-top:1px solid #d1fae5;">
              <p style="margin:0; font-size:12px; color:#6b7280;">مطروح أوليف · زيت الزيتون الأصيل</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendOrderEmail(order, items) {
  const orderId = String(order.id).slice(-6).toUpperCase();
  const html = buildOrderEmailHtml(order, items);

  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'yousefelsayed836@gmail.com',
    subject: `🛒 طلب جديد #${orderId} - ${order.customer_name}`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }

  return data;
}

module.exports = { sendOrderEmail };
