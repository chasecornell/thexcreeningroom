import { useState, useEffect, useMemo } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  Clock,
  Trash2,
  User,
  Star,
  Film,
  Users,
  Award,
  Loader2,
  Sparkles,
  Flame,
} from 'lucide-react';
import { MovieItem, MemberProfile, PersonName, OMDBMovieDetail } from '../types';
import { getMovieDetailsOMDB } from '../services/omdb';
import { calculateCuratorStats } from '../lib/curatorStats';

interface MovieDetailModalProps {
  movie: MovieItem | null;
  members: MemberProfile[];
  allMovies?: MovieItem[];
  currentUserProfile?: { isAdmin: boolean; personName: PersonName | null } | null;
  onClose: () => void;
  onDelete?: (movieId: string) => void;
  onUpdateRating: (movieId: string, person: PersonName, rating: number) => void;
  onOpenLeaderboard?: () => void;
}

export function MovieDetailModal({
  members,
  movie,
  allMovies = [],
  currentUserProfile,
  onClose,
  onDelete,
  onUpdateRating,
  onOpenLeaderboard,
}: MovieDetailModalProps) {
  const [omdbDetails, setOmdbDetails] = useState<OMDBMovieDetail | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch full details (actors, synopsis, rated) from OMDb if not fully present or on open
  useEffect(() => {
    if (!movie?.imdbID) {
      setOmdbDetails(null);
      return;
    }

    let isMounted = true;
    setIsLoadingDetails(true);

    getMovieDetailsOMDB(movie.imdbID)
      .then((details) => {
        if (isMounted && details) {
          setOmdbDetails(details);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch OMDb extra details:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [movie?.imdbID]);

  const curatorStats = useMemo(() => {
    if (!movie || allMovies.length === 0 || !movie.addedBy) return null;
    const { statsMap } = calculateCuratorStats(allMovies, members);
    return (
      statsMap[movie.addedBy] ||
      (movie.addedBy === 'Matt' ? statsMap['Matt Tighe'] : null) ||
      (movie.addedBy === 'Matt Tighe' ? statsMap['Matt'] : null) ||
      null
    );
  }, [movie, allMovies, members]);

  if (!movie) return null;

  const adderProfile = movie.addedBy ? members.find((m) => m.name === movie.addedBy) : null;

  // Extract combined or fetched data
  const plot = omdbDetails?.Plot && omdbDetails.Plot !== 'N/A' ? omdbDetails.Plot : movie.plot;
  const rawActors = omdbDetails?.Actors && omdbDetails.Actors !== 'N/A' ? omdbDetails.Actors : movie.actors;
  const director = omdbDetails?.Director && omdbDetails.Director !== 'N/A' ? omdbDetails.Director : movie.director;
  const runtime = omdbDetails?.Runtime && omdbDetails.Runtime !== 'N/A' ? omdbDetails.Runtime : movie.runtime;
  const rated = omdbDetails?.Rated && omdbDetails.Rated !== 'N/A' ? omdbDetails.Rated : movie.rated;
  const imdbRating = omdbDetails?.imdbRating && omdbDetails.imdbRating !== 'N/A' ? omdbDetails.imdbRating : movie.imdbRating;

  // Get top 3 actors
  const top3Actors: string[] = rawActors
    ? rawActors
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a && a !== 'N/A')
        .slice(0, 3)
    : [];

  // Calculate group rating stats
  const ratedEntries = members.filter((p) => {
    const r = movie.ratings?.[p.name] ?? 
      ((p.name === 'Matt Tighe' || p.shortName === 'Matt') ? movie.ratings?.['Matt'] : undefined) ??
      ((p.name === 'Matt') ? movie.ratings?.['Matt Tighe'] : undefined) ?? 0;
    return r > 0;
  });
  const sumRating = ratedEntries.reduce((acc, p) => {
    const r = movie.ratings?.[p.name] ?? 
      ((p.name === 'Matt Tighe' || p.shortName === 'Matt') ? movie.ratings?.['Matt'] : undefined) ??
      ((p.name === 'Matt') ? movie.ratings?.['Matt Tighe'] : undefined) ?? 0;
    return acc + r;
  }, 0);
  const avgRating = ratedEntries.length > 0 ? (sumRating / ratedEntries.length).toFixed(1) : null;

  const imdbUrl = movie.imdbID ? `https://www.imdb.com/title/${movie.imdbID}/` : null;

  return (
    <div
      id="movie-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="movie-detail-modal-card"
        className="bg-[#111114] border border-[#26262a] w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#222225] bg-[#151518]">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">{movie.title}</h2>
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <span>{movie.year}</span>
                {rated && (
                  <>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded border border-zinc-700 bg-zinc-800/80 text-[10px] font-semibold text-zinc-300">
                      {rated}
                    </span>
                  </>
                )}
                {runtime && (
                  <>
                    <span>•</span>
                    <span>{runtime}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {imdbUrl && (
              <a
                href={imdbUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 transition"
              >
                <span>IMDb</span>
                {imdbRating && <span>★{imdbRating}</span>}
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white bg-[#1a1a1f] hover:bg-[#26262c] rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[calc(92vh-130px)]">
          {/* Top Info Banner with Poster */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-28 sm:w-32 shrink-0 self-center sm:self-start relative group">
              <img
                src={
                  movie.poster && movie.poster !== 'N/A'
                    ? movie.poster
                    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80'
                }
                alt={movie.title}
                className="w-full h-auto rounded-xl shadow-lg border border-[#2a2a30] object-cover aspect-2/3 bg-[#18181c]"
                referrerPolicy="no-referrer"
              />
              {imdbRating && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                  <span>{imdbRating}</span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 flex-1 min-w-0">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                    {movie.title}
                  </h3>
                  {movie.year && (
                    <span className="text-sm font-semibold text-zinc-400">({movie.year})</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-zinc-400">
                  {runtime && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {runtime}
                    </span>
                  )}
                  {movie.releaseDate && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {movie.releaseDate}
                      </span>
                    </>
                  )}
                  {director && (
                    <>
                      <span>•</span>
                      <span>
                        Dir: <strong className="text-zinc-200 font-medium">{director}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Genre Pills */}
              {movie.genre && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {movie.genre.split(',').map((g) => (
                    <span
                      key={g.trim()}
                      className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#1a1a20] border border-[#2a2a32] text-zinc-300 shadow-xs"
                    >
                      {g.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Added By and Curator Taste Rating */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
                {adderProfile && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] border ${adderProfile.badgeBg}`}
                    >
                      <User className="w-3 h-3" />
                      <span>Added by {movie.addedBy}</span>
                    </span>

                    {curatorStats && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenLeaderboard) {
                            onClose();
                            onOpenLeaderboard();
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] border transition cursor-pointer ${
                          curatorStats.tierBg
                        } ${curatorStats.tierColor} ${curatorStats.tierBorder} hover:brightness-125`}
                        title="Click to view Curator Leaderboard"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Curator: ★ {curatorStats.curatorRatingFormatted}</span>
                        <span className="opacity-75 font-normal">({curatorStats.tierLabel})</span>
                      </button>
                    )}
                  </div>
                )}

                {imdbUrl && (
                  <a
                    href={imdbUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex sm:hidden items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5c518] text-zinc-950 font-bold text-xs shadow-xs"
                  >
                    <span>View on IMDb</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Hot Take Feature Callout */}
          {movie.isHotTake && movie.hotTakeText && (
            <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-orange-950/70 via-[#220d06] to-[#16161c] border-2 border-orange-500/60 shadow-xl shadow-orange-950/40 text-white relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <Flame className="w-4 h-4 fill-orange-500 text-orange-400 animate-pulse" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-orange-300">
                  {movie.addedBy}'s Weekly Hot Take
                </span>
                {movie.hotTakeCreatedAt && (
                  <span className="text-[11px] text-zinc-400 ml-auto">
                    {new Date(movie.hotTakeCreatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-serif italic text-amber-100 pl-2 border-l-2 border-orange-500/60 leading-relaxed">
                "{movie.hotTakeText}"
              </p>
            </div>
          )}

          {/* Top 3 Actors Section */}
          <div className="space-y-2 pt-1 border-t border-[#222225]">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-amber-400/90 font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>Top Cast & Actors</span>
              </div>
              {isLoadingDetails && (
                <span className="flex items-center gap-1 text-[11px] text-zinc-500 lowercase">
                  <Loader2 className="w-3 h-3 animate-spin" /> fetching details...
                </span>
              )}
            </div>

            {top3Actors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {top3Actors.map((actor, idx) => (
                  <div
                    key={actor}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#16161a] border border-[#26262c] shadow-xs hover:border-[#383842] transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-zinc-100 truncate">{actor}</div>
                      <div className="text-[10px] text-zinc-500 truncate">Starring Actor</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#161619] border border-[#242428] text-xs text-zinc-500 italic">
                {isLoadingDetails ? 'Loading top actors from OMDb...' : 'Actor details not available.'}
              </div>
            )}
          </div>

          {/* Description / Synopsis Section */}
          <div className="space-y-2 pt-1 border-t border-[#222225]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-amber-400/90" />
              <span>Brief Description</span>
            </div>

            {plot ? (
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#161619] border border-[#26262a] text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal shadow-xs">
                "{plot}"
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#161619] border border-[#242428] text-xs text-zinc-500 italic">
                {isLoadingDetails ? 'Fetching description...' : 'No synopsis available for this title.'}
              </div>
            )}
          </div>

          {/* Ratings Grid by the 6 People */}
          <div className="space-y-2.5 pt-1 border-t border-[#222225]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Group Ratings & Watched Status ({ratedEntries.length}/{members.length} watched)
              </h4>
              {avgRating && (
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> Group Avg: {avgRating} / 5
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {members.map((member) => {
                const profile = member;
                const currentRating = movie.ratings?.[member.name] ?? 
                  ((member.name === 'Matt Tighe' || member.shortName === 'Matt') ? movie.ratings?.['Matt'] : undefined) ??
                  ((member.name === 'Matt') ? movie.ratings?.['Matt Tighe'] : undefined) ?? 0;
                const isAllowedToRate = currentUserProfile?.personName === member.name || 
                  ((currentUserProfile?.personName === 'Matt' || currentUserProfile?.personName === 'Matt Tighe') && (member.name === 'Matt' || member.name === 'Matt Tighe'));

                return (
                  <div
                    key={member.id}
                    className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition ${
                      currentRating > 0
                        ? 'border-amber-500/40 bg-amber-500/5 shadow-xs'
                        : 'border-[#242428] bg-[#141417]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.name} className="w-6 h-6 rounded-md object-cover shrink-0" />
                      ) : (
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${profile.avatarColor} shrink-0`}
                        >
                          {profile.initials}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        {profile.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          disabled={!isAllowedToRate}
                          onClick={() =>
                            onUpdateRating(movie.id, member.name, currentRating === star ? 0 : star)
                          }
                          className={`p-0.5 transition ${
                            isAllowedToRate
                              ? 'hover:scale-125 cursor-pointer'
                              : 'cursor-not-allowed opacity-50'
                          }`}
                          title={
                            isAllowedToRate
                              ? `Rate ${star} stars`
                              : `Log in as ${member.name} to change rating`
                          }
                        >
                          <Star
                            className={`w-4 h-4 ${
                              currentRating >= star
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]'
                                : 'text-[#38383e]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer with IMDb Button & Actions */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-[#222225] bg-[#151518]">
          <div className="flex items-center gap-2">
            {imdbUrl && (
              <a
                href={imdbUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
              >
                <span>View Full Page on IMDb</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {onDelete && currentUserProfile?.isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to remove "${movie.title}" from the dashboard?`)) {
                    onDelete(movie.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-900/50 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Remove Movie</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white hover:bg-[#202026] border border-zinc-700/60 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
