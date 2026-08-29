import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
config();

// Try to find the default service account for AI Studio
const app = initializeApp({
  projectId: "the-screening-room-63840"
});
const db = getFirestore(app);
db.settings({ databaseId: 'ai-studio-thescreeningroom-abb8f31a-d264-458a-afd9-ea1995a85a44' });

async function run() {
  const moviesSnapshot = await db.collection('movies').get();
  let count = 0;
  for (const docSnap of moviesSnapshot.docs) {
    const data = docSnap.data();
    let changed = false;

    const ratings = data.ratings || {};
    if (ratings['Senior Iglesia'] !== undefined) {
      ratings['Matt'] = ratings['Senior Iglesia'];
      delete ratings['Senior Iglesia'];
      changed = true;
    }

    let addedBy = data.addedBy;
    if (addedBy === 'Senior Iglesia') {
      addedBy = 'Matt';
      changed = true;
    }

    let comments = data.comments || [];
    let commentsChanged = false;
    comments = comments.map((c: any) => {
      let author = c.author;
      if (author === 'Senior Iglesia') { author = 'Matt'; commentsChanged = true; }
      
      let likes = c.likes || [];
      if (likes.includes('Senior Iglesia')) {
        likes = likes.map((l: string) => l === 'Senior Iglesia' ? 'Matt' : l);
        commentsChanged = true;
      }
      
      let dislikes = c.dislikes || [];
      if (dislikes.includes('Senior Iglesia')) {
        dislikes = dislikes.map((l: string) => l === 'Senior Iglesia' ? 'Matt' : l);
        commentsChanged = true;
      }
      return { ...c, author, likes, dislikes };
    });

    if (commentsChanged) changed = true;

    if (changed) {
      console.log('Updating movie', docSnap.id);
      await docSnap.ref.update({ ratings, addedBy, comments });
      count++;
    }
  }

  const chatSnapshot = await db.collection('chatMessages').get();
  for (const docSnap of chatSnapshot.docs) {
    const data = docSnap.data();
    let changed = false;
    
    let author = data.author;
    if (author === 'Senior Iglesia') {
      author = 'Matt';
      changed = true;
    }

    if (changed) {
      console.log('Updating chat', docSnap.id);
      await docSnap.ref.update({ author });
    }
  }
  
  const usersSnapshot = await db.collection('users').get();
  for (const docSnap of usersSnapshot.docs) {
    const data = docSnap.data();
    if (data.personName === 'Senior Iglesia') {
      console.log('Updating user', docSnap.id);
      await docSnap.ref.update({ personName: 'Matt' });
    }
  }
  
  const membersSnapshot = await db.collection('members').get();
  for (const docSnap of membersSnapshot.docs) {
    const data = docSnap.data();
    if (data.name === 'Senior Iglesia') {
      console.log('Updating member doc', docSnap.id);
      await docSnap.ref.update({ name: 'Matt', shortName: 'Matt', initials: 'M' });
    }
  }

  console.log('Done reverting.', count, 'movies updated');
}
run().catch(console.error);
