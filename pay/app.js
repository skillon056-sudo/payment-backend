const params = new URLSearchParams(location.search);
const order = params.get("order");

if (!order) {
  alert("Invalid order");
  throw new Error("Order missing");
}

let paymentData = "";

async function init() {
  const res = await fetch("https://api.digitalcart.space/api/order-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order })
  });

  const data = await res.json();
  if (data.status !== "success") {
    alert("Unable to load payment");
    return;
  }

  paymentData = data.payment_data;

  document.getElementById("amount").innerText = data.amount;

  document.getElementById("qrImg").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" +
    encodeURIComponent(paymentData);
}

document.getElementById("payBtn").onclick = () => {
  const upi = document.getElementById("upiInput").value.trim();

  if (upi) {
    const intent = paymentData + "&pa=" + encodeURIComponent(upi);
    window.location.href = intent;
  } else {
    window.location.href = paymentData;
  }
};

init();
