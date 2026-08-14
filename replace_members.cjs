const fs = require('fs');

let content = fs.readFileSync('src/components/MovieSpreadsheet.tsx', 'utf8');

// Replace watch status filter logic
content = content.replace(/const count = MEMBERS\.filter\(\(p\) => \(movie\.ratings\?\.\[p\] \?\? 0\) > 0\)\.length;/g, "const count = members.filter((p) => (movie.ratings?.[p.name] ?? 0) > 0).length;");
content = content.replace(/if \(count !== MEMBERS\.length\) return false;/g, "if (count !== members.length) return false;");
content = content.replace(/const count = MEMBERS\.filter\(\(p\) => \(movie\.ratings\?\.\[p\] \?\? 0\) > 0\)\.length;/g, "const count = members.filter((p) => (movie.ratings?.[p.name] ?? 0) > 0).length;"); // replacing again just in case there are 2 occurrences
content = content.replace(/MEMBERS\.map\(\(p\) => m\.ratings\?\.\[p\] \|\| 0\)/g, "members.map((p) => m.ratings?.[p.name] || 0)");
content = content.replace(/MEMBERS\.filter\(\(p\) => \(m\.ratings\?\.\[p\] \?\? 0\) > 0\)\.length/g, "members.filter((p) => (m.ratings?.[p.name] ?? 0) > 0).length");

// Replace mapping
content = content.replace(/\{MEMBERS\.map\(\(member\) => \(/g, "{members.map((member) => (");
content = content.replace(/<option key=\{member\} value=\{member\}>/g, "<option key={member.id} value={member.name}>");
content = content.replace(/Added by \{member\}/g, "Added by {member.name}");

content = content.replace(/<option value="FULLY_WATCHED">Watched by All 6 Members<\/option>/g, '<option value="FULLY_WATCHED">Watched by All Members</option>');

content = content.replace(/\{MEMBERS\.map\(\(p\) => \(/g, "{members.map((p) => (");
content = content.replace(/<option key=\{`watched-\$\{p\}`\} value=\{`WATCHED_BY_\$\{p\}`\}>/g, '<option key={`watched-${p.name}`} value={`WATCHED_BY_${p.name}`}>');
content = content.replace(/Watched by \{p\}/g, "Watched by {p.name}");

content = content.replace(/<option key=\{`unwatched-\$\{p\}`\} value=\{`UNWATCHED_BY_\$\{p\}`\}>/g, '<option key={`unwatched-${p.name}`} value={`UNWATCHED_BY_${p.name}`}>');
content = content.replace(/Unwatched by \{p\}/g, "Unwatched by {p.name}");

content = content.replace(/\{MEMBERS\.map\(\(member\) => \{[\s\S]*?const profile = MEMBER_PROFILES\[member\];/g, `{members.map((member) => {\n                  const profile = member;`);

content = content.replace(/const adderProfile = movie\.addedBy \? MEMBER_PROFILES\[movie\.addedBy\] : null;/g, `const adderProfile = movie.addedBy ? members.find((m) => m.name === movie.addedBy) : null;`);
content = content.replace(/const ratedMembers = MEMBERS\.filter\(\(p\) => \(movie\.ratings\?\.\[p\] \?\? 0\) > 0\);/g, `const ratedMembers = members.filter((p) => (movie.ratings?.[p.name] ?? 0) > 0);`);
content = content.replace(/\(acc, p\) => acc \+ \(movie\.ratings\[p\] \|\| 0\),/g, `(acc, p) => acc + (movie.ratings[p.name] || 0),`);
content = content.replace(/const isFullyWatched = ratedMembers\.length === MEMBERS\.length;/g, `const isFullyWatched = ratedMembers.length === members.length;`);

content = content.replace(/const currentRating = movie\.ratings\?\.\[member\] \|\| 0;/g, `const currentRating = movie.ratings?.[member.name] || 0;`);
content = content.replace(/const isAllowedToRate = currentUserProfile\?\.personName === member;/g, `const isAllowedToRate = currentUserProfile?.personName === member.name;`);
content = content.replace(/key=\{member\}/g, `key={member.id}`);
content = content.replace(/onUpdateRating\(\{ movieId: movie\.id, person: member, rating \}\)/g, `onUpdateRating(movie.id, member.name, rating)`); // Just in case, wait, onUpdateRating signature is 3 args. Let's fix that if needed.

content = content.replace(/\{ratedMembers\.length\}\/\{MEMBERS\.length\} watched/g, `{ratedMembers.length}/{members.length} watched`);

fs.writeFileSync('src/components/MovieSpreadsheet.tsx', content);

