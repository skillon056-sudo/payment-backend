const params = new URLSearchParams(window.location.search);
const order = params.get("order");

if (!order) {
  alert("Invalid order");
  throw new Error("Order missing");
}

const qrImg = document.getElementById("qrImg");
const amountText = document.getElementById("amountText");
const statusText = document.getElementById("statusText");

const qrSection = document.getElementById("qrSection");
const appSection = document.getElementById("appSection");

const qrOption = document.getElementById("qrOption");
const appOption = document.getElementById("appOption");

const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popupTitle");
const popupMsg = document.getElementById("popupMsg");

let paymentData = null;

/* -------- OPTION SWITCH -------- */
qrOption.onclick = () => {
  qrOption.classList.add("active");
  appOption.classList.remove("active");
  qrSection.classList.remove("hidden");
  appSection.classList.add("hidden");
};

appOption.onclick = () => {
  appOption.classList.add("active");
  qrOption.classList.remove("active");
  qrSection.classList.add("hidden");
  appSection.classList.remove("hidden");
};

/* -------- LOAD ORDER INFO -------- */
async function init() {
  const res = await fetch("https://api.digitalcart.space/api/order-info", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ order })
  });

  const data = await res.json();
  if (data.status !== "success") {
    statusText.innerText = "Unable to load payment";
    return;
  }

  paymentData = data.payment_data;
  amountText.innerText = "₹" + data.amount;

  qrImg.src =
    "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" +
    encodeURIComponent(paymentData);

  document.getElementById("payAppBtn").onclick = () => {
    window.location.href = paymentData;
  };

  startAutoCheck();
}

/* -------- AUTO CHECK (BACKEND ALREADY UPDATES DB) -------- */
function startAutoCheck() {
  const interval = setInterval(async () => {
    const res = await fetch("https://api.digitalcart.space/api/verify-payment", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ order })
    });

    const result = await res.json();

    if (result.status === "success") {
      clearInterval(interval);
      showPopup("✅ Payment Successful", "Redirecting...");
      setTimeout(() => {
        window.location.href = "/success.html?order=" + order;
      }, 2000);
    }

    if (result.status === "error" && result.message === "failed") {
      clearInterval(interval);
      showPopup("❌ Payment Failed", "Please try again");
    }
  }, 2000);
}

/* -------- POPUP -------- */
function showPopup(title, msg) {
  popupTitle.innerText = title;
  popupMsg.innerText = msg;
  popup.classList.remove("hidden");
}

init();
