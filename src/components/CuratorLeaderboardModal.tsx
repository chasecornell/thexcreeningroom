import { useState, useMemo } from 'react';
import {
  X,
  Trophy,
  Star,
  Film,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { MovieItem, MemberProfile, PersonName } from '../types';
import { calculateCuratorStats, MemberCuratorStats } from '../lib/curatorStats';
import { calculateAdvancedStats } from '../lib/funStats';
import { FunStatsTabs } from './FunStatsTabs';

interface CuratorLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: MovieItem[];
  members: MemberProfile[];
  onSelectMovie?: (movie: MovieItem) => void;
  onFilterByUploader?: (personName: PersonName) => void;
}

export function CuratorLeaderboardModal({
  isOpen,
  onClose,
  movies,
  members,
  onSelectMovie,
  onFilterByUploader,
}: CuratorLeaderboardModalProps) {
  const [modalTab, setModalTab] = useState<'standings' | 'analytics'>('standings');
  const [expandedMember, setExpandedMember] = useState<PersonName | null>(null);

  const { leaderboard, topCurator } = useMemo(
    () => calculateCuratorStats(movies, members),
    [movies, members]
  );

  const advancedStats = useMemo(
    () => calculateAdvancedStats(movies, members),
    [movies, members]
  );

  if (!isOpen) return null;

  return (
    <div
      id="curator-leaderboard-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="curator-leaderboard-modal-card"
        className="bg-[#111114] border border-[#26262a] w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#222225] bg-[#151518]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Curator Leaderboard & Cinema Analytics
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/25">
                  1-5 Scale
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Rated based on how others scored the movies they uploaded
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-[#1a1a1d] hover:bg-[#222225] rounded-xl transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#16161b] border-b border-[#222225] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalTab('standings')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                modalTab === 'standings'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-white bg-[#1e1e24]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Taste Standings</span>
            </button>

            <button
              type="button"
              onClick={() => setModalTab('analytics')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                modalTab === 'analytics'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-white bg-[#1e1e24]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Awards, Directors & Actors</span>
            </button>
          </div>

          {topCurator && topCurator.curatorRating !== null && (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 font-semibold text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <span>👑 #1 Tastemaker:</span>
              <span className="text-white">{topCurator.name}</span>
              <span>(★ {topCurator.curatorRatingFormatted})</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[68vh]">
          {modalTab === 'analytics' ? (
            <FunStatsTabs
              advancedStats={advancedStats}
              members={members}
              movies={movies}
              onSelectMovie={(m) => {
                if (onSelectMovie) onSelectMovie(m);
                onClose();
              }}
              onSelectMemberFilter={(mem) => {
                if (onFilterByUploader && mem !== 'ALL') {
                  onFilterByUploader(mem);
                  onClose();
                }
              }}
            />
          ) : (
            <div className="space-y-3.5">
          {leaderboard.map((item: MemberCuratorStats, index: number) => {
            const isExpanded = expandedMember === item.name;
            const rank = index + 1;
            const hasScore = item.curatorRating !== null;

            return (
              <div
                key={`${item.name}-${index}`}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  rank === 1 && hasScore
                    ? 'border-amber-500/40 bg-[#16161c] shadow-lg shadow-amber-500/5'
                    : 'border-[#242428] bg-[#141417] hover:border-[#323238]'
                }`}
              >
                {/* Member Summary Header */}
                <div
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedMember(isExpanded ? null : item.name)}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        rank === 1 && hasScore
                          ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-400/40'
                          : rank === 2 && hasScore
                          ? 'bg-zinc-300 text-zinc-900'
                          : rank === 3 && hasScore
                          ? 'bg-amber-800 text-amber-100'
                          : 'bg-[#202025] text-zinc-400 border border-[#2b2b30]'
                      }`}
                    >
                      {rank === 1 && hasScore ? '👑' : `#${rank}`}
                    </div>

                    {/* Member Avatar */}
                    {item.member.avatarUrl ? (
                      <img
                        src={item.member.avatarUrl}
                        alt={item.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-xs border border-[#2d2d33]"
                      />
                    ) : (
                      <span
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold ${item.member.avatarColor} shrink-0 shadow-xs`}
                      >
                        {item.member.initials}
                      </span>
                    )}

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-base truncate">{item.name}</span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${item.tierBg} ${item.tierColor} ${item.tierBorder}`}
                        >
                          {item.tierLabel}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{item.tierDescription}</p>
                    </div>
                  </div>

                  {/* Curator Rating & Stats */}
                  <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[#222225] shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-zinc-400 font-medium">Uploaded</div>
                      <div className="text-sm font-bold text-zinc-200">
                        {item.uploadedCount} {item.uploadedCount === 1 ? 'movie' : 'movies'}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xs text-zinc-400 font-medium">Reviews from Squad</div>
                      <div className="text-sm font-bold text-zinc-200">
                        {item.ratingsReceivedCount} ratings
                      </div>
                    </div>

                    {/* Big Score Box */}
                    <div
                      className={`px-3.5 py-2 rounded-xl border flex flex-col items-center min-w-[76px] ${
                        hasScore
                          ? `${item.tierBg} ${item.tierBorder}`
                          : 'bg-[#1b1b20] border-[#292930]'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-black text-lg">
                        <Star
                          className={`w-4 h-4 ${
                            hasScore ? `fill-current ${item.tierColor}` : 'text-zinc-600'
                          }`}
                        />
                        <span className={item.tierColor}>
                          {item.curatorRatingFormatted}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                        Score
                      </span>
                    </div>

                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#202025] transition"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Uploaded Movies Breakdown */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-[#202024] bg-[#0e0e11] space-y-4 animate-in fade-in duration-150">
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-amber-400" />
                        <span>Movies Uploaded by {item.member.shortName} ({item.moviesAdded.length})</span>
                      </div>
                      {onFilterByUploader && item.moviesAdded.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFilterByUploader(item.name);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#1f1f26] hover:bg-[#2b2b34] border border-[#2d2d36] text-xs font-semibold text-amber-400 hover:text-amber-300 transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Filter className="w-3 h-3" />
                          <span>View in Table</span>
                        </button>
                      )}
                    </div>

                    {/* Best & Worst summary chips */}
                    {item.moviesAdded.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {item.bestMovie && (
                          <div
                            onClick={() => {
                              if (onSelectMovie) {
                                onSelectMovie(item.bestMovie!.movie);
                                onClose();
                              }
                            }}
                            className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between cursor-pointer hover:bg-emerald-500/15 transition"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                🌟 Highest Rated Pick
                              </span>
                              <span className="font-semibold text-white truncate block">
                                {item.bestMovie.movie.title}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-emerald-400 shrink-0 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/60">
                              ★ {item.bestMovie.avg.toFixed(1)}
                            </span>
                          </div>
                        )}

                        {item.worstMovie && item.moviesAdded.length > 1 && item.worstMovie.movie.id !== item.bestMovie?.movie.id && (
                          <div
                            onClick={() => {
                              if (onSelectMovie) {
                                onSelectMovie(item.worstMovie!.movie);
                                onClose();
                              }
                            }}
                            className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between cursor-pointer hover:bg-rose-500/15 transition"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                                📉 Lowest Rated Pick
                              </span>
                              <span className="font-semibold text-white truncate block">
                                {item.worstMovie.movie.title}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-rose-400 shrink-0 bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-800/60">
                              ★ {item.worstMovie.avg.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Movie List */}
                    {item.moviesAdded.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-3 text-center">
                        {item.name} has not uploaded any movies yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {item.moviesAdded.map(({ movie, othersAvgScore, othersRatingsCount, avgScore, ratingsCount }) => {
                          const displayScore = othersAvgScore !== null ? othersAvgScore : avgScore;
                          const displayCount = othersRatingsCount > 0 ? othersRatingsCount : ratingsCount;

                          return (
                            <div
                              key={movie.id}
                              onClick={() => {
                                if (onSelectMovie) {
                                  onSelectMovie(movie);
                                  onClose();
                                }
                              }}
                              className="p-2.5 rounded-xl bg-[#141418] border border-[#222226] hover:border-[#35353d] hover:bg-[#1a1a20] transition flex items-center justify-between gap-2.5 cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={
                                    movie.poster && movie.poster !== 'N/A'
                                      ? movie.poster
                                      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&auto=format&fit=crop&q=80'
                                  }
                                  alt={movie.title}
                                  className="w-7 h-10 object-cover rounded-md bg-[#222] shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs text-zinc-100 truncate hover:text-amber-400 transition">
                                    {movie.title}
                                  </div>
                                  <div className="text-[11px] text-zinc-400">
                                    {movie.year || 'Unknown year'}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                {displayScore !== null ? (
                                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1 justify-end">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    <span>{displayScore.toFixed(1)}</span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-zinc-600">Unrated</span>
                                )}
                                <div className="text-[10px] text-zinc-500">
                                  {displayCount} {displayCount === 1 ? 'review' : 'reviews'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#222225] bg-[#151518] flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            Ratings follow the official <strong className="text-zinc-200">1 to 5 Star Rating System</strong>.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#202026] hover:bg-[#2c2c34] border border-[#2e2e36] text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
