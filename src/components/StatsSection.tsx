import { useMemo, useState } from 'react';
import {
  Film,
  Trophy,
  Users,
  Star,
  Sparkles,
  Award,
  TrendingUp,
  BarChart3,
  ThumbsDown,
  CheckCircle2,
  Clock,
  Flame,
  Clapperboard,
} from 'lucide-react';
import { MovieItem, MemberProfile, PersonName } from '../types';
import { calculateCuratorStats } from '../lib/curatorStats';
import { calculateAdvancedStats } from '../lib/funStats';
import { FunStatsTabs } from './FunStatsTabs';

interface StatsSectionProps {
  movies: MovieItem[];
  members: MemberProfile[];
  onSelectMovie?: (movie: MovieItem) => void;
  onOpenLeaderboard?: () => void;
  onSelectMemberFilter?: (member: PersonName | 'ALL') => void;
}

export function StatsSection({
  movies,
  members,
  onSelectMovie,
  onOpenLeaderboard,
  onSelectMemberFilter,
}: StatsSectionProps) {
  const [statsViewMode, setStatsViewMode] = useState<'all' | 'curators' | 'cinema' | 'social'>('all');

  const { curatorStats, topCurator, leaderboard } = useMemo(() => {
    const res = calculateCuratorStats(movies, members);
    return {
      curatorStats: res.statsMap,
      topCurator: res.topCurator,
      leaderboard: res.leaderboard,
    };
  }, [movies, members]);

  const advancedStats = useMemo(() => {
    return calculateAdvancedStats(movies, members);
  }, [movies, members]);

  const stats = useMemo(() => {
    const totalMovies = movies.length;
    let totalRatingsCount = 0;
    let totalScoreSum = 0;
    const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const memberStats: Record<
      PersonName,
      { watchedCount: number; sumScore: number; avgScore: number; addedCount: number }
    > = {};

    members.forEach((m) => {
      memberStats[m.name] = { watchedCount: 0, sumScore: 0, avgScore: 0, addedCount: 0 };
    });

    let highestRatedMovie: { movie: MovieItem; avg: number; count: number } | null = null;
    let lowestRatedMovie: { movie: MovieItem; avg: number; count: number } | null = null;
    let mostDiscussedMovie: { movie: MovieItem; commentCount: number } | null = null;

    movies.forEach((m) => {
      const adder = m.addedBy === 'Matt' ? 'Matt Tighe' : m.addedBy;
      if (adder && memberStats[adder]) {
        memberStats[adder].addedCount += 1;
      }

      let movieSum = 0;
      let movieRatingCount = 0;

      members.forEach((mem) => {
        const p = mem.name;
        const rating = m.ratings?.[p] ?? 
          ((p === 'Matt Tighe' || mem.shortName === 'Matt') ? m.ratings?.['Matt'] : undefined) ??
          ((p === 'Matt') ? m.ratings?.['Matt Tighe'] : undefined);
        if (rating && rating > 0) {
          memberStats[p].watchedCount += 1;
          memberStats[p].sumScore += rating;
          totalRatingsCount += 1;
          totalScoreSum += rating;

          movieSum += rating;
          movieRatingCount += 1;

          if (ratingDistribution[rating] !== undefined) {
            ratingDistribution[rating] += 1;
          }
        }
      });

      if (movieRatingCount >= 2) {
        const avg = movieSum / movieRatingCount;
        if (
          !highestRatedMovie ||
          avg > highestRatedMovie.avg ||
          (avg === highestRatedMovie.avg && movieRatingCount > highestRatedMovie.count)
        ) {
          highestRatedMovie = { movie: m, avg, count: movieRatingCount };
        }

        if (
          !lowestRatedMovie ||
          avg < lowestRatedMovie.avg ||
          (avg === lowestRatedMovie.avg && movieRatingCount > lowestRatedMovie.count)
        ) {
          lowestRatedMovie = { movie: m, avg, count: movieRatingCount };
        }
      }

      const commentCount = m.comments?.length || 0;
      if (!mostDiscussedMovie || commentCount > mostDiscussedMovie.commentCount) {
        if (commentCount > 0) {
          mostDiscussedMovie = { movie: m, commentCount };
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
      totalRatingsCount > 0 ? (totalScoreSum / totalRatingsCount).toFixed(1) : '0.0';

    return {
      totalMovies,
      totalRatingsCount,
      overallCompletionPct,
      groupOverallAvg,
      memberStats,
      highestRatedMovie,
      lowestRatedMovie,
      mostDiscussedMovie,
      ratingDistribution,
    };
  }, [movies, members]);

  return (
    <div id="stats-section-container" className="space-y-5">
      {/* Section Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#26262a]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BarChart3 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Squad Stats & Analytics</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#1f1f26] text-amber-300 border border-[#2a2a32]">
                ★ {stats.groupOverallAvg} Squad Avg
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Overview of group watch metrics, rating distributions, and curator standings.
            </p>
          </div>
        </div>

        {onOpenLeaderboard && (
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Full Taste Leaderboard</span>
          </button>
        )}
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#111114] border border-[#222225] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Films</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.totalMovies}</div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>In squad collection</span>
          </div>
        </div>

        <div className="bg-[#111114] border border-[#222225] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Watch Progress</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {stats.overallCompletionPct}%
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <span>{stats.totalRatingsCount} total reviews logged</span>
          </div>
        </div>

        <div className="bg-[#111114] border border-[#222225] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Squad Rating</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            ★ {stats.groupOverallAvg}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            <span>Across all {members.length} members</span>
          </div>
        </div>

        <div
          onClick={onOpenLeaderboard}
          className={`bg-[#111114] border border-[#222225] rounded-2xl p-4 shadow-sm flex flex-col justify-between transition ${
            onOpenLeaderboard ? 'cursor-pointer hover:border-amber-500/40 hover:bg-[#15151a]' : ''
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">#1 Tastemaker</span>
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white truncate">
            {topCurator && topCurator.curatorRating !== null ? (
              <span className="flex items-center gap-1">👑 {topCurator.name}</span>
            ) : (
              'Rankings Open'
            )}
          </div>
          <div className="text-[11px] text-amber-400 font-semibold mt-1">
            {topCurator && topCurator.curatorRating !== null ? (
              <span>★ {topCurator.curatorRatingFormatted} Curator Score</span>
            ) : (
              <span>Rate picks to rank</span>
            )}
          </div>
        </div>
      </div>

      {/* Highlights: Highest Rated, Lowest Rated, and Rating Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Highest Rated Pick */}
        <div
          onClick={() => {
            if (stats.highestRatedMovie && onSelectMovie) {
              onSelectMovie(stats.highestRatedMovie.movie);
            }
          }}
          className={`bg-[#111114] border border-[#222225] rounded-2xl p-4 shadow-sm flex flex-col justify-between transition ${
            stats.highestRatedMovie && onSelectMovie
              ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-[#15151a]'
              : ''
          }`}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
              <Award className="w-4 h-4" />
              <span className="uppercase tracking-wider">Highest Rated Film</span>
            </div>
            {stats.highestRatedMovie ? (
              <>
                <h4 className="text-base font-bold text-white leading-snug line-clamp-1">
                  {stats.highestRatedMovie.movie.title}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {stats.highestRatedMovie.movie.year} • Added by {stats.highestRatedMovie.movie.addedBy}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-lg font-extrabold text-emerald-400">
                    ★ {stats.highestRatedMovie.avg.toFixed(1)}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    ({stats.highestRatedMovie.count}/{members.length} members rated)
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-zinc-500 py-3">Need at least 2 member ratings</p>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Squad Masterpiece</span>
            <span className="text-emerald-400 font-semibold">View Details →</span>
          </div>
        </div>

        {/* Lowest / Most Polarizing Pick */}
        <div
          onClick={() => {
            if (stats.lowestRatedMovie && onSelectMovie) {
              onSelectMovie(stats.lowestRatedMovie.movie);
            }
          }}
          className={`bg-[#111114] border border-[#222225] rounded-2xl p-4 shadow-sm flex flex-col justify-between transition ${
            stats.lowestRatedMovie && onSelectMovie
              ? 'cursor-pointer hover:border-rose-500/40 hover:bg-[#15151a]'
              : ''
          }`}
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-2">
              <ThumbsDown className="w-4 h-4" />
              <span className="uppercase tracking-wider">Lowest Rated / Roast</span>
            </div>
            {stats.lowestRatedMovie ? (
              <>
                <h4 className="text-base font-bold text-white leading-snug line-clamp-1">
                  {stats.lowestRatedMovie.movie.title}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {stats.lowestRatedMovie.movie.year} • Added by {stats.lowestRatedMovie.movie.addedBy}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-lg font-extrabold text-rose-400">
                    ★ {stats.lowestRatedMovie.avg.toFixed(1)}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    ({stats.lowestRatedMovie.count}/{members.length} members rated)
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-zinc-500 py-3">Need at least 2 member ratings</p>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
            <span>The Squad Roast</span>
            <span className="text-rose-400 font-semibold">View Details →</span>
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="bg-[#111114] border border-[#222225] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="uppercase tracking-wider">Score Distribution</span>
            </div>
            <div className="space-y-1.5 mt-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.ratingDistribution[stars] || 0;
                const pct =
                  stats.totalRatingsCount > 0
                    ? Math.round((count / stats.totalRatingsCount) * 100)
                    : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-6 font-bold text-zinc-300 shrink-0 flex items-center gap-0.5">
                      <span>{stars}</span>
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 bg-[#222228] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          stars === 5
                            ? 'bg-amber-400'
                            : stars === 4
                            ? 'bg-emerald-400'
                            : stars === 3
                            ? 'bg-blue-400'
                            : stars === 2
                            ? 'bg-orange-400'
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-[11px] text-zinc-400 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#222226] text-[11px] text-zinc-400 text-right font-medium">
            Total {stats.totalRatingsCount} reviews logged
          </div>
        </div>
      </div>

      {/* Curator & Tastemaker Rankings Mini-Table */}
      <div className="bg-[#111114] border border-[#222225] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Curator Taste Leaderboard</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Based on the average group ratings received by each member's uploaded movie picks.
            </p>
          </div>
          {onOpenLeaderboard && (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition cursor-pointer"
            >
              View Full Standings →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {leaderboard.map((stat, idx) => {
            const member = members.find((m) => m.name === stat.name);
            const isCrown = idx === 0 && stat.curatorRating !== null;

            return (
              <div
                key={`${stat.name}-${idx}`}
                className="bg-[#16161a] border border-[#26262a] rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center justify-center w-6 text-xs font-bold text-zinc-500 shrink-0">
                    {isCrown ? '👑' : `#${idx + 1}`}
                  </div>
                  {member?.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={stat.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0 shadow-xs"
                    />
                  ) : (
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        member?.avatarColor || 'bg-zinc-700 text-white'
                      } shrink-0 shadow-xs`}
                    >
                      {member?.initials || stat.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-100 truncate flex items-center gap-1.5">
                      <span>{stat.name}</span>
                      {onSelectMemberFilter && (
                        <button
                          type="button"
                          onClick={() => onSelectMemberFilter(stat.name)}
                          className="text-[10px] text-zinc-500 hover:text-amber-400 cursor-pointer"
                          title={`Filter movies added by ${stat.name}`}
                        >
                          (Filter)
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {stat.uploadedCount} picks • {stat.ratingsReceivedCount} reviews
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {stat.curatorRating !== null ? (
                    <>
                      <div className={`text-xs font-bold flex items-center justify-end gap-1 ${stat.tierColor}`}>
                        <Star className="w-3 h-3 fill-current" />
                        <span>{stat.curatorRatingFormatted}</span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold inline-block border mt-0.5 ${stat.tierBg} ${stat.tierColor} ${stat.tierBorder}`}
                      >
                        {stat.tierLabel}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-zinc-500">Unranked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Fun & Challenging Stat Trackers (Awards, Directors, Actors, Rivalries) */}
      <div className="bg-[#111114] border border-[#222225] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Deep-Dive Cinema & Curator Analytics</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                New
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Specialized awards, director & actor power rankings, and squad compatibility ratings.
            </p>
          </div>
        </div>

        <FunStatsTabs
          advancedStats={advancedStats}
          members={members}
          movies={movies}
          onSelectMovie={onSelectMovie}
          onSelectMemberFilter={onSelectMemberFilter}
        />
      </div>
    </div>
  );
}
