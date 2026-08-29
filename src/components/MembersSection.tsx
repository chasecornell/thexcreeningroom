import { useState, useMemo } from 'react';
import {
  Users,
  Trophy,
  Star,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Shield,
  Film,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { MovieItem, MemberProfile, PersonName } from '../types';
import { calculateCuratorStats } from '../lib/curatorStats';

interface MembersSectionProps {
  movies: MovieItem[];
  members: MemberProfile[];
  currentUserProfile: { personName: PersonName | null; isAdmin: boolean } | null;
  selectedMemberFilter: PersonName | 'ALL';
  onSelectMemberFilter: (member: PersonName | 'ALL') => void;
  onOpenEditProfile: () => void;
  onOpenManageMembers?: () => void;
  onOpenLeaderboard: () => void;
  onSelectMovie?: (movie: MovieItem) => void;
}

export function MembersSection({
  movies,
  members,
  currentUserProfile,
  selectedMemberFilter,
  onSelectMemberFilter,
  onOpenEditProfile,
  onOpenManageMembers,
  onOpenLeaderboard,
}: MembersSectionProps) {
  const [viewMode, setViewMode] = useState<'all' | 'watched' | 'curator'>('all');

  const { curatorStats, topCurator } = useMemo(() => {
    const res = calculateCuratorStats(movies, members);
    return { curatorStats: res.statsMap, topCurator: res.topCurator };
  }, [movies, members]);

  // Compute individual statistics for each member
  const memberData = useMemo(() => {
    const totalMovies = movies.length;
    const stats: Record<
      PersonName,
      {
        watchedCount: number;
        sumScore: number;
        avgScore: number;
        uploadedCount: number;
        perfect5s: number;
        roasts1s: number;
      }
    > = {};

    members.forEach((m) => {
      stats[m.name] = {
        watchedCount: 0,
        sumScore: 0,
        avgScore: 0,
        uploadedCount: 0,
        perfect5s: 0,
        roasts1s: 0,
      };
    });

    movies.forEach((m) => {
      if (m.addedBy && stats[m.addedBy]) {
        stats[m.addedBy].uploadedCount += 1;
      }

      members.forEach((mem) => {
        const rating = m.ratings?.[mem.name] ?? 
          ((mem.name === 'Matt Tighe' || mem.shortName === 'Matt') ? m.ratings?.['Matt'] : undefined) ??
          ((mem.name === 'Matt') ? m.ratings?.['Matt Tighe'] : undefined);

        if (rating && rating > 0) {
          stats[mem.name].watchedCount += 1;
          stats[mem.name].sumScore += rating;
          if (rating === 5) stats[mem.name].perfect5s += 1;
          if (rating === 1) stats[mem.name].roasts1s += 1;
        }
      });
    });

    members.forEach((m) => {
      const p = m.name;
      if (stats[p] && stats[p].watchedCount > 0) {
        stats[p].avgScore = stats[p].sumScore / stats[p].watchedCount;
      }
    });

    return { totalMovies, stats };
  }, [movies, members]);

  return (
    <div id="members-section-container" className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#26262a]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Squad Members & Profiles</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#1f1f26] text-blue-300 border border-[#2a2a32]">
                {members.length} Curators
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Personalized watch completion, taste rankings, and member pick filters.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Active Filter Indicator */}
          {selectedMemberFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectMemberFilter('ALL')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtered: {selectedMemberFilter} (Reset)</span>
            </button>
          )}

          {/* Edit Profile Button */}
          <button
            type="button"
            onClick={onOpenEditProfile}
            className="px-3 py-1.5 rounded-xl bg-[#16161a] hover:bg-[#202026] border border-[#26262a] text-zinc-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Edit My Profile</span>
          </button>

          {/* Manage Members (Admin) */}
          {currentUserProfile?.isAdmin && onOpenManageMembers && (
            <button
              type="button"
              onClick={onOpenManageMembers}
              className="px-3 py-1.5 rounded-xl bg-[#16161a] hover:bg-[#202026] border border-[#26262a] text-zinc-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Add / Manage Members</span>
            </button>
          )}

          {/* Taste Leaderboard Button */}
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Filter / View Mode Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#111114] border border-[#222225] rounded-xl p-2.5">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 font-semibold px-2">View Metrics:</span>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              viewMode === 'all'
                ? 'bg-[#26262f] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Details
          </button>
          <button
            type="button"
            onClick={() => setViewMode('watched')}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              viewMode === 'watched'
                ? 'bg-[#26262f] text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Watch Progress
          </button>
          <button
            type="button"
            onClick={() => setViewMode('curator')}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              viewMode === 'curator'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-400 hover:text-amber-400'
            }`}
          >
            Curator Taste
          </button>
        </div>

        <div className="text-xs text-zinc-400 hidden sm:block">
          Click any member card to filter the film collection
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
          const profile = member;
          const s = memberData.stats[member.name] || {
            watchedCount: 0,
            sumScore: 0,
            avgScore: 0,
            uploadedCount: 0,
            perfect5s: 0,
            roasts1s: 0,
          };
          const cStat = curatorStats[member.name];
          const isSelected = selectedMemberFilter === member.name;
          const isTopTastemaker =
            topCurator && topCurator.name === member.name && topCurator.curatorRating !== null;
          const isCurrentUser = currentUserProfile?.personName === member.name;
          const pct =
            memberData.totalMovies > 0
              ? Math.round((s.watchedCount / memberData.totalMovies) * 100)
              : 0;

          return (
            <div
              key={member.id}
              className={`bg-[#111114] border rounded-2xl p-5 shadow-sm transition relative flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-400/80 ring-2 ring-amber-400/30 bg-[#16161c]'
                  : 'border-[#222225] hover:border-[#35353d] hover:bg-[#141418]'
              }`}
            >
              <div>
                {/* Member Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="w-12 h-12 rounded-xl object-cover shadow-sm ring-1 ring-white/10 shrink-0"
                      />
                    ) : (
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${profile.avatarColor} shadow-sm shrink-0`}
                      >
                        {profile.initials}
                      </span>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-white truncate">
                          {member.name}
                        </h3>
                        {isCurrentUser && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            You
                          </span>
                        )}
                        {isTopTastemaker && (
                          <span
                            title="#1 Group Tastemaker"
                            className="text-xs px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold"
                          >
                            👑 Top Curator
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                        <span>{s.uploadedCount} uploaded picks</span>
                        <span>•</span>
                        <span>Avg Rating: ★ {s.avgScore.toFixed(1)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Curator Badge */}
                  {cStat && cStat.curatorRating !== null && (
                    <div className="text-right shrink-0">
                      <div className={`text-xs font-extrabold flex items-center justify-end gap-0.5 ${cStat.tierColor}`}>
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{cStat.curatorRatingFormatted}</span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold inline-block border mt-0.5 ${cStat.tierBg} ${cStat.tierColor} ${cStat.tierBorder}`}
                      >
                        {cStat.tierLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar & Watched Stats */}
                <div className="mt-4 pt-3 border-t border-[#222226] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Watched Progress</span>
                    </span>
                    <span className="font-bold text-zinc-200">
                      {s.watchedCount}{' '}
                      <span className="text-zinc-500 font-normal">/ {memberData.totalMovies}</span>{' '}
                      <span className="text-amber-400 ml-1">({pct}%)</span>
                    </span>
                  </div>

                  <div className="w-full h-2 bg-[#222228] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Micro stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="bg-[#16161a] p-2 rounded-xl border border-[#24242a]">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">5★ Loved</div>
                      <div className="font-bold text-amber-400 mt-0.5">{s.perfect5s}</div>
                    </div>
                    <div className="bg-[#16161a] p-2 rounded-xl border border-[#24242a]">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">1★ Roasted</div>
                      <div className="font-bold text-rose-400 mt-0.5">{s.roasts1s}</div>
                    </div>
                    <div className="bg-[#16161a] p-2 rounded-xl border border-[#24242a]">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">Picks Added</div>
                      <div className="font-bold text-blue-400 mt-0.5">{s.uploadedCount}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-4 pt-3 border-t border-[#222226] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectMemberFilter(isSelected ? 'ALL' : member.name)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                      : 'bg-[#18181d] hover:bg-[#202026] text-zinc-300 hover:text-white border border-[#26262a]'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'Clear Filter' : `Filter ${member.shortName}'s Picks`}</span>
                </button>

                {isCurrentUser && (
                  <button
                    type="button"
                    onClick={onOpenEditProfile}
                    className="p-1.5 rounded-xl bg-[#18181d] hover:bg-[#202026] text-zinc-300 hover:text-amber-400 border border-[#26262a] transition cursor-pointer"
                    title="Change profile picture & details"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
