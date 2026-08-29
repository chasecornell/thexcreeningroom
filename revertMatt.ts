import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "the-screening-room-63840",
  appId: "1:749835048004:web:339fd6f8de387a83a41811",
  apiKey: "AIzaSyCEY4NPFVnRYL_PwxYqHhAW97LQ1KV7Y8g",
  authDomain: "the-screening-room-63840.firebaseapp.com",
  storageBucket: "the-screening-room-63840.firebasestorage.app",
  messagingSenderId: "749835048004",
};

const app = initializeApp(firebaseConfig);
// don't pass specific db, just default
const db = getFirestore(app); 

async function run() {
  const moviesSnapshot = await getDocs(collection(db, 'movies'));
  console.log('Got', moviesSnapshot.size, 'movies');
}
run().catch(console.error);
