const fs = require('fs');
let content = fs.readFileSync('src/components/MovieDetailModal.tsx', 'utf8');

// Props
content = content.replace("movie: MovieItem | null;", "movie: MovieItem | null;\n  members: MemberProfile[];");
content = content.replace("import { MovieItem, MEMBERS, MEMBER_PROFILES, PersonName } from '../types';", "import { MovieItem, MemberProfile, PersonName } from '../types';");
content = content.replace("export function MovieDetailModal({", "export function MovieDetailModal({\n  members,");

// Logic
content = content.replace("const adderProfile = movie.addedBy ? MEMBER_PROFILES[movie.addedBy] : null;", "const adderProfile = movie.addedBy ? members.find((m) => m.name === movie.addedBy) : null;");
content = content.replace("const ratedEntries = MEMBERS.filter((p) => (movie.ratings?.[p] ?? 0) > 0);", "const ratedEntries = members.filter((p) => (movie.ratings?.[p.name] ?? 0) > 0);");
content = content.replace("const sumRating = ratedEntries.reduce((acc, p) => acc + (movie.ratings[p] || 0), 0);", "const sumRating = ratedEntries.reduce((acc, p) => acc + (movie.ratings[p.name] || 0), 0);");

// Mapping
content = content.replace("{MEMBERS.map((member) => {", "{members.map((member) => {");
content = content.replace("const profile = MEMBER_PROFILES[member];", "const profile = member;");
content = content.replace("const currentRating = movie.ratings?.[member] || 0;", "const currentRating = movie.ratings?.[member.name] || 0;");
content = content.replace("const isAllowedToRate = currentUserProfile?.personName === member;", "const isAllowedToRate = currentUserProfile?.personName === member.name;");
content = content.replace("key={member}", "key={member.id}");
content = content.replace("onUpdateRating(movie.id, member, newRating);", "onUpdateRating(movie.id, member.name, newRating);");

// Stats string
content = content.replace("{ratedEntries.length}/{MEMBERS.length} Watched", "{ratedEntries.length}/{members.length} Watched");

fs.writeFileSync('src/components/MovieDetailModal.tsx', content);
