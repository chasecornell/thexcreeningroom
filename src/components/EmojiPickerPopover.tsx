import { useState } from 'react';
import { Smile, Flame, Film, ThumbsUp } from 'lucide-react';

interface EmojiPickerPopoverProps {
  onSelectEmoji: (emoji: string) => void;
  compact?: boolean;
}

export const POPULAR_REACTION_EMOJIS = ['😂', '🍿', '🔥', '💀', '🎬', '💩', '🤯', '👏', '😴', '🤮', '👀', '❤️'];

export const EMOJI_SETS = [
  {
    category: 'Reactions & Chaos',
    icon: Flame,
    emojis: ['😂', '🤣', '💀', '😭', '🤯', '🤡', '🙄', '🤢', '😴', '🥳', '😡', '🥺', '😱', '🤪', '🤫', '😎'],
  },
  {
    category: 'Cinema & Reviews',
    icon: Film,
    emojis: ['🍿', '🎬', '🎥', '🏆', '⭐', '💩', '🗑️', '💣', '🔥', '💤', '📺', '📼', '📽️', '🎭', '🥇', '🚫'],
  },
  {
    category: 'Vibes & Gestures',
    icon: ThumbsUp,
    emojis: ['👍', '👎', '👏', '🤦‍♂️', '🤷‍♂️', '🤌', '🫡', '🤝', '🤘', '👊', '💯', '✨', '❤️', '💔', '👑', '🎉'],
  },
];

export function EmojiPickerPopover({ onSelectEmoji, compact = false }: EmojiPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-[#202026] transition flex items-center gap-1 cursor-pointer ${
          isOpen ? 'bg-[#202026] text-amber-400' : ''
        }`}
        title="Insert emoji"
      >
        <Smile className="w-4 h-4" />
        {!compact && <span className="text-[11px] font-medium hidden sm:inline">Emoji</span>}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 bottom-full mb-2 z-50 w-72 bg-[#141418] border border-[#282830] rounded-2xl shadow-2xl p-3 animate-in zoom-in-95 duration-150">
            {/* Category tabs */}
            <div className="flex items-center justify-between border-b border-[#222228] pb-2 mb-2">
              <div className="flex gap-1">
                {EMOJI_SETS.map((set, idx) => {
                  const Icon = set.icon;
                  return (
                    <button
                      key={set.category}
                      type="button"
                      onClick={() => setActiveCategory(idx)}
                      className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                        activeCategory === idx
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'text-zinc-400 hover:text-white hover:bg-[#1e1e24]'
                      }`}
                      title={set.category}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] font-semibold text-zinc-400">
                {EMOJI_SETS[activeCategory].category}
              </span>
            </div>

            {/* Emojis Grid */}
            <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1">
              {EMOJI_SETS[activeCategory].emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSelectEmoji(emoji);
                  }}
                  className="w-9 h-9 flex items-center justify-center text-lg rounded-xl hover:bg-[#24242c] hover:scale-110 active:scale-95 transition cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Popular quick bar at bottom */}
            <div className="mt-2 pt-2 border-t border-[#222228] flex items-center justify-between px-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Quick:</span>
              <div className="flex gap-1">
                {POPULAR_REACTION_EMOJIS.slice(0, 6).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => onSelectEmoji(em)}
                    className="hover:scale-125 transition text-sm cursor-pointer"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
