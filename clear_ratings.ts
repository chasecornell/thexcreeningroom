import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import * as fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function clearAllRatings() {
  const moviesRef = collection(db, 'movies');
  const snapshot = await getDocs(moviesRef);
  const batch = writeBatch(db);
  let count = 0;
  snapshot.forEach((movieDoc) => {
    batch.update(movieDoc.ref, { ratings: {} });
    count++;
  });
  await batch.commit();
  console.log(`Cleared ratings for ${count} movies.`);
  process.exit(0);
}
clearAllRatings().catch(console.error);
