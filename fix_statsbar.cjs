const fs = require('fs');
let stats = fs.readFileSync('src/components/StatsBar.tsx', 'utf8');
stats = stats.replace("const rating = mem.ratings?.[p];", "const rating = m.ratings?.[p];"); // Let's just fix it completely manually
fs.writeFileSync('src/components/StatsBar.tsx', stats);
