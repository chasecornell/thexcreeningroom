import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { PersonName, MemberProfile } from '../types';

interface ReactionButtonsProps {
  likes?: PersonName[];
  dislikes?: PersonName[];
  currentPerson: PersonName | null | undefined;
  members: MemberProfile[];
  onToggleReaction: (type: 'like' | 'dislike') => void;
  compact?: boolean;
}

export function ReactionButtons({
  likes = [],
  dislikes = [],
  currentPerson,
  members,
  onToggleReaction,
  compact = false,
}: ReactionButtonsProps) {
  const [showTooltip, setShowTooltip] = useState<'likes' | 'dislikes' | null>(null);

  const hasLiked = currentPerson ? likes.includes(currentPerson) : false;
  const hasDisliked = currentPerson ? dislikes.includes(currentPerson) : false;

  const getMemberInitials = (name: PersonName) => {
    const m = members.find((mem) => mem.name === name);
    return m?.initials || name.slice(0, 2);
  };

  const getMemberColor = (name: PersonName) => {
    const m = members.find((mem) => mem.name === name);
    return m?.avatarColor || 'bg-zinc-700 text-white';
  };

  return (
    <div className="flex items-center gap-1 relative select-none">
      {/* Like Button */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleReaction('like');
          }}
          onMouseEnter={() => likes.length > 0 && setShowTooltip('likes')}
          onMouseLeave={() => setShowTooltip(null)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
            hasLiked
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-xs scale-102'
              : 'bg-[#15151a] text-zinc-400 hover:text-zinc-200 border-[#24242a] hover:border-[#383844]'
          } ${compact ? 'text-[11px] py-0.5 px-1.5' : ''}`}
          title={hasLiked ? 'Remove Like' : 'Like'}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'fill-emerald-400 stroke-emerald-400' : ''}`} />
          <span>{likes.length > 0 ? likes.length : ''}</span>
        </button>

        {/* Likes Tooltip */}
        {showTooltip === 'likes' && likes.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1.5 z-30 bg-[#1a1a20] border border-[#2e2e38] text-white text-[11px] rounded-xl px-2.5 py-1.5 shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
            <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
              <ThumbsUp className="w-3 h-3 fill-emerald-400" /> Liked by:
            </div>
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {likes.map((name) => (
                <span
                  key={name}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] ${getMemberColor(
                    name
                  )}`}
                >
                  <span>{getMemberInitials(name)}</span>
                  <span>{name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dislike Button */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleReaction('dislike');
          }}
          onMouseEnter={() => dislikes.length > 0 && setShowTooltip('dislikes')}
          onMouseLeave={() => setShowTooltip(null)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
            hasDisliked
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-xs scale-102'
              : 'bg-[#15151a] text-zinc-400 hover:text-zinc-200 border-[#24242a] hover:border-[#383844]'
          } ${compact ? 'text-[11px] py-0.5 px-1.5' : ''}`}
          title={hasDisliked ? 'Remove Dislike' : 'Dislike'}
        >
          <ThumbsDown className={`w-3.5 h-3.5 ${hasDisliked ? 'fill-rose-400 stroke-rose-400' : ''}`} />
          <span>{dislikes.length > 0 ? dislikes.length : ''}</span>
        </button>

        {/* Dislikes Tooltip */}
        {showTooltip === 'dislikes' && dislikes.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1.5 z-30 bg-[#1a1a20] border border-[#2e2e38] text-white text-[11px] rounded-xl px-2.5 py-1.5 shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
            <div className="font-bold text-rose-400 mb-1 flex items-center gap-1">
              <ThumbsDown className="w-3 h-3 fill-rose-400" /> Disliked by:
            </div>
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {dislikes.map((name) => (
                <span
                  key={name}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] ${getMemberColor(
                    name
                  )}`}
                >
                  <span>{getMemberInitials(name)}</span>
                  <span>{name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
