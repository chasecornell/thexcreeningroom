import {
  X,
  ExternalLink,
  Calendar,
  Clock,
  Trash2,
  User,
  Star,
  Film,
} from 'lucide-react';
import { MovieItem, MemberProfile, PersonName } from '../types';

interface MovieDetailModalProps {
  movie: MovieItem | null;
  members: MemberProfile[];
  currentUserProfile?: { isAdmin: boolean; personName: PersonName | null } | null;
  onClose: () => void;
  onDelete?: (movieId: string) => void;
  onUpdateRating: (movieId: string, person: PersonName, rating: number) => void;
}

export function MovieDetailModal({
  members,
  movie,
  currentUserProfile,
  onClose,
  onDelete,
  onUpdateRating,
}: MovieDetailModalProps) {
  if (!movie) return null;

  const adderProfile = movie.addedBy ? members.find((m) => m.name === movie.addedBy) : null;

  // Calculate group rating
  const ratedEntries = members.filter((p) => (movie.ratings?.[p.name] ?? 0) > 0);
  const sumRating = ratedEntries.reduce((acc, p) => acc + (movie.ratings[p.name] || 0), 0);
  const avgRating = ratedEntries.length > 0 ? (sumRating / ratedEntries.length).toFixed(1) : null;

  return (
    <div
      id="movie-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="movie-detail-modal-card"
        className="bg-[#111114] border border-[#26262a] w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222225] bg-[#151518]">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white truncate max-w-sm">{movie.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#202026] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="flex gap-4">
            <img
              src={
                movie.poster && movie.poster !== 'N/A'
                  ? movie.poster
                  : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80'
              }
              alt={movie.title}
              className="w-28 h-40 object-cover rounded-xl shadow-md shrink-0 bg-[#1a1a1f] border border-[#2a2a30]"
              referrerPolicy="no-referrer"
            />

            <div className="space-y-2 flex-1 min-w-0">
              <div>
                <h3 className="text-xl font-bold text-white leading-tight">
                  {movie.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-200">{movie.year}</span>
                  {movie.runtime && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {movie.runtime}
                      </span>
                    </>
                  )}
                  {movie.releaseDate && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {movie.releaseDate}
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
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#1e1e24] border border-[#2a2a30] text-zinc-300"
                    >
                      {g.trim()}
                    </span>
                  ))}
                </div>
              )}

              {/* Added By & IMDb Link */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                {adderProfile && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] border ${adderProfile.badgeBg}`}
                  >
                    <User className="w-3 h-3" />
                    <span>Added by {movie.addedBy}</span>
                  </span>
                )}

                {movie.imdbID && (
                  <a
                    href={`https://www.imdb.com/title/${movie.imdbID}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/30 hover:bg-amber-500/20 transition"
                  >
                    <span>IMDb Page</span>
                    {movie.imdbRating && (
                      <span className="text-[10px] px-1.5 bg-amber-400 text-zinc-950 rounded font-bold ml-0.5">
                        ★ {movie.imdbRating}
                      </span>
                    )}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Director & Plot */}
          {movie.director && (
            <div className="text-xs text-zinc-400">
              <span className="font-semibold text-zinc-200">Director:</span>{' '}
              {movie.director}
            </div>
          )}

          {movie.plot && (
            <div className="p-3.5 rounded-xl bg-[#161619] border border-[#26262a] text-xs text-zinc-300 leading-relaxed italic">
              "{movie.plot}"
            </div>
          )}

          {/* Ratings Grid by the 6 People */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Roster Ratings & Watched Status ({ratedEntries.length}/6 watched)
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
                const currentRating = movie.ratings?.[member.name] || 0;
                const isAllowedToRate = currentUserProfile?.personName === member.name;

                return (
                  <div
                    key={member.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition ${
                      currentRating > 0
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-[#26262a] bg-[#141417]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${profile.avatarColor}`}
                      >
                        {profile.initials}
                      </span>
                      <span className="text-xs font-semibold text-zinc-200">
                        {member}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          disabled={!isAllowedToRate}
                          onClick={() =>
                            onUpdateRating(movie.id, member.name, currentRating === star ? 0 : star)
                          }
                          className={`p-0.5 transition ${isAllowedToRate ? 'hover:scale-125 cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                          title={isAllowedToRate ? `Rate ${star} stars` : `You can only change your own rating`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              currentRating >= star
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]'
                                : 'text-[#3f3f46]'
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

        {/* Footer with Delete Action */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#222225] bg-[#151518]">
          {onDelete && currentUserProfile?.isAdmin ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to remove "${movie.title}" from the dashboard?`)) {
                  onDelete(movie.id);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-900/50 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove from Dashboard</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#202026] rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
