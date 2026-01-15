const params = new URLSearchParams(window.location.search);
const order = params.get("order");

if (!order) {
  document.getElementById("status").innerText = "Invalid order";
  throw new Error("Order missing");
}

async function initPayment() {
  const res = await fetch("https://api.digitalcart.space/api/order-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order })
  });

  const data = await res.json();

  // QR
  document.getElementById("qrImg").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
    encodeURIComponent(data.payment_data);

  // Amount
  document.getElementById("amount").innerText = "Amount: ₹" + data.amount;

  // UPI intent
  document.getElementById("upiBtn").onclick = () => {
    window.location.href = data.payment_data;
  };

  // auto check every 2 sec
  setInterval(checkPayment, 2000);
}

async function checkPayment() {
  const res = await fetch("https://api.digitalcart.space/api/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order })
  });

  const result = await res.json();

  if (result.status === "success") {
    window.location.href = "/success.html?order=" + order;
  }
}

initPayment();
