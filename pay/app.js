const params = new URLSearchParams(location.search);
const order = params.get("order");

const qrImg = document.getElementById("qrImg");
const popup = document.getElementById("popup");
const popupBox = document.getElementById("popupBox");

let autoCheckUrl = "";
let paymentData = "";

// LOAD ORDER INFO
fetch("https://api.digitalcart.space/api/order-info", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ order })
})
.then(r => r.json())
.then(d => {
  if (d.status !== "success") {
    alert("Invalid order");
    return;
  }

  paymentData = d.payment_data;
  autoCheckUrl = d.auto_check_url;

  // QR
  qrImg.src =
    "https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=" +
    encodeURIComponent(paymentData);

  // Auto check
  startAutoCheck();
});

// AUTO CHECK EVERY 2 SEC
function startAutoCheck() {
  const iv = setInterval(async () => {
    try {
      const r = await fetch(autoCheckUrl);
      const j = await r.json();

      if (j.status === "SUCCESS") {
        clearInterval(iv);
        showSuccess();
      }

      if (j.status === "FAILED") {
        clearInterval(iv);
        showFail();
      }
    } catch (e) {
      console.log("Waiting…");
    }
  }, 2000);
}

// POPUPS
function showSuccess() {
  popup.classList.remove("hidden");
  popupBox.innerHTML = `
    <h2>✅ Payment Successful</h2>
    <p>Redirecting…</p>
  `;
  setTimeout(() => {
    location.href = `/success.html?order=${order}`;
  }, 2000);
}

function showFail() {
  popup.classList.remove("hidden");
  popupBox.innerHTML = `
    <h2>❌ Payment Failed</h2>
    <button onclick="location.href='index.html'">Try Again</button>
  `;
}
