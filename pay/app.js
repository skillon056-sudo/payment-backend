// ================== CONFIG ==================
const API_BASE = "https://api.digitalcart.space/api";

// ================== GET ORDER ==================
const params = new URLSearchParams(window.location.search);
const orderId = params.get("order");

const qrImg = document.getElementById("qrImg");
const amountEl = document.getElementById("amount");
const statusEl = document.getElementById("status");
const upiBtn = document.getElementById("upiBtn");

if (!orderId) {
  statusEl.innerText = "Invalid Order";
  throw new Error("Order ID missing");
}

// ================== LOAD PAYMENT ==================
async function loadPayment() {
  try {
    const res = await fetch(`${API_BASE}/order-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: orderId })
    });

    const data = await res.json();

    if (data.status !== "success") {
      statusEl.innerText = "Unable to load payment";
      return;
    }

    // Amount
    amountEl.innerText = `Amount: ₹${data.amount}`;

    // QR Code
    qrImg.src =
      "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
      encodeURIComponent(data.payment_data);

    // UPI Intent
    upiBtn.onclick = () => {
      window.location.href = data.payment_data;
    };

    // Start polling backend status
    startStatusPolling();

  } catch (err) {
    console.error(err);
    statusEl.innerText = "Network error";
  }
}

// ================== POLL BACKEND ==================
function startStatusPolling() {
  statusEl.innerText = "Waiting for payment...";

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderId })
      });

      const result = await res.json();

      if (result.status === "success") {
        clearInterval(interval);
        window.location.href = `/success.html?order=${orderId}`;
      }

      if (result.status === "failed") {
        clearInterval(interval);
        statusEl.innerText = "Payment failed";
      }

      // pending → do nothing

    } catch (e) {
      console.error("Polling error", e);
    }
  }, 2000);
}

// ================== INIT ==================
loadPayment();
