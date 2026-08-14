const fs = require('fs');
let content = fs.readFileSync('src/components/StatsBar.tsx', 'utf8');

// Imports
content = content.replace("import { MovieItem, MEMBERS, MEMBER_PROFILES, PersonName } from '../types';", "import { MovieItem, MemberProfile, PersonName } from '../types';");

// Props
content = content.replace("interface StatsBarProps {\n  movies: MovieItem[];", "interface StatsBarProps {\n  movies: MovieItem[];\n  members: MemberProfile[];");
content = content.replace("export function StatsBar({\n  movies,", "export function StatsBar({\n  movies,\n  members,");

// stats UseMemo
content = content.replace("const memberStats: Record<", "const memberStats: Record<"); // skip
content = content.replace(/const memberStats: Record<\n      PersonName,\n      \{ watchedCount: number; sumScore: number; avgScore: number; addedCount: number \}\n    > = \{[\s\S]*?\};\n/, 
`const memberStats: Record<PersonName, { watchedCount: number; sumScore: number; avgScore: number; addedCount: number }> = {};
    members.forEach(m => {
      memberStats[m.name] = { watchedCount: 0, sumScore: 0, avgScore: 0, addedCount: 0 };
    });\n`);

content = content.replace("MEMBERS.forEach((p) => {", "members.forEach((m) => {\n        const p = m.name;");
content = content.replace("MEMBERS.forEach((p) => {", "members.forEach((m) => {\n      const p = m.name;");
content = content.replace("const possibleRatings = totalMovies * MEMBERS.length;", "const possibleRatings = totalMovies * members.length;");

// Roster section
content = content.replace("Fixed Roster (6 Members)", "Group Roster ({members.length} Members)");
content = content.replace("{MEMBERS.map((member) => {", "{members.map((member) => {");
content = content.replace("const profile = MEMBER_PROFILES[member];", "const profile = member;");
content = content.replace("const memberData = stats.memberStats[member];", "const memberData = stats.memberStats[member.name];");
content = content.replace("const isSelected = selectedMemberFilter === member;", "const isSelected = selectedMemberFilter === member.name;");
content = content.replace("key={member}", "key={member.id}");
content = content.replace("onSelectMemberFilter(isSelected ? 'ALL' : member)", "onSelectMemberFilter(isSelected ? 'ALL' : member.name)");
content = content.replace("{member}", "{member.name}"); // wait, span>{member}</span>

content = content.replace(/<span className="text-xs font-semibold text-zinc-100 truncate">\s*\{member\}\s*<\/span>/, `<span className="text-xs font-semibold text-zinc-100 truncate">{member.name}</span>`);
content = content.replace(/<span className="text-zinc-400 font-normal">\s*\(\{stats\.highestRatedMovie\.count\}\/6 watched\)\s*<\/span>/, `<span className="text-zinc-400 font-normal">({stats.highestRatedMovie.count}/{members.length} watched)</span>`);

fs.writeFileSync('src/components/StatsBar.tsx', content);
