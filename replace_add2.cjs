const fs = require('fs');
let content = fs.readFileSync('src/components/AddMovieModal.tsx', 'utf8');

content = content.replace(/\{MEMBERS\.map\(\(member\) => \(/g, "{members.map((member) => (");
content = content.replace(/<option key=\{member\} value=\{member\}>/g, "<option key={member.id} value={member.name}>");
content = content.replace(/\{member\}/g, "{member.name}");

content = content.replace(/addedBy: MEMBERS\[0\],/g, "addedBy: members.length > 0 ? members[0].name : 'Adam',");

fs.writeFileSync('src/components/AddMovieModal.tsx', content);
