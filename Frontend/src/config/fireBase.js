import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBmWnvdtJUOvz3esUKxMyipEf3Vwjvb8Mg",
  authDomain: "nexo-9c1a0.firebaseapp.com",
  projectId: "nexo-9c1a0",
  storageBucket: "nexo-9c1a0.firebasestorage.app",
  messagingSenderId: "1041382427379",
  appId: "1:1041382427379:web:9e52604d4c47c4fa8f4586",
  measurementId: "G-SCTR3HLJSP"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);