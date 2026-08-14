const fs = require('fs');

// Fix MovieDetailModal
let detail = fs.readFileSync('src/components/MovieDetailModal.tsx', 'utf8');
detail = detail.replace(/onUpdateRating\(\s*movie\.id,\s*member,\s*currentRating === star \? 0 : star\s*\)/g, "onUpdateRating(movie.id, member.name, currentRating === star ? 0 : star)");
fs.writeFileSync('src/components/MovieDetailModal.tsx', detail);

// Fix MovieSpreadsheet
let sheet = fs.readFileSync('src/components/MovieSpreadsheet.tsx', 'utf8');
sheet = sheet.replace(/<StarRating\s+person=\{member\}\s+rating=\{currentRating\}\s+disabled=\{\!isAllowedToRate\}\s+onChange=\{\(newRating\) =>\s*onUpdateRating\(movie\.id, member, newRating\)\s*\}/g, `<StarRating person={member.name} rating={currentRating} disabled={!isAllowedToRate} onChange={(newRating) => onUpdateRating(movie.id, member.name, newRating)}`);
fs.writeFileSync('src/components/MovieSpreadsheet.tsx', sheet);

// Fix StatsBar
let stats = fs.readFileSync('src/components/StatsBar.tsx', 'utf8');
stats = stats.replace("const rating = m.ratings?.[p];", "const rating = movie_item.ratings?.[p];"); // wait, need to rename the loop var
stats = stats.replace("members.forEach((m) => {", "members.forEach((mem) => {");
stats = stats.replace("const p = mem.name;", "const p = mem.name;");
stats = stats.replace("const rating = mem.ratings?.[p];", "const rating = m.ratings?.[p];"); // oh the outer loop is m (movie item)
fs.writeFileSync('src/components/StatsBar.tsx', stats);

