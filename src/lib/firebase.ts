// lib/firebase/client.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

//once we again resume phone verification service add. real config values
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const firebaseAuth = getAuth(app);