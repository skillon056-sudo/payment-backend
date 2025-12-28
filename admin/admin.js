// admin/admin.js
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   ADMIN AUTH CHECK
========================= */
// admin/auth-guard.js
// TEMPORARY: auth disabled
console.log("Admin auth disabled (dev mode)");

/* =========================
   DASHBOARD STATS
========================= */
export async function loadDashboardStats(){
  const usersSnap = await getDocs(collection(db,"users"));
  const productsSnap = await getDocs(collection(db,"products"));
  const ordersSnap = await getDocs(collection(db,"orders"));

  let revenue = 0;
  ordersSnap.forEach(o=>{
    if(o.data().status === "paid"){
      revenue += Number(o.data().price || 0);
    }
  });

  return {
    users: usersSnap.size,
    products: productsSnap.size,
    orders: ordersSnap.size,
    revenue
  };
}

/* =========================
   GET ALL PRODUCTS
========================= */
export async function getAllProducts(){
  const snap = await getDocs(collection(db,"products"));
  const list = [];

  snap.forEach(d=>{
    list.push({
      id: d.id,
      ...d.data()
    });
  });

  return list;
}

/* =========================
   GET ALL USERS
========================= */
export async function getAllUsers(){
  const snap = await getDocs(collection(db,"users"));
  const list = [];

  snap.forEach(d=>{
    list.push({
      id: d.id,
      ...d.data()
    });
  });

  return list;
}

/* =========================
   GET ALL TRANSACTIONS
========================= */
export async function getAllTransactions(){
  const snap = await getDocs(collection(db,"orders"));
  const list = [];

  snap.forEach(d=>{
    list.push({
      id: d.id,
      ...d.data()
    });
  });

  return list;
}

/* =========================
   GET USER ORDERS
========================= */
export async function getOrdersByUser(userId){
  const q = query(
    collection(db,"orders"),
    where("userId","==",userId)
  );

  const snap = await getDocs(q);
  const list = [];

  snap.forEach(d=>{
    list.push({
      id: d.id,
      ...d.data()
    });
  });

  return list;
}
