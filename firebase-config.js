// firebase-config.js - sets up the Firestore connection used by all repositories.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDmqvy2Q6270NRl8fqSl6Zga5_jGHJLh0U",
  authDomain: "stockscope-ea6f2.firebaseapp.com",
  projectId: "stockscope-ea6f2",
  storageBucket: "stockscope-ea6f2.firebasestorage.app",
  messagingSenderId: "1:437693959105:web:ad3c84e21621301e6cbd40",
  appId: "G-007JZ957L2"
};

const app = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);
