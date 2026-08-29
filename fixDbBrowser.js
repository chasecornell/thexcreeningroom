const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc } = require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
  projectId: "the-screening-room-63840",
  appId: "1:749835048004:web:339fd6f8de387a83a41811",
  apiKey: "AIzaSyCEY4NPFVnRYL_PwxYqHhAW97LQ1KV7Y8g",
  authDomain: "the-screening-room-63840.firebaseapp.com",
  storageBucket: "the-screening-room-63840.firebasestorage.app",
  messagingSenderId: "749835048004",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-thescreeningroom-abb8f31a-d264-458a-afd9-ea1995a85a44");

// Let's just create an index html and serve it that does the fix
