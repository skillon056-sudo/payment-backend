const params = new URLSearchParams(location.search);
const order = params.get("order");

const qrBox = document.getElementById("qrBox");
const qrImg = document.getElementById("qrImg");
const apps = document.getElementById("apps");
const amountEl = document.getElementById("amount");

let paymentData = "";
let autoCheckUrl = "";

async function init(){
  const res = await fetch("https://api.digitalcart.space/api/order-info",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ order })
  });
  const data = await res.json();

  paymentData = data.payment_data;
  autoCheckUrl = data.auto_check_url;
  amountEl.innerText = data.amount;

  qrImg.src =
   "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" +
   encodeURIComponent(paymentData);

  startAutoCheck();
}

document.querySelectorAll("input[name='method']").forEach(r=>{
  r.onchange = ()=>{
    if(r.value==="qr"){
      qrBox.classList.remove("hidden");
      apps.style.display="none";
    }else{
      qrBox.classList.add("hidden");
      apps.style.display="grid";
    }
  }
});

document.querySelectorAll(".apps button").forEach(btn=>{
  btn.onclick = ()=>{
    window.location.href = paymentData;
  };
});

function startAutoCheck(){
  const iv = setInterval(async ()=>{
    const res = await fetch(autoCheckUrl);
    const j = await res.json();

    if(j.status==="SUCCESS"){
      clearInterval(iv);
      location.href = "/success.html?order="+order;
    }
  },2000);
}

init();
