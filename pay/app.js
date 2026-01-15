const params = new URLSearchParams(window.location.search);
const order = params.get("order");

if (!order) {
  document.getElementById("status").innerText = "Invalid order";
  throw new Error("Order missing");
}

let remaining = 300; // 5 min

function startTimer() {
  const t = document.getElementById("timer");
  setInterval(() => {
    if (remaining <= 0) {
      t.innerText = "⛔ Expired";
      return;
    }
    remaining--;
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    t.innerText = `⏳ ${m}:${s}`;
  }, 1000);
}

async function init() {
  const res = await fetch("https://api.digitalcart.space/api/order-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order })
  });

  const data = await res.json();
  if (data.status !== "success") {
    document.getElementById("status").innerText = "Unable to load payment";
    return;
  }

  document.getElementById("amount").innerText = "₹" + data.amount;

  document.getElementById("qrImg").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
    encodeURIComponent(data.payment_data);

  document.getElementById("upiBtn").onclick = () => {
    window.location.href = data.payment_data;
  };

  startTimer();
}

init();
