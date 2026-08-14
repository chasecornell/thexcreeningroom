const fs = require('fs');
let content = fs.readFileSync('src/components/AddMovieModal.tsx', 'utf8');

// Imports
content = content.replace("import {\n  MEMBERS,\n  MEMBER_PROFILES,\n  PersonName,\n  MovieItem,\n  OMDBMovieSearchResult,\n} from '../types';", "import {\n  MemberProfile,\n  PersonName,\n  MovieItem,\n  OMDBMovieSearchResult,\n} from '../types';");
content = content.replace("export function AddMovieModal({ isOpen, onClose, onAddMovie, existingImdbIds }: AddMovieModalProps) {", "export function AddMovieModal({ isOpen, onClose, onAddMovie, existingImdbIds, members }: AddMovieModalProps & { members: MemberProfile[] }) {");

content = content.replace("{MEMBERS.map((member) => (", "{members.map((member) => (");
content = content.replace("<option key={member} value={member}>", "<option key={member.id} value={member.name}>");
content = content.replace("{member}", "{member.name}");

content = content.replace(/addedBy: MEMBERS\[0\],/g, "addedBy: members.length > 0 ? members[0].name : 'Adam',");

fs.writeFileSync('src/components/AddMovieModal.tsx', content);
