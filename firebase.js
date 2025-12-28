// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC0shItOoI0zfp8fy9lMSQ_YWN94IZu_r8",
  authDomain: "digital-world-3a91c.firebaseapp.com",
  projectId: "digital-world-3a91c",
  storageBucket: "digital-world-3a91c.appspot.com",
  messagingSenderId: "73011983810",
  appId: "1:73011983810:web:fae8db9be560466cb7525b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
