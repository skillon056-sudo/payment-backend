const params = new URLSearchParams(window.location.search);

const orderId = params.get("order_id");
const amount = params.get("amount");
const autoCheckUrl = decodeURIComponent(
  params.get("auto_check")
);

document.getElementById("orderId").innerText = orderId;
document.getElementById("amount").innerText = amount;

setInterval(() => {
  if (!autoCheckUrl) return;

  fetch(autoCheckUrl)
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        window.location.href =
          `/success.html?order_id=${orderId}`;
      }
    });
}, 2000);
