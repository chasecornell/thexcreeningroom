import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "the-screening-room-63840",
  appId: "1:749835048004:web:339fd6f8de387a83a41811",
  apiKey: "AIzaSyCEY4NPFVnRYL_PwxYqHhAW97LQ1KV7Y8g",
  authDomain: "the-screening-room-63840.firebaseapp.com",
  storageBucket: "the-screening-room-63840.firebasestorage.app",
  messagingSenderId: "749835048004",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-thescreeningroom-abb8f31a-d264-458a-afd9-ea1995a85a44"); 

async function run() {
  // Use admin login to get permissions
  await signInWithEmailAndPassword(auth, 'akleyweg@gmail.com', 'password');

  const moviesSnapshot = await getDocs(collection(db, 'movies'));
  // ... (rest of the script)
}
run().catch(console.error);
