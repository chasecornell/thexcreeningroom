const fs = require('fs');
let fb = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const target = `// deleteDoc(doc(db, MEMBERS_COLLECTION, docSnap.id)).catch(console.error);`;
const replacement = `deleteDoc(doc(db, MEMBERS_COLLECTION, docSnap.id)).catch(() => {});`;

fb = fb.replace(target, replacement);
fs.writeFileSync('src/lib/firebase.ts', fb);
