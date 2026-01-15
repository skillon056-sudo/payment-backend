const params = new URLSearchParams(window.location.search);

const orderId = params.get("order_id");
const amount = params.get("amount");
const autoCheckUrl = decodeURIComponent(params.get("auto_check") || "");
const upiString = decodeURIComponent(params.get("upi") || "");

document.getElementById("orderId").innerText = orderId || "—";
document.getElementById("amount").innerText = amount || "—";

/**
 * 🔑 QR GENERATION
 * We use a public QR generator
 * (You can replace later if needed)
 */
if (upiString) {
  const qrUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
    encodeURIComponent(upiString);

  document.getElementById("qrImage").src = qrUrl;
} else {
  document.getElementById("status").innerText =
    "QR not available. Please wait...";
}

/**
 * 🔁 AUTO PAYMENT CHECK
 */
setInterval(() => {
  if (!autoCheckUrl) return;

  fetch(autoCheckUrl)
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        window.location.href =
          `/success?order_id=${orderId}`;
      }
    })
    .catch(() => {});
}, 2000);
