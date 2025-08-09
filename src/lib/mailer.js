import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.FROM_EMAIL || smtpUser;

// Create a singleton transporter
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

export async function sendEmail({ to, subject, html, text }) {
  if (!to) throw new Error("Missing 'to' address for email");
  if (!fromEmail) throw new Error("Missing FROM_EMAIL/SMTP_USER for email sending");

  await transporter.sendMail({
    from: fromEmail,
    to,
    subject,
    text,
    html,
  });
}

function formatCurrencyINR(amount) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(amount || 0));
  } catch {
    return `₹${Number(amount || 0)}`;
  }
}

function buildItemsHtml(items) {
  if (!Array.isArray(items) || items.length === 0) return "<p>No items found in order.</p>";

  const rows = items
    .map((item) => {
      const qty = item.quantity || 1;
      const price = Number(item.price || 0);
      const lineTotal = qty * price;
      return `
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;">${item.name || "Item"}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${qty}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${formatCurrencyINR(price)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${formatCurrencyINR(lineTotal)}</td>
        </tr>`;
    })
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
      <thead>
        <tr>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Item</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;">Qty</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Price</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
}

function buildAdminOrderEmailHtml(order) {
  const items = Array.isArray(order?.productList) ? order.productList : [];
  const sellerName = order?.seller?.restaurantName || order?.seller?.username || "Unknown Seller";
  const customerName = order?.user?.name || "Customer";
  const customerEmail = order?.user?.email || "N/A";
  const customerPhone = order?.user?.phone || "N/A";
  const address = order?.deliveryAddress || "N/A";
  const total = formatCurrencyINR(order?.totalPrice);
  const created = order?.createdAt ? new Date(order.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "";

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#111827;">
    <h2>New Payment Captured</h2>
    <p>A payment has been captured successfully for the following order.</p>
    <div style="margin-top:12px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;">
      <p><strong>Order ID:</strong> ${order?.orderId || order?.id}</p>
      <p><strong>Payment ID:</strong> ${order?.paymentId || ""}</p>
      <p><strong>Status:</strong> ${order?.paymentStatus || "completed"}</p>
      <p><strong>Placed At:</strong> ${created}</p>
      <p><strong>Seller:</strong> ${sellerName}</p>
      <p><strong>Total:</strong> ${total}</p>
    </div>

    <h3 style="margin-top:16px;">Customer Details</h3>
    <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#ffffff;">
      <p><strong>Name:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Phone:</strong> ${customerPhone}</p>
      <p><strong>Address:</strong> ${address}</p>
    </div>

    <h3 style="margin-top:16px;">Items</h3>
    ${buildItemsHtml(items)}
  </div>`;
}

export async function sendAdminOrderEmail({ order, to }) {
    try{
        console.log("Sending admin email for captured payment:", order);
        const subject = `Payment Captured - Order ${order?.orderId || order?.id}`;
        const html = buildAdminOrderEmailHtml(order);
        const text = `Payment captured for order ${order?.orderId || order?.id}. Total: ${order?.totalPrice}.`;
        await sendEmail({ to, subject, html, text });
    }catch(error){
        console.error("Failed to send admin email for captured payment:", error);
    }
}


