import React, { useState, useEffect } from 'react';
import {
  Flame,
  MessageSquare,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Quote,
  Star,
  Film,
  Maximize2,
} from 'lucide-react';
import { HotTake, MemberProfile, MovieItem, PersonName } from '../types';
import { toggleHotTakeReaction } from '../lib/firebase';

interface HotTakeBannerProps {
  hotTakes: HotTake[];
  members: MemberProfile[];
  movies: MovieItem[];
  currentUserProfile: { personName: PersonName | null; isAdmin: boolean } | null;
  onOpenMovieDetail: (movie: MovieItem) => void;
  onOpenChat: () => void;
}

const REACTION_EMOJIS: Array<{ emoji: string; label: string; activeColor: string }> = [
  { emoji: '🔥', label: 'Cooking', activeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50' },
  { emoji: '🧊', label: 'Cap / Ice Cold', activeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' },
  { emoji: '🍿', label: 'Drama', activeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' },
  { emoji: '💀', label: 'Bro What?!', activeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/50' },
];

export function HotTakeBanner({
  hotTakes,
  members,
  movies,
  currentUserProfile,
  onOpenMovieDetail,
  onOpenChat,
}: HotTakeBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(() => {
    // Default to false (callout bar) unless user explicitly opened it this session
    try {
      const stored = sessionStorage.getItem('tsr_hottake_expanded');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // Filter active hot takes
  const activeTakes = hotTakes.length > 0 ? hotTakes : [];

  // Reset current index if takes change
  useEffect(() => {
    if (currentIndex >= activeTakes.length && activeTakes.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeTakes.length, currentIndex]);

  if (activeTakes.length === 0) {
    return null;
  }

  const currentTake = activeTakes[currentIndex] || activeTakes[0];
  const authorMember = members.find(
    (m) =>
      m.name === currentTake.author ||
      (currentTake.author === 'Matt' && m.name === 'Matt Tighe') ||
      (currentTake.author === 'Matt Tighe' && m.name === 'Matt')
  );

  const matchedMovie = movies.find(
    (m) =>
      m.id === currentTake.movieId ||
      m.imdbID === currentTake.movieId ||
      (currentTake.imdbID && m.imdbID === currentTake.imdbID) ||
      m.title.toLowerCase() === currentTake.movieTitle.toLowerCase()
  );

  const handleToggleExpand = (expanded: boolean) => {
    setIsExpanded(expanded);
    try {
      sessionStorage.setItem('tsr_hottake_expanded', String(expanded));
    } catch {
      // ignore
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUserProfile?.personName) return;
    try {
      await toggleHotTakeReaction(currentTake.id, currentUserProfile.personName, emoji);
    } catch (err) {
      console.error('Failed to toggle hot take reaction:', err);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const elapsed = Date.now() - timestamp;
    const minutes = Math.floor(elapsed / (1000 * 60));
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return `Yesterday`;
    return `${days}d ago`;
  };

  // 1. Compact Callout Bar / Button Mode (Default on homepage load)
  if (!isExpanded) {
    return (
      <aside
        aria-label="Weekly Hot Take Callout"
        id="hot-take-callout-strip"
        className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-1"
      >
        <div
          onClick={() => handleToggleExpand(true)}
          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-[#200f07] via-[#170e08] to-[#121217] border-2 border-amber-500/40 hover:border-amber-500/70 shadow-lg shadow-orange-950/20 text-xs cursor-pointer transition-all duration-200 hover:shadow-orange-900/30"
        >
          {/* Left: Flame badge, Movie title & teaser quote */}
          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs shrink-0 group-hover:scale-105 group-hover:bg-amber-500/30 transition-transform">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 overflow-hidden">
              <span className="font-extrabold text-amber-300 uppercase tracking-wider text-[11px] shrink-0">
                Weekly Hot Take:
              </span>
              <span className="font-bold text-white group-hover:text-amber-200 transition truncate max-w-[220px] sm:max-w-xs">
                {currentTake.movieTitle}
              </span>
              <span className="text-zinc-400 hidden md:inline truncate max-w-sm italic">
                — "{currentTake.hotTakeText}"
              </span>
              <span className="text-amber-400/80 text-[10px] font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 hidden sm:inline-block shrink-0">
                by {currentTake.author}
              </span>
            </div>
          </div>

          {/* Right: Expand Button CTA */}
          <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-center">
            <span className="text-[11px] text-zinc-400 hidden lg:inline">
              {formatTimeAgo(currentTake.createdAt)}
            </span>
            <button
              type="button"
              id="expand-hot-take-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 rounded-xl text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 fill-zinc-950" />
              <span>Read Hot Take</span>
              <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 2. Full Expanded Box Mode with Big X in Top Right
  return (
    <aside
      aria-label="Weekly Hot Take Feature Banner"
      id="weekly-hot-take-banner"
      className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-2"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e0e07] via-[#140b08] to-[#111116] border-2 border-amber-500/50 shadow-2xl shadow-orange-950/40 p-4 sm:p-6 lg:p-7 text-zinc-100 transition-all duration-300">
        {/* Ambient Fire Backlight / Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-amber-500/20 via-orange-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-rose-600/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Banner Top Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 via-orange-500/25 to-red-500/25 border border-amber-500/50 text-amber-300 font-extrabold text-xs uppercase tracking-wider shadow-inner">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400 animate-pulse" />
              <span>Weekly Hot Take Broadcast</span>
            </div>

            <span className="text-xs text-amber-200/80 font-medium">
              🔥 Dropped {formatTimeAgo(currentTake.createdAt)}
            </span>

            {activeTakes.length > 1 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700 text-zinc-300">
                {currentIndex + 1} of {activeTakes.length} takes
              </span>
            )}
          </div>

          {/* Right Controls: Carousel & BIG X Close Button */}
          <div className="flex items-center gap-2">
            {activeTakes.length > 1 && (
              <div className="flex items-center gap-1 mr-1 bg-black/50 p-1 rounded-xl border border-amber-500/20">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeTakes.length - 1))
                  }
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                  title="Previous Hot Take"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono font-bold text-amber-400 px-1.5">
                  {currentIndex + 1}/{activeTakes.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) => (prev < activeTakes.length - 1 ? prev + 1 : 0))
                  }
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                  title="Next Hot Take"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* BIG PROMINENT X CLOSE BUTTON */}
            <button
              type="button"
              id="close-hot-take-btn"
              onClick={() => handleToggleExpand(false)}
              className="p-2 sm:p-2.5 bg-zinc-900/90 hover:bg-rose-950/70 text-zinc-300 hover:text-rose-200 border-2 border-amber-500/40 hover:border-rose-500/60 rounded-xl transition-all duration-150 cursor-pointer shadow-lg hover:shadow-rose-950/40 active:scale-95 flex items-center justify-center group"
              title="Close Hot Take"
              aria-label="Close Hot Take"
            >
              <X className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200 text-amber-300 group-hover:text-rose-300" />
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="relative z-10 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Movie Poster & Basic Info (4 cols) */}
          <div className="lg:col-span-4 flex items-start sm:items-center lg:items-start gap-4">
            <div
              onClick={() => matchedMovie && onOpenMovieDetail(matchedMovie)}
              className="group relative w-24 sm:w-28 h-36 sm:h-40 rounded-xl overflow-hidden bg-zinc-900 border-2 border-amber-500/40 shadow-xl shadow-black/60 shrink-0 cursor-pointer transition transform hover:scale-105 hover:border-amber-400"
            >
              <img
                src={
                  currentTake.moviePoster ||
                  matchedMovie?.poster ||
                  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80'
                }
                alt={currentTake.movieTitle}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> View
                </span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Featured Movie
                </span>
                {currentTake.movieYear && (
                  <span className="text-xs text-zinc-400 font-mono">
                    ({currentTake.movieYear})
                  </span>
                )}
              </div>

              <h2
                onClick={() => matchedMovie && onOpenMovieDetail(matchedMovie)}
                className="text-lg sm:text-xl font-black text-white hover:text-amber-300 transition cursor-pointer tracking-tight line-clamp-2"
              >
                {currentTake.movieTitle}
              </h2>

              {/* Author Badge */}
              <div className="pt-1 flex items-center gap-2">
                {authorMember?.avatarUrl ? (
                  <img
                    src={authorMember.avatarUrl}
                    alt={currentTake.author}
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-amber-500/60"
                  />
                ) : (
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-amber-500/60 ${
                      authorMember?.avatarColor || 'bg-amber-600 text-white'
                    }`}
                  >
                    {authorMember?.initials || currentTake.author.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="text-xs">
                  <span className="text-zinc-400 font-medium">Take by </span>
                  <span className="font-bold text-amber-300">{currentTake.author}</span>
                </div>
              </div>

              {/* Author Initial Rating */}
              {currentTake.initialRating && currentTake.initialRating > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold pt-0.5">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < currentTake.initialRating!
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-zinc-300">
                    ({currentTake.initialRating}/5 ★)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: The Hot Take Quote & Live Community Reactions (8 cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-4 bg-black/40 p-4 sm:p-5 rounded-xl border border-amber-500/25">
            {/* The Quote */}
            <div className="relative pl-6 sm:pl-8">
              <Quote className="w-6 sm:w-8 h-6 sm:h-8 text-amber-500/40 absolute -top-1 left-0 rotate-180" />
              <p className="text-sm sm:text-base lg:text-lg font-serif italic text-amber-50 leading-relaxed font-medium">
                "{currentTake.hotTakeText}"
              </p>
            </div>

            {/* Bottom Bar: Reactions & Discussion CTAs */}
            <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
              {/* Live Reaction Emojis */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 hidden sm:inline">
                  React:
                </span>
                {REACTION_EMOJIS.map(({ emoji, label, activeColor }) => {
                  const reacts = currentTake.reactions?.[emoji] || [];
                  const userReacted =
                    currentUserProfile?.personName &&
                    reacts.includes(currentUserProfile.personName);

                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleReaction(emoji)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 ${
                        userReacted
                          ? `${activeColor} ring-1 ring-amber-400/40`
                          : 'bg-[#18181f] hover:bg-[#22222c] border-zinc-700 text-zinc-300 hover:text-white'
                      }`}
                      title={`${label} (${reacts.join(', ') || '0'})`}
                    >
                      <span className="text-sm">{emoji}</span>
                      <span className="font-mono text-[11px]">{reacts.length}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {matchedMovie && (
                  <button
                    type="button"
                    onClick={() => onOpenMovieDetail(matchedMovie)}
                    className="px-3 py-1.5 rounded-xl bg-[#202028] hover:bg-[#2a2a35] border border-zinc-700 text-xs font-bold text-zinc-200 hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Movie</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenChat}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-extrabold shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Debate in Lounge</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
