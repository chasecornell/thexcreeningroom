import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const membersRef = collection(db, "members");
  const snap = await getDocs(membersRef);
  const seen = new Set();
  const toDelete = [];
  snap.forEach(doc => {
    const data = doc.data();
    if (seen.has(data.name)) {
      toDelete.push(doc.id);
    } else {
      seen.add(data.name);
    }
  });
  console.log("Deleting " + toDelete.length + " duplicates");
  for (const id of toDelete) {
    await deleteDoc(doc(db, "members", id));
  }
  console.log("Done");
  process.exit(0);
}
run();
