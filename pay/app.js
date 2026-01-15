const params = new URLSearchParams(location.search);
const order = params.get("order");

const qrImg = document.getElementById("qr");
const popup = document.getElementById("popup");
const popupBox = document.getElementById("popupBox");

let autoCheckUrl = "";

// LOAD ORDER
fetch("https://api.digitalcart.space/api/order-info",{
  method:"POST",
  headers:{ "Content-Type":"application/json" },
  body:JSON.stringify({ order })
})
.then(r=>r.json())
.then(d=>{
  qrImg.src =
   "https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=" +
   encodeURIComponent(d.payment_data);

  autoCheckUrl = d.auto_check_url;
  startAutoCheck();
});

// AUTO CHECK
function startAutoCheck(){
  const iv = setInterval(async ()=>{
    const r = await fetch(autoCheckUrl);
    const j = await r.json();

    if(j.status === "SUCCESS"){
      clearInterval(iv);
      showSuccess();
    }

    if(j.status === "FAILED"){
      clearInterval(iv);
      showFail();
    }

  },2000);
}

// SUCCESS POPUP
function showSuccess(){
  popup.classList.remove("hidden");
  popupBox.innerHTML = `
    <h2>✅ Payment Successful</h2>
    <p>Redirecting…</p>
  `;
  setTimeout(()=>{
    location.href = `/success.html?order=${order}`;
  },2000);
}

// FAIL POPUP
function showFail(){
  popup.classList.remove("hidden");
  popupBox.innerHTML = `
    <h2>❌ Payment Failed</h2>
    <button onclick="location.href='index.html'">Try Again</button>
  `;
}
