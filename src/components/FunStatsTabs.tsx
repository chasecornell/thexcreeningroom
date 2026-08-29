import { useState } from 'react';
import {
  Sparkles,
  Trophy,
  Flame,
  Clapperboard,
  UserCheck,
  TrendingDown,
  TrendingUp,
  Skull,
  Eye,
  Film,
  Star,
  Swords,
  HeartHandshake,
  Search,
} from 'lucide-react';
import { MovieItem, MemberProfile, PersonName } from '../types';
import { AdvancedStatsResult, DirectorStat, ActorStat } from '../lib/funStats';

interface FunStatsTabsProps {
  advancedStats: AdvancedStatsResult;
  members: MemberProfile[];
  movies: MovieItem[];
  onSelectMovie?: (movie: MovieItem) => void;
  onSelectMemberFilter?: (member: PersonName | 'ALL') => void;
}

export function FunStatsTabs({
  advancedStats,
  members,
  movies,
  onSelectMovie,
  onSelectMemberFilter,
}: FunStatsTabsProps) {
  const [activeTab, setActiveTab] = useState<'awards' | 'directors' | 'actors' | 'rivalries'>('awards');
  const [directorSubFilter, setDirectorSubFilter] = useState<'top' | 'worst' | 'frequent'>('top');
  const [actorSubFilter, setActorSubFilter] = useState<'top' | 'worst' | 'frequent'>('top');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    awards,
    topDirectors,
    worstDirectors,
    mostFrequentDirectors,
    topActors,
    worstActors,
    mostFrequentActors,
    tasteTwins,
    mortalEnemies,
    pairSimilarities,
  } = advancedStats;

  return (
    <div id="fun-stats-container" className="space-y-4">
      {/* Sub Navigation Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#26262a] pb-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-[#141417] border border-[#26262a] rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('awards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'awards'
                ? 'bg-amber-500 text-zinc-950 shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f24]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Curator Awards & Roasts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'directors'
                ? 'bg-amber-500 text-zinc-950 shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f24]'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Director Hall of Fame</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('actors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'actors'
                ? 'bg-amber-500 text-zinc-950 shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f24]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Actor Power Rankings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rivalries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'rivalries'
                ? 'bg-amber-500 text-zinc-950 shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f24]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Taste Twins & Rivalries</span>
          </button>
        </div>

        <span className="text-[11px] text-zinc-400 hidden sm:inline-block">
          ⚡ Dynamically computed from {movies.length} movies
        </span>
      </div>

      {/* TAB 1: CURATOR SPECIAL AWARDS & ROASTS */}
      {activeTab === 'awards' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* 1. Worst Suggestor (Dumpster Diver) */}
            <div className="bg-[#141418] border border-rose-500/25 rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-3 -top-3 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 font-extrabold border border-rose-500/30 flex items-center gap-1">
                    🗑️ Worst Suggestor
                  </span>
                  <span className="text-[11px] text-zinc-400">The Dumpster Diver</span>
                </div>

                {awards.worstSuggestor ? (
                  <div className="flex items-center gap-3 my-2">
                    {awards.worstSuggestor.member.avatarUrl ? (
                      <img
                        src={awards.worstSuggestor.member.avatarUrl}
                        alt={awards.worstSuggestor.member.name}
                        className="w-12 h-12 rounded-xl object-cover border border-rose-500/40 shrink-0"
                      />
                    ) : (
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${awards.worstSuggestor.member.avatarColor} shrink-0`}
                      >
                        {awards.worstSuggestor.member.initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white truncate">
                        {awards.worstSuggestor.member.name}
                      </h4>
                      <p className="text-xs text-rose-400 font-extrabold flex items-center gap-1">
                        ★ {awards.worstSuggestor.avgScoreReceived.toFixed(1)} Squad Avg on Picks
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {awards.worstSuggestor.movieCount} movies uploaded
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4">Need more reviews on uploaded movies</p>
                )}
              </div>

              {awards.worstSuggestor && (
                <div className="mt-3 pt-2.5 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
                  <span className="truncate">
                    {awards.worstSuggestor.worstMovieTitle
                      ? `Lowest: ${awards.worstSuggestor.worstMovieTitle}`
                      : 'Subject of group roasts'}
                  </span>
                  {onSelectMemberFilter && (
                    <button
                      type="button"
                      onClick={() => onSelectMemberFilter(awards.worstSuggestor!.member.name)}
                      className="text-rose-400 hover:text-rose-300 font-bold ml-2 shrink-0 cursor-pointer"
                    >
                      Picks →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Most Mainstream / Popcorn Casual (NPC Award) */}
            <div className="bg-[#141418] border border-amber-500/25 rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-3 -top-3 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-extrabold border border-amber-500/30 flex items-center gap-1">
                    🍿 Popcorn Casual
                  </span>
                  <span className="text-[11px] text-zinc-400">Most Mainstream</span>
                </div>

                {awards.mostMainstreamSuggestor ? (
                  <div className="flex items-center gap-3 my-2">
                    {awards.mostMainstreamSuggestor.member.avatarUrl ? (
                      <img
                        src={awards.mostMainstreamSuggestor.member.avatarUrl}
                        alt={awards.mostMainstreamSuggestor.member.name}
                        className="w-12 h-12 rounded-xl object-cover border border-amber-500/40 shrink-0"
                      />
                    ) : (
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${awards.mostMainstreamSuggestor.member.avatarColor} shrink-0`}
                      >
                        {awards.mostMainstreamSuggestor.member.initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white truncate">
                        {awards.mostMainstreamSuggestor.member.name}
                      </h4>
                      <p className="text-xs text-amber-300 font-extrabold flex items-center gap-1">
                        🎬 {awards.mostMainstreamSuggestor.avgImdb.toFixed(1)} Avg IMDb Rating
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        Consistently chooses crowd-pleasers
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4">Need IMDb ratings data</p>
                )}
              </div>

              {awards.mostMainstreamSuggestor && (
                <div className="mt-3 pt-2.5 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
                  <span className="truncate">
                    {awards.mostMainstreamSuggestor.highestImdbMovie
                      ? `Top: ${awards.mostMainstreamSuggestor.highestImdbMovie}`
                      : 'Box-office favorite'}
                  </span>
                  {onSelectMemberFilter && (
                    <button
                      type="button"
                      onClick={() => onSelectMemberFilter(awards.mostMainstreamSuggestor!.member.name)}
                      className="text-amber-300 hover:text-amber-200 font-bold ml-2 shrink-0 cursor-pointer"
                    >
                      Picks →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. Obscurity Snob / Indie Hipster */}
            <div className="bg-[#141418] border border-cyan-500/25 rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-3 -top-3 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 font-extrabold border border-cyan-500/30 flex items-center gap-1">
                    🕶️ Indie Hipster
                  </span>
                  <span className="text-[11px] text-zinc-400">Obscurity Snob</span>
                </div>

                {awards.obscuritySnob ? (
                  <div className="flex items-center gap-3 my-2">
                    {awards.obscuritySnob.member.avatarUrl ? (
                      <img
                        src={awards.obscuritySnob.member.avatarUrl}
                        alt={awards.obscuritySnob.member.name}
                        className="w-12 h-12 rounded-xl object-cover border border-cyan-500/40 shrink-0"
                      />
                    ) : (
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${awards.obscuritySnob.member.avatarColor} shrink-0`}
                      >
                        {awards.obscuritySnob.member.initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white truncate">
                        {awards.obscuritySnob.member.name}
                      </h4>
                      <p className="text-xs text-cyan-300 font-extrabold flex items-center gap-1">
                        🎞️ {awards.obscuritySnob.avgImdb.toFixed(1)} Avg IMDb on Picks
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        Lowest mainstream rating average
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4">Need IMDb ratings data</p>
                )}
              </div>

              {awards.obscuritySnob && (
                <div className="mt-3 pt-2.5 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
                  <span className="truncate">
                    {awards.obscuritySnob.lowestImdbMovie
                      ? `Most Niche: ${awards.obscuritySnob.lowestImdbMovie}`
                      : 'Art-house specialist'}
                  </span>
                  {onSelectMemberFilter && (
                    <button
                      type="button"
                      onClick={() => onSelectMemberFilter(awards.obscuritySnob!.member.name)}
                      className="text-cyan-300 hover:text-cyan-200 font-bold ml-2 shrink-0 cursor-pointer"
                    >
                      Picks →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 4. The Rogue Agent (Highest Consensus Divergence) */}
            <div className="bg-[#141418] border border-purple-500/25 rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-3 -top-3 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 font-extrabold border border-purple-500/30 flex items-center gap-1">
                    🐺 The Rogue Agent
                  </span>
                  <span className="text-[11px] text-zinc-400">Wild Disagreement</span>
                </div>

                {awards.rogueCritic ? (
                  <div className="flex items-center gap-3 my-2">
                    {awards.rogueCritic.member.avatarUrl ? (
                      <img
                        src={awards.rogueCritic.member.avatarUrl}
                        alt={awards.rogueCritic.member.name}
                        className="w-12 h-12 rounded-xl object-cover border border-purple-500/40 shrink-0"
                      />
                    ) : (
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${awards.rogueCritic.member.avatarColor} shrink-0`}
                      >
                        {awards.rogueCritic.member.initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white truncate">
                        {awards.rogueCritic.member.name}
                      </h4>
                      <p className="text-xs text-purple-300 font-extrabold flex items-center gap-1">
                        ⚡ ±{awards.rogueCritic.avgDivergence.toFixed(1)} Stars vs Consensus
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        Never rates with the majority
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4">Need at least 2 shared reviews</p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
                <span>The Unpredictable Maverick</span>
                <span className="text-purple-400 font-semibold">Consensus Defier</span>
              </div>
            </div>

            {/* 5. The Grinch (Toughest Critic) */}
            <div className="bg-[#141418] border border-orange-500/25 rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-3 -top-3 w-16 h-16 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 font-extrabold border border-orange-500/30 flex items-center gap-1">
                    👺 The Grinch
                  </span>
                  <span className="text-[11px] text-zinc-400">Toughest Critic</span>
                </div>

                {awards.toughestCritic ? (
                  <div className="flex items-center gap-3 my-2">
                    {awards.toughestCritic.member.avatarUrl ? (
                      <img
                        src={awards.toughestCritic.member.avatarUrl}
                        alt={awards.toughestCritic.member.name}
                        className="w-12 h-12 rounded-xl object-cover border border-orange-500/40 shrink-0"
                      />
                    ) : (
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${awards.toughestCritic.member.avatarColor} shrink-0`}
                      >
                        {awards.toughestCritic.member.initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white truncate">
                        {awards.toughestCritic.member.name}
                      </h4>
                      <p className="text-xs text-orange-400 font-extrabold flex items-center gap-1">
                        ★ {awards.toughestCritic.avgScoreGiven.toFixed(1)} Personal Avg Given
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {awards.toughestCritic.ratedCount} movies reviewed
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-4">No reviews logged yet</p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Stingy with 4s and 5s</span>
                <span className="text-orange-400 font-semibold">Tough Love</span>
              </div>
            </div>

            {/* 6. Self-Bias Leader (Narcissist Metric) */}
            <div className="bg-[#141418] border border-emerald-500/25 rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-3 -top-3 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-extrabold border border-emerald-500/30 flex items-center gap-1">
                    🪞 Self-Bias Index
                  </span>
                  <span className="text-[11px] text-zinc-400">Narcissist Metric</span>
                </div>

                {awards.selfBiasLeader ? (
                  <div className="flex items-center gap-3 my-2">
                    {awards.selfBiasLeader.member.avatarUrl ? (
                      <img
                        src={awards.selfBiasLeader.member.avatarUrl}
                        alt={awards.selfBiasLeader.member.name}
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                      />
                    ) : (
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${awards.selfBiasLeader.member.avatarColor} shrink-0`}
                      >
                        {awards.selfBiasLeader.member.initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white truncate">
                        {awards.selfBiasLeader.member.name}
                      </h4>
                      <p className="text-xs text-emerald-400 font-extrabold flex items-center gap-1">
                        +{awards.selfBiasLeader.biasDelta.toFixed(1)} Stars on Own Picks
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        Self: ★{awards.selfBiasLeader.selfAvg.toFixed(1)} vs Others: ★
                        {awards.selfBiasLeader.othersAvg.toFixed(1)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4">
                    <h4 className="text-xs font-bold text-zinc-300">Humble Curators</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      No significant bias detected toward self-uploaded picks.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Loves their own taste</span>
                <span className="text-emerald-400 font-semibold">Self Praise</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIRECTOR POWER RANKINGS */}
      {activeTab === 'directors' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Sub Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#141418] p-3 rounded-xl border border-[#222226]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setDirectorSubFilter('top')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  directorSubFilter === 'top'
                    ? 'bg-emerald-500 text-zinc-950 font-black'
                    : 'bg-[#1b1b20] text-zinc-300 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>👑 Best Directors (Auteurs)</span>
              </button>

              <button
                type="button"
                onClick={() => setDirectorSubFilter('worst')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  directorSubFilter === 'worst'
                    ? 'bg-rose-500 text-zinc-950 font-black'
                    : 'bg-[#1b1b20] text-zinc-300 hover:text-white'
                }`}
              >
                <Skull className="w-3.5 h-3.5" />
                <span>🥔 Worst Directors (Razzies)</span>
              </button>

              <button
                type="button"
                onClick={() => setDirectorSubFilter('frequent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  directorSubFilter === 'frequent'
                    ? 'bg-amber-500 text-zinc-950 font-black'
                    : 'bg-[#1b1b20] text-zinc-300 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>🎬 Most Featured in Library</span>
              </button>
            </div>

            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search director..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#1a1a20] border border-[#2d2d34] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Director Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {(() => {
              let list =
                directorSubFilter === 'top'
                  ? topDirectors
                  : directorSubFilter === 'worst'
                  ? worstDirectors
                  : mostFrequentDirectors;

              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                list = list.filter((d) => d.name.toLowerCase().includes(q));
              }

              if (list.length === 0) {
                return (
                  <div className="col-span-full py-8 text-center text-xs text-zinc-500 bg-[#121215] rounded-2xl border border-[#202025]">
                    No director records found matching current criteria.
                  </div>
                );
              }

              return list.map((dir: DirectorStat, idx: number) => {
                const isTop = directorSubFilter === 'top' && idx === 0;
                const isWorst = directorSubFilter === 'worst' && idx === 0;

                return (
                  <div
                    key={`${dir.name}-${idx}`}
                    className="bg-[#141418] border border-[#26262a] hover:border-[#383842] rounded-2xl p-4 flex flex-col justify-between transition shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-zinc-500">#{idx + 1}</span>
                          <h4 className="text-sm font-bold text-white truncate">{dir.name}</h4>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-extrabold shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span
                            className={
                              dir.squadAvgRating >= 4.0
                                ? 'text-emerald-400'
                                : dir.squadAvgRating <= 2.0
                                ? 'text-rose-400'
                                : 'text-amber-300'
                            }
                          >
                            {dir.squadAvgRating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-400 flex items-center justify-between mb-3">
                        <span>
                          {dir.movieCount} {dir.movieCount === 1 ? 'film' : 'films'} in squad
                        </span>
                        {dir.imdbAvgRating && (
                          <span className="text-zinc-500">IMDb: {dir.imdbAvgRating.toFixed(1)}</span>
                        )}
                      </div>

                      {/* Film Thumbnails */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {dir.movies.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => onSelectMovie && onSelectMovie(m)}
                            className="group relative shrink-0 cursor-pointer rounded-lg overflow-hidden border border-[#2d2d34] hover:border-amber-400 transition"
                            title={`${m.title} (${m.year}) - Added by ${m.addedBy}`}
                          >
                            {m.poster && m.poster !== 'N/A' ? (
                              <img
                                src={m.poster}
                                alt={m.title}
                                className="w-12 h-16 object-cover group-hover:scale-105 transition"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-[#222228] flex items-center justify-center text-[9px] text-zinc-400 text-center p-1">
                                {m.title.slice(0, 10)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
                      <span className="truncate">{dir.movies.map((m) => m.title).join(', ')}</span>
                      {isTop && (
                        <span className="text-emerald-400 font-bold shrink-0 ml-1">👑 Master</span>
                      )}
                      {isWorst && (
                        <span className="text-rose-400 font-bold shrink-0 ml-1">🥔 Razzie</span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: ACTOR POWER RANKINGS */}
      {activeTab === 'actors' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Sub Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#141418] p-3 rounded-xl border border-[#222226]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActorSubFilter('top')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  actorSubFilter === 'top'
                    ? 'bg-emerald-500 text-zinc-950 font-black'
                    : 'bg-[#1b1b20] text-zinc-300 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>🌟 Top Rated Actors (GOATs)</span>
              </button>

              <button
                type="button"
                onClick={() => setActorSubFilter('worst')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  actorSubFilter === 'worst'
                    ? 'bg-rose-500 text-zinc-950 font-black'
                    : 'bg-[#1b1b20] text-zinc-300 hover:text-white'
                }`}
              >
                <Skull className="w-3.5 h-3.5" />
                <span>🦨 Box Office Poison</span>
              </button>

              <button
                type="button"
                onClick={() => setActorSubFilter('frequent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  actorSubFilter === 'frequent'
                    ? 'bg-amber-500 text-zinc-950 font-black'
                    : 'bg-[#1b1b20] text-zinc-300 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>💼 Most Featured (The Workhorses)</span>
              </button>
            </div>

            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search actor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#1a1a20] border border-[#2d2d34] rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Actor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {(() => {
              let list =
                actorSubFilter === 'top'
                  ? topActors
                  : actorSubFilter === 'worst'
                  ? worstActors
                  : mostFrequentActors;

              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                list = list.filter((a) => a.name.toLowerCase().includes(q));
              }

              if (list.length === 0) {
                return (
                  <div className="col-span-full py-8 text-center text-xs text-zinc-500 bg-[#121215] rounded-2xl border border-[#202025]">
                    No actor records found matching current criteria.
                  </div>
                );
              }

              return list.map((act: ActorStat, idx: number) => {
                const isTop = actorSubFilter === 'top' && idx === 0;
                const isWorst = actorSubFilter === 'worst' && idx === 0;

                return (
                  <div
                    key={`${act.name}-${idx}`}
                    className="bg-[#141418] border border-[#26262a] hover:border-[#383842] rounded-2xl p-4 flex flex-col justify-between transition shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-zinc-500">#{idx + 1}</span>
                          <h4 className="text-sm font-bold text-white truncate">{act.name}</h4>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-extrabold shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span
                            className={
                              act.squadAvgRating >= 4.0
                                ? 'text-emerald-400'
                                : act.squadAvgRating <= 2.0
                                ? 'text-rose-400'
                                : 'text-amber-300'
                            }
                          >
                            {act.squadAvgRating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-400 flex items-center justify-between mb-3">
                        <span>
                          {act.movieCount} {act.movieCount === 1 ? 'film' : 'films'} in squad
                        </span>
                        {act.imdbAvgRating && (
                          <span className="text-zinc-500">IMDb: {act.imdbAvgRating.toFixed(1)}</span>
                        )}
                      </div>

                      {/* Film Thumbnails */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {act.movies.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => onSelectMovie && onSelectMovie(m)}
                            className="group relative shrink-0 cursor-pointer rounded-lg overflow-hidden border border-[#2d2d34] hover:border-amber-400 transition"
                            title={`${m.title} (${m.year})`}
                          >
                            {m.poster && m.poster !== 'N/A' ? (
                              <img
                                src={m.poster}
                                alt={m.title}
                                className="w-12 h-16 object-cover group-hover:scale-105 transition"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-[#222228] flex items-center justify-center text-[9px] text-zinc-400 text-center p-1">
                                {m.title.slice(0, 10)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
                      <span className="truncate">{act.movies.map((m) => m.title).join(', ')}</span>
                      {isTop && (
                        <span className="text-emerald-400 font-bold shrink-0 ml-1">🌟 Star</span>
                      )}
                      {isWorst && (
                        <span className="text-rose-400 font-bold shrink-0 ml-1">🦨 Poison</span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: CURATOR RIVALRIES & TASTE TWINS MATRIX */}
      {activeTab === 'rivalries' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Highlight Cards: Taste Twins vs Mortal Enemies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Taste Twins */}
            <div className="bg-[#141418] border border-emerald-500/30 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-3 -top-3 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 font-extrabold border border-emerald-500/30 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4" />
                    <span>👯 Taste Twins (Highest Agreement)</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {tasteTwins ? `${tasteTwins.agreementPct}% Match` : '—'}
                  </span>
                </div>

                {tasteTwins ? (
                  <div className="flex items-center justify-around py-3">
                    {/* Member A */}
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      {tasteTwins.memberA.avatarUrl ? (
                        <img
                          src={tasteTwins.memberA.avatarUrl}
                          alt={tasteTwins.memberA.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-sm"
                        />
                      ) : (
                        <span
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-base ${tasteTwins.memberA.avatarColor} shadow-sm`}
                        >
                          {tasteTwins.memberA.initials}
                        </span>
                      )}
                      <span className="text-xs font-bold text-white">{tasteTwins.memberA.name}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-4">
                      <span className="text-xl">🤝</span>
                      <span className="text-[10px] text-zinc-400 mt-1 font-mono">
                        ±{tasteTwins.avgDivergence.toFixed(1)} stars delta
                      </span>
                    </div>

                    {/* Member B */}
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      {tasteTwins.memberB.avatarUrl ? (
                        <img
                          src={tasteTwins.memberB.avatarUrl}
                          alt={tasteTwins.memberB.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-sm"
                        />
                      ) : (
                        <span
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-base ${tasteTwins.memberB.avatarColor} shadow-sm`}
                        >
                          {tasteTwins.memberB.initials}
                        </span>
                      )}
                      <span className="text-xs font-bold text-white">{tasteTwins.memberB.name}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    Need at least 2 members to rate shared movies
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
                <span>
                  Calculated from {tasteTwins ? tasteTwins.sharedCount : 0} mutually rated films
                </span>
                <span className="text-emerald-400 font-semibold">Perfect Cinephile Sync</span>
              </div>
            </div>

            {/* Mortal Enemies */}
            <div className="bg-[#141418] border border-rose-500/30 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-3 -top-3 w-20 h-20 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-400 font-extrabold border border-rose-500/30 flex items-center gap-1.5">
                    <Swords className="w-4 h-4" />
                    <span>⚔️ Mortal Enemies (Biggest Disparity)</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {mortalEnemies ? `${mortalEnemies.agreementPct}% Match` : '—'}
                  </span>
                </div>

                {mortalEnemies ? (
                  <div className="flex items-center justify-around py-3">
                    {/* Member A */}
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      {mortalEnemies.memberA.avatarUrl ? (
                        <img
                          src={mortalEnemies.memberA.avatarUrl}
                          alt={mortalEnemies.memberA.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-500/40 shadow-sm"
                        />
                      ) : (
                        <span
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-base ${mortalEnemies.memberA.avatarColor} shadow-sm`}
                        >
                          {mortalEnemies.memberA.initials}
                        </span>
                      )}
                      <span className="text-xs font-bold text-white">{mortalEnemies.memberA.name}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-4">
                      <span className="text-xl">💥</span>
                      <span className="text-[10px] text-zinc-400 mt-1 font-mono">
                        ±{mortalEnemies.avgDivergence.toFixed(1)} stars delta
                      </span>
                    </div>

                    {/* Member B */}
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      {mortalEnemies.memberB.avatarUrl ? (
                        <img
                          src={mortalEnemies.memberB.avatarUrl}
                          alt={mortalEnemies.memberB.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-500/40 shadow-sm"
                        />
                      ) : (
                        <span
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-base ${mortalEnemies.memberB.avatarColor} shadow-sm`}
                        >
                          {mortalEnemies.memberB.initials}
                        </span>
                      )}
                      <span className="text-xs font-bold text-white">{mortalEnemies.memberB.name}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    Need more mutual ratings to find taste rivalries
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#222226] text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Never let these two pick a double feature together</span>
                <span className="text-rose-400 font-semibold">Total Polar Opposites</span>
              </div>
            </div>
          </div>

          {/* Full Pairwise Match Table */}
          <div className="bg-[#141418] border border-[#242428] rounded-2xl p-4 sm:p-5 shadow-sm">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Squad Agreement Matrix</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pairSimilarities.map((pair, idx) => (
                <div
                  key={`${pair.memberA.name}-${pair.memberB.name}-${idx}`}
                  className="bg-[#18181d] border border-[#282830] rounded-xl p-3 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-zinc-200 truncate">
                      {pair.memberA.name} & {pair.memberB.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ({pair.sharedCount} shared)
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                        pair.agreementPct >= 75
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : pair.agreementPct <= 45
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {pair.agreementPct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
