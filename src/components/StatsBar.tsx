import { useMemo } from 'react';
import { Film, Trophy, Users, Star } from 'lucide-react';
import { MovieItem, MemberProfile, PersonName } from '../types';

interface StatsBarProps {
  movies: MovieItem[];
  members: MemberProfile[];
  selectedMemberFilter?: PersonName | 'ALL';
  onSelectMemberFilter?: (member: PersonName | 'ALL') => void;
  onSelectMovie?: (movie: MovieItem) => void;
}

export function StatsBar({
  movies,
  members,
  selectedMemberFilter = 'ALL',
  onSelectMemberFilter,
  onSelectMovie,
}: StatsBarProps) {
  const stats = useMemo(() => {
    const totalMovies = movies.length;
    let totalRatingsCount = 0;
    let totalScoreSum = 0;

    const memberStats: Record<PersonName, { watchedCount: number; sumScore: number; avgScore: number; addedCount: number }> = {};
    members.forEach(m => {
      memberStats[m.name] = { watchedCount: 0, sumScore: 0, avgScore: 0, addedCount: 0 };
    });

    let highestRatedMovie: { movie: MovieItem; avg: number; count: number } | null = null;

    movies.forEach((m) => {
      // count addedBy
      if (m.addedBy && memberStats[m.addedBy]) {
        memberStats[m.addedBy].addedCount += 1;
      }

      let movieSum = 0;
      let movieRatingCount = 0;

      members.forEach((mem) => {
        const p = mem.name;
        const rating = m.ratings?.[p];
        if (rating && rating > 0) {
          memberStats[p].watchedCount += 1;
          memberStats[p].sumScore += rating;
          totalRatingsCount += 1;
          totalScoreSum += rating;

          movieSum += rating;
          movieRatingCount += 1;
        }
      });

      if (movieRatingCount >= 2) {
        const avg = movieSum / movieRatingCount;
        if (!highestRatedMovie || avg > highestRatedMovie.avg || (avg === highestRatedMovie.avg && movieRatingCount > highestRatedMovie.count)) {
          highestRatedMovie = { movie: m, avg, count: movieRatingCount };
        }
      }
    });

    members.forEach((m) => {
      const p = m.name;
      if (memberStats[p] && memberStats[p].watchedCount > 0) {
        memberStats[p].avgScore = memberStats[p].sumScore / memberStats[p].watchedCount;
      }
    });

    const possibleRatings = totalMovies * members.length;
    const overallCompletionPct =
      possibleRatings > 0 ? Math.round((totalRatingsCount / possibleRatings) * 100) : 0;
    const groupOverallAvg =
      totalRatingsCount > 0 ? (totalScoreSum / totalRatingsCount).toFixed(1) : '—';

    return {
      totalMovies,
      totalRatingsCount,
      overallCompletionPct,
      groupOverallAvg,
      memberStats,
      highestRatedMovie,
    };
  }, [movies, members]);

  return (
    <div id="screening-room-stats" className="space-y-3">
      {/* Top summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#111114] border border-[#222225] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white leading-none">
              {stats.totalMovies}
            </div>
            <div className="text-xs text-[#9ca3af] mt-1.5 font-medium">
              Tracked Movies
            </div>
          </div>
        </div>

        <div className="bg-[#111114] border border-[#222225] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white leading-none">
              {stats.overallCompletionPct}%
            </div>
            <div className="text-xs text-[#9ca3af] mt-1.5 font-medium">
              Group Watched ({stats.totalRatingsCount} ratings)
            </div>
          </div>
        </div>

        <div className="bg-[#111114] border border-[#222225] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
            <Star className="w-5 h-5 fill-violet-400/20" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white leading-none">
              ★ {stats.groupOverallAvg}
            </div>
            <div className="text-xs text-[#9ca3af] mt-1.5 font-medium">
              Average Group Rating
            </div>
          </div>
        </div>

        <div 
          onClick={() => {
            if (stats.highestRatedMovie && onSelectMovie) {
              onSelectMovie(stats.highestRatedMovie.movie);
            }
          }}
          className={`bg-[#111114] border border-[#222225] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm transition ${
            stats.highestRatedMovie && onSelectMovie ? 'cursor-pointer hover:border-amber-500/40 hover:bg-[#15151a]' : ''
          }`}
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            {stats.highestRatedMovie ? (
              <>
                <div className="text-sm font-bold text-white truncate leading-tight group-hover:text-amber-400">
                  {stats.highestRatedMovie.movie.title}
                </div>
                <div className="text-xs text-amber-400 font-semibold mt-1">
                  ★ {stats.highestRatedMovie.avg.toFixed(1)}{' '}
                  <span className="text-zinc-400 font-normal">({stats.highestRatedMovie.count}/{members.length} watched)</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-zinc-500">—</div>
                <div className="text-xs text-zinc-500 mt-1">Top Rated</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 6-Person Watch Roster Progress Bar */}
      <div className="bg-[#111114] border border-[#222225] rounded-2xl p-4 shadow-sm">
        <div className="text-xs font-semibold text-[#9ca3af] mb-3 flex items-center justify-between">
          <span className="uppercase tracking-wider text-[11px] text-zinc-400">
            Group Roster ({members.length} Members)
          </span>
          {onSelectMemberFilter && (
            <button
              onClick={() => onSelectMemberFilter('ALL')}
              className={`text-xs px-2.5 py-1 rounded-lg transition cursor-pointer ${
                selectedMemberFilter === 'ALL'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1c1c20]'
              }`}
            >
              Show All
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {members.map((member) => {
            const profile = member;
            const memberData = stats.memberStats[member.name] || { watchedCount: 0, sumScore: 0, avgScore: 0, addedCount: 0 };
            const isSelected = selectedMemberFilter === member.name;
            const pct =
              stats.totalMovies > 0
                ? Math.round((memberData.watchedCount / stats.totalMovies) * 100)
                : 0;

            return (
              <button
                key={member.id}
                id={`member-stat-card-${profile.shortName.toLowerCase()}`}
                type="button"
                onClick={() => onSelectMemberFilter && onSelectMemberFilter(isSelected ? 'ALL' : member.name)}
                className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? `${profile.borderAccent} bg-[#1a1a20] ring-1 ring-amber-400/60 shadow-md`
                    : 'border-[#26262a] bg-[#141417] hover:bg-[#1a1a1f] hover:border-[#333338]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${profile.avatarColor} shrink-0 shadow-xs`}
                    >
                      {profile.initials}
                    </span>
                    <span className="text-xs font-semibold text-zinc-100 truncate">
                      {member.name}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between text-xs">
                  <span className="font-bold text-zinc-200">
                    {memberData.watchedCount}{' '}
                    <span className="font-normal text-zinc-500 text-[10px]">
                      / {stats.totalMovies}
                    </span>
                  </span>
                  {memberData.watchedCount > 0 ? (
                    <span className="text-amber-400 font-semibold text-[11px]">
                      ★ {memberData.avgScore.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-[10px]">0 ratings</span>
                  )}
                </div>

                {/* Micro progress bar */}
                <div className="w-full h-1.5 bg-[#26262b] rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(234,179,8,0.4)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
