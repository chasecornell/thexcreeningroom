const fs = require('fs');

let fb = fs.readFileSync('src/lib/firebase.ts', 'utf8');

// Replace the snapshot loop in subscribeToMembers
const oldLoop = `        const members: MemberProfile[] = [];
        snapshot.forEach((docSnap) => {
          members.push({ id: docSnap.id, ...docSnap.data() } as MemberProfile);
        });`;

const newLoop = `        const members: MemberProfile[] = [];
        const seenNames = new Set<string>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as MemberProfile;
          if (!seenNames.has(data.name)) {
            seenNames.add(data.name);
            members.push({ id: docSnap.id, ...data });
          } else {
             // It's a duplicate, we can optionally delete it if we have permission
             // deleteDoc(doc(db, MEMBERS_COLLECTION, docSnap.id)).catch(console.error);
          }
        });`;

if (fb.includes(oldLoop)) {
  fb = fb.replace(oldLoop, newLoop);
  fs.writeFileSync('src/lib/firebase.ts', fb);
  console.log("Updated firebase.ts");
} else {
  console.log("Could not find loop to replace");
}

