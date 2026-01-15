const params = new URLSearchParams(window.location.search);
const order = params.get("order");

const statusEl = document.getElementById("status");
const qrImg = document.getElementById("qrImg");
const amountEl = document.getElementById("amount");
const upiBtn = document.getElementById("upiBtn");

if (!order) {
  statusEl.innerText = "Invalid order";
  throw new Error("Order missing");
}

let intervalId = null;

async function initPayment() {
  try {
    // 1️⃣ Order info lao
    const res = await fetch("https://api.digitalcart.space/api/order-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order })
    });

    const data = await res.json();

    if (data.status !== "success" || !data.payment_data) {
      statusEl.innerText = "Unable to load payment";
      return;
    }

    // 2️⃣ Amount
    amountEl.innerText = "Amount: ₹" + data.amount;

    // 3️⃣ QR generate
    qrImg.src =
      "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
      encodeURIComponent(data.payment_data);

    // 4️⃣ UPI Intent
    upiBtn.onclick = () => {
      window.location.href = data.payment_data;
    };

    // 5️⃣ AUTO CHECK – har 2 sec (IMPORTANT)
    intervalId = setInterval(checkPaymentStatus, 2000);

  } catch (err) {
    console.error("Init error:", err);
    statusEl.innerText = "Payment init failed";
  }
}

async function checkPaymentStatus() {
  try {
    const res = await fetch("https://api.digitalcart.space/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order })
    });

    const result = await res.json();

    console.log("Verify response:", result);

    if (result.status === "success") {
      clearInterval(intervalId); // ⛔ stop polling
      window.location.href = "/success.html?order=" + order;
    }

    if (result.status === "error" && result.message === "Payment failed") {
      clearInterval(intervalId);
      statusEl.innerText = "Payment failed";
    }

  } catch (err) {
    console.error("Verify error:", err);
  }
}

statusEl.innerText = "Waiting for payment...";
initPayment();
