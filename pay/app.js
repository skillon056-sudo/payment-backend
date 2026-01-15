const params = new URLSearchParams(window.location.search);
const orderId = params.get("order");

if (!orderId) {
  document.body.innerHTML = "Invalid order";
  throw new Error("No order id");
}

let autoCheckUrl = null;
let intervalId = null;

// DOM
const amountEl = document.getElementById("amount");
const qrImg = document.getElementById("qrImg");
const upiBtn = document.getElementById("upiBtn");
const statusEl = document.getElementById("status");

// 1️⃣ Fetch order info
fetch("https://api.digitalcart.space/api/order-info", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ order: orderId })
})
.then(res => res.json())
.then(data => {
  if (data.status !== "success") {
    statusEl.innerText = "Invalid order";
    return;
  }

  amountEl.innerText = "Amount: ₹" + data.amount;

  // 2️⃣ Generate QR from UPI string
  QRCode.toDataURL(data.payment_data, (err, url) => {
    if (err) {
      console.error(err);
      statusEl.innerText = "QR generation failed";
      return;
    }
    qrImg.src = url;
  });

  // 3️⃣ UPI Intent Button
  upiBtn.onclick = () => {
    window.location.href = data.payment_data;
  };

  autoCheckUrl = data.auto_check_url;

  // 4️⃣ Start auto check
  startAutoCheck();
})
.catch(err => {
  console.error(err);
  statusEl.innerText = "Server error";
});

// 5️⃣ Auto-check every 2 sec (via backend proxy – CORS safe)
function startAutoCheck() {
  intervalId = setInterval(async () => {
    try {
      const res = await fetch("https://api.digitalcart.space/api/auto-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: autoCheckUrl })
      });

      const result = await res.json();
      console.log("Auto-check:", result);

      if (result.status === "success" && result.data?.status === "Success") {
        clearInterval(intervalId);
        statusEl.innerText = "Payment successful. Redirecting...";
        window.location.href = `/success.html?order=${orderId}`;
      }

      if (result.status === "failed") {
        clearInterval(intervalId);
        statusEl.innerText = "Payment failed";
      }

    } catch (e) {
      console.error("Auto-check error", e);
    }
  }, 2000);
}
