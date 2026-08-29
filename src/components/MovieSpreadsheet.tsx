import { useState, useMemo, useId } from 'react';
import {
  Search,
  ExternalLink,
  Filter,
  ArrowUpDown,
  Star,
  Film,
  Plus,
  Info,
  SlidersHorizontal,
  Trash2,
  Upload,
  Database,
  MessageSquare,
  Trophy,
  Flame,
} from 'lucide-react';
import { MovieItem, MemberProfile, PersonName } from '../types';
import { StarRating } from './StarRating';
import { CommentsModal } from './CommentsModal';
import { calculateCuratorStats } from '../lib/curatorStats';

interface MovieSpreadsheetProps {
  movies: MovieItem[];
  members: MemberProfile[];
  currentUserProfile?: { isAdmin: boolean; personName: PersonName | null } | null;
  onUpdateRating: (movieId: string, person: PersonName, rating: number) => void;
  onOpenAddModal: () => void;
  onSelectMovieDetail: (movie: MovieItem) => void;
  onDeleteMovie?: (movieId: string) => void;
  onDeleteAllMovies?: () => void;
  onOpenImportModal?: () => void;
  onLoadAdamSeedMovies?: () => void;
  selectedMemberFilter?: PersonName | 'ALL';
  onSelectMemberFilter?: (member: PersonName | 'ALL') => void;
  onOpenLeaderboard?: () => void;
}

type SortField = 'addedAt' | 'title' | 'year' | 'avgRating' | 'watchedCount';
type SortDirection = 'asc' | 'desc';

export function MovieSpreadsheet({
  movies,
  members,
  currentUserProfile,
  onUpdateRating,
  onOpenAddModal,
  onSelectMovieDetail,
  onDeleteMovie,
  onDeleteAllMovies,
  onOpenImportModal,
  onLoadAdamSeedMovies,
  selectedMemberFilter = 'ALL',
  onSelectMemberFilter,
  onOpenLeaderboard,
}: MovieSpreadsheetProps) {
  const searchFilterId = useId();
  const genreFilterId = useId();
  const addedByFilterId = useId();
  const watchStatusFilterId = useId();
  const sortSelectId = useId();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [selectedAdder, setSelectedAdder] = useState<string>('ALL');
  const [watchStatusFilter, setWatchStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCommentMovie, setSelectedCommentMovie] = useState<MovieItem | null>(null);

  // Order members so that the signed-in user is ALWAYS first in the rating columns
  const orderedMembers = useMemo(() => {
    if (!currentUserProfile?.personName) return members;
    const currentName = currentUserProfile.personName;
    const userMember = members.find(
      (m) =>
        m.name === currentName ||
        ((currentName === 'Matt' || currentName === 'Matt Tighe') && (m.name === 'Matt' || m.name === 'Matt Tighe'))
    );
    if (!userMember) return members;
    const others = members.filter((m) => m.id !== userMember.id);
    return [userMember, ...others];
  }, [members, currentUserProfile?.personName]);

  // Compute Curator / Taste ratings for all members
  const curatorStats = useMemo(() => {
    return calculateCuratorStats(movies, members).statsMap;
  }, [movies, members]);

  // Extract unique genres for filter dropdown
  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();
    movies.forEach((m) => {
      if (m.genre) {
        m.genre.split(',').forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) genreSet.add(trimmed);
        });
      }
    });
    return Array.from(genreSet).sort();
  }, [movies]);

  // Compute filtered and sorted movies
  const filteredMovies = useMemo(() => {
    return movies
      .filter((movie) => {
        // Text search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = movie.title.toLowerCase().includes(q);
          const matchDirector = movie.director?.toLowerCase().includes(q);
          const matchGenre = movie.genre?.toLowerCase().includes(q);
          const matchYear = movie.year?.toLowerCase().includes(q);
          if (!matchTitle && !matchDirector && !matchGenre && !matchYear) {
            return false;
          }
        }

        // Genre filter
        if (selectedGenre !== 'ALL') {
          if (!movie.genre?.toLowerCase().includes(selectedGenre.toLowerCase())) {
            return false;
          }
        }

        // Added by filter
        if (selectedAdder !== 'ALL') {
          const matchesAdder = movie.addedBy === selectedAdder ||
            ((selectedAdder === 'Matt' || selectedAdder === 'Matt Tighe') && (movie.addedBy === 'Matt' || movie.addedBy === 'Matt Tighe'));
          if (!matchesAdder) {
            return false;
          }
        }

        // Member stat bar filter
        if (selectedMemberFilter !== 'ALL') {
          const rating = movie.ratings?.[selectedMemberFilter] ??
            ((selectedMemberFilter === 'Matt' || selectedMemberFilter === 'Matt Tighe') ? (movie.ratings?.['Matt'] ?? movie.ratings?.['Matt Tighe']) : undefined);
          if (!rating || rating === 0) {
            return false;
          }
        }

        // Watch status filter
        if (watchStatusFilter === 'HOT_TAKES_ONLY') {
          if (!movie.isHotTake) return false;
        } else if (watchStatusFilter === 'FULLY_WATCHED') {
          const count = members.filter((p) => {
            const r = movie.ratings?.[p.name] ??
              ((p.name === 'Matt Tighe' || p.shortName === 'Matt') ? movie.ratings?.['Matt'] : undefined) ??
              ((p.name === 'Matt') ? movie.ratings?.['Matt Tighe'] : undefined) ?? 0;
            return r > 0;
          }).length;
          if (count !== members.length) return false;
        } else if (watchStatusFilter === 'UNWATCHED_BY_ALL') {
          const count = members.filter((p) => {
            const r = movie.ratings?.[p.name] ??
              ((p.name === 'Matt Tighe' || p.shortName === 'Matt') ? movie.ratings?.['Matt'] : undefined) ??
              ((p.name === 'Matt') ? movie.ratings?.['Matt Tighe'] : undefined) ?? 0;
            return r > 0;
          }).length;
          if (count > 0) return false;
        } else if (watchStatusFilter.startsWith('WATCHED_BY_')) {
          const person = watchStatusFilter.replace('WATCHED_BY_', '') as PersonName;
          const r = movie.ratings?.[person] ??
            ((person === 'Matt' || person === 'Matt Tighe') ? (movie.ratings?.['Matt'] ?? movie.ratings?.['Matt Tighe']) : undefined);
          if (!(r && r > 0)) return false;
        } else if (watchStatusFilter.startsWith('UNWATCHED_BY_')) {
          const person = watchStatusFilter.replace('UNWATCHED_BY_', '') as PersonName;
          const r = movie.ratings?.[person] ??
            ((person === 'Matt' || person === 'Matt Tighe') ? (movie.ratings?.['Matt'] ?? movie.ratings?.['Matt Tighe']) : undefined);
          if (r && r > 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'title') {
          comp = a.title.localeCompare(b.title);
        } else if (sortField === 'year') {
          const yA = parseInt(a.year, 10) || 0;
          const yB = parseInt(b.year, 10) || 0;
          comp = yA - yB;
        } else if (sortField === 'addedAt') {
          comp = (a.addedAt || 0) - (b.addedAt || 0);
        } else if (sortField === 'avgRating') {
          const getAvg = (m: MovieItem) => {
            const ratings = members.map((p) => {
              return m.ratings?.[p.name] ?? 
                ((p.name === 'Matt Tighe' || p.shortName === 'Matt') ? m.ratings?.['Matt'] : undefined) ??
                ((p.name === 'Matt') ? m.ratings?.['Matt Tighe'] : undefined) ?? 0;
            }).filter((r) => r > 0);
            return ratings.length > 0 ? ratings.reduce((acc, v) => acc + v, 0) / ratings.length : 0;
          };
          comp = getAvg(a) - getAvg(b);
        } else if (sortField === 'watchedCount') {
          const getCount = (m: MovieItem) =>
            members.filter((p) => {
              const r = m.ratings?.[p.name] ?? 
                ((p.name === 'Matt Tighe' || p.shortName === 'Matt') ? m.ratings?.['Matt'] : undefined) ??
                ((p.name === 'Matt') ? m.ratings?.['Matt Tighe'] : undefined) ?? 0;
              return r > 0;
            }).length;
          comp = getCount(a) - getCount(b);
        }

        return sortDirection === 'desc' ? -comp : comp;
      });
  }, [
    movies,
    members,
    searchQuery,
    selectedGenre,
    selectedAdder,
    selectedMemberFilter,
    watchStatusFilter,
    sortField,
    sortDirection,
  ]);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'title' ? 'asc' : 'desc');
    }
  };

  return (
    <div id="movie-spreadsheet-container" className="space-y-4">
      {/* Control Bar: Search, Filters, Sorting & Add Button */}
      <div className="bg-[#111114] border border-[#222225] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <label htmlFor={searchFilterId} className="sr-only">
              Search movies
            </label>
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id={searchFilterId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, director, year, or genre..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#26262a] bg-[#161619] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {onOpenImportModal && currentUserProfile?.isAdmin && (
              <button
                type="button"
                id="open-import-modal-btn"
                onClick={onOpenImportModal}
                className="px-3.5 py-2 rounded-xl bg-[#16161a] hover:bg-[#202026] text-zinc-200 hover:text-white border border-[#26262a] text-xs font-semibold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                title="Import or paste seed movie data"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Import Seed</span>
              </button>
            )}

            {movies.length > 0 && onDeleteAllMovies && currentUserProfile?.isAdmin && (
              <button
                type="button"
                id="clear-all-movies-btn"
                onClick={() => {
                  if (window.confirm('Delete all movies from Firestore? This will permanently wipe the current movie list.')) {
                    onDeleteAllMovies();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#181214] hover:bg-[#241416] text-rose-300 hover:text-rose-200 border border-rose-900/40 text-xs font-semibold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                title="Delete all loaded movies from Firestore"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}

            <button
              type="button"
              id="open-add-movie-modal-btn"
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 text-sm font-bold shadow-md shadow-amber-500/10 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Movie</span>
            </button>
          </div>
        </div>

        {/* Filters and Sorters Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#1e1e22] text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium shrink-0">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span>Filters:</span>
          </div>

          {/* Genre Filter */}
          <div className="relative">
            <label htmlFor={genreFilterId} className="sr-only">
              Filter by genre
            </label>
            <select
              id={genreFilterId}
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#26262a] bg-[#161619] font-medium text-zinc-200 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Genres ({movies.length})</option>
              {allGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Added By Filter */}
          <div className="relative">
            <label htmlFor={addedByFilterId} className="sr-only">
              Filter by added by
            </label>
            <select
              id={addedByFilterId}
              value={selectedAdder}
              onChange={(e) => setSelectedAdder(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#26262a] bg-[#161619] font-medium text-zinc-200 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Adders</option>
              {members.map((member) => {
                const c = curatorStats[member.name];
                return (
                  <option key={member.id} value={member.name}>
                    Added by {member.name} {c && c.curatorRating !== null ? `(★ ${c.curatorRatingFormatted})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Watch Status Filter */}
          <div className="relative">
            <label htmlFor={watchStatusFilterId} className="sr-only">
              Filter by watch status
            </label>
            <select
              id={watchStatusFilterId}
              value={watchStatusFilter}
              onChange={(e) => setWatchStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#26262a] bg-[#161619] font-medium text-zinc-200 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Watch Statuses</option>
              <option value="HOT_TAKES_ONLY">🔥 Hot Takes Only</option>
              <option value="FULLY_WATCHED">Watched by All Members</option>
              <option value="UNWATCHED_BY_ALL">Unwatched by Anyone</option>
              <optgroup label="Watched by Person">
                {members.map((p, i) => (
                  <option key={`watched-${p.id || p.name}-${i}`} value={`WATCHED_BY_${p.name}`}>
                    Watched by {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Unwatched by Person">
                {members.map((p, i) => (
                  <option key={`unwatched-${p.id || p.name}-${i}`} value={`UNWATCHED_BY_${p.name}`}>
                    Unwatched by {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Sorting Dropdown & Toggle */}
          <div className="ml-auto flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-400 font-medium">Sort:</span>
            <label htmlFor={sortSelectId} className="sr-only">
              Sort by
            </label>
            <select
              id={sortSelectId}
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-2.5 py-1.5 rounded-lg border border-[#26262a] bg-[#161619] font-medium text-zinc-200 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="addedAt">Recently Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="year">Release Year</option>
              <option value="avgRating">Group Avg Rating</option>
              <option value="watchedCount">Most Watched</option>
            </select>
            <button
              type="button"
              id="sort-direction-toggle-btn"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1.5 rounded-lg border border-[#26262a] bg-[#161619] hover:bg-[#202025] text-zinc-300 transition cursor-pointer"
              title={`Sorting ${sortDirection === 'asc' ? 'Ascending' : 'Descending'} (Click to flip)`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {(selectedGenre !== 'ALL' ||
        selectedAdder !== 'ALL' ||
        watchStatusFilter !== 'ALL' ||
        searchQuery ||
        selectedMemberFilter !== 'ALL') && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-400">Active filters:</span>
          {selectedMemberFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Watched by: {selectedMemberFilter}
              <button
                onClick={() => onSelectMemberFilter && onSelectMemberFilter('ALL')}
                className="hover:text-white cursor-pointer ml-0.5"
              >
                ×
              </button>
            </span>
          )}
          {selectedGenre !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#18181d] text-zinc-300 border border-[#2a2a30]">
              Genre: {selectedGenre}
              <button onClick={() => setSelectedGenre('ALL')} className="hover:text-white cursor-pointer ml-0.5">
                ×
              </button>
            </span>
          )}
          {selectedAdder !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#18181d] text-zinc-300 border border-[#2a2a30]">
              Added by: {selectedAdder}
              <button onClick={() => setSelectedAdder('ALL')} className="hover:text-white cursor-pointer ml-0.5">
                ×
              </button>
            </span>
          )}
          {watchStatusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#18181d] text-zinc-300 border border-[#2a2a30]">
              Status: {watchStatusFilter}
              <button onClick={() => setWatchStatusFilter('ALL')} className="hover:text-white cursor-pointer ml-0.5">
                ×
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#18181d] text-zinc-300 border border-[#2a2a30]">
              Query: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-white cursor-pointer ml-0.5">
                ×
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('ALL');
              setSelectedAdder('ALL');
              setWatchStatusFilter('ALL');
              if (onSelectMemberFilter) onSelectMemberFilter('ALL');
            }}
            className="text-amber-400 hover:text-amber-300 hover:underline font-medium ml-1 cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Spreadsheet / Giant-List View */}
      <div
        id="movies-spreadsheet-table-wrapper"
        className="bg-[#111114] border border-[#222225] rounded-2xl shadow-md overflow-hidden"
      >
        {/* Mobile Swipe / Tap Hint */}
        <div className="sm:hidden px-3 py-1.5 bg-[#141417] border-b border-[#222225] flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 text-zinc-300">
            <Film className="w-3 h-3 text-amber-400" />
            <span>Tap poster for info</span>
          </span>
          <span className="text-amber-400 font-medium flex items-center gap-1">
            <span>{currentUserProfile?.personName ? `Your rating is next column (${currentUserProfile.personName})` : 'Scroll for ratings'}</span>
            <span>→</span>
          </span>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[780px] sm:min-w-[1100px]">
            {/* Table Header with Fixed Columns */}
            <thead>
              <tr className="border-b border-[#222225] bg-[#151518] text-xs font-bold text-zinc-400 select-none">
                {/* # Col */}
                <th className="sticky left-0 z-20 bg-[#151518] py-2 sm:py-3.5 px-1 sm:px-3 w-8 sm:w-10 text-center text-zinc-500 text-[11px] sm:text-xs">#</th>

                {/* Movie Details Column - Compact Poster on Mobile, Full on Desktop */}
                <th
                  onClick={() => handleSortToggle('title')}
                  className="sticky left-[32px] sm:left-[40px] z-20 bg-[#151518] py-2 sm:py-3.5 px-1.5 sm:px-4 w-[54px] sm:w-auto sm:min-w-[320px] cursor-pointer hover:text-amber-400 transition shadow-[1px_0_0_0_#222225]"
                >
                  {/* Mobile Header Label */}
                  <div className="sm:hidden flex items-center justify-center" title="Sort by title (Tap to toggle)">
                    <Film className="w-3.5 h-3.5 text-zinc-400" />
                  </div>

                  {/* Desktop Header Label */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span>Movie & Details</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                {/* Member Rating Columns (Signed-in User's column is defaulted first right next to Movie on mobile & desktop) */}
                {orderedMembers.map((member) => {
                  const isCurrentUser =
                    currentUserProfile?.personName === member.name ||
                    ((currentUserProfile?.personName === 'Matt' || currentUserProfile?.personName === 'Matt Tighe') &&
                      (member.name === 'Matt' || member.name === 'Matt Tighe'));
                  return (
                    <th
                      key={member.id}
                      id={`col-header-${member.shortName.toLowerCase()}`}
                      className={`py-2 sm:py-3.5 px-1.5 sm:px-2 min-w-[105px] sm:min-w-[120px] text-center border-l border-[#1e1e23] ${
                        isCurrentUser ? 'bg-amber-500/10 border-b-2 border-b-amber-400' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md object-cover shrink-0 ${
                                isCurrentUser ? 'ring-1 ring-amber-400' : ''
                              }`}
                            />
                          ) : (
                            <span
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md flex items-center justify-center text-[8px] sm:text-[9px] font-bold ${member.avatarColor} shrink-0 ${
                                isCurrentUser ? 'ring-1 ring-amber-400' : ''
                              }`}
                            >
                              {member.initials}
                            </span>
                          )}
                          <span className="font-semibold text-zinc-200 truncate max-w-[75px] sm:max-w-[90px] text-[11px] sm:text-xs flex items-center gap-1">
                            <span>{member.shortName}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] font-bold text-amber-950 bg-amber-400 px-1 py-0.2 rounded shadow-xs">
                                You
                              </span>
                            )}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] sm:text-[10px] truncate max-w-[80px] ${
                            isCurrentUser ? 'font-bold text-amber-300' : 'font-normal text-zinc-500'
                          }`}
                        >
                          {isCurrentUser
                            ? 'Your Rating'
                            : member.name === 'Tristan Brady'
                            ? 'Tristan B.'
                            : member.name}
                        </span>
                      </div>
                    </th>
                  );
                })}

                {/* Added By Column */}
                <th className="py-2 sm:py-3.5 px-2 sm:px-3 min-w-[90px] sm:min-w-[110px] text-center border-l border-[#1e1e23]">Added By</th>

                {/* Group Stats Column */}
                <th
                  onClick={() => handleSortToggle('avgRating')}
                  className="py-2 sm:py-3.5 px-2 sm:px-3 min-w-[100px] sm:min-w-[120px] text-center border-l border-[#1e1e23] cursor-pointer hover:text-amber-400 transition"
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <div className="flex items-center gap-1">
                      <span>Group Avg</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-normal text-zinc-500">Watched count</span>
                  </div>
                </th>

                {/* Actions Column */}
                <th className="py-2 sm:py-3.5 px-2 sm:px-3 min-w-[80px] sm:min-w-[90px] text-center">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#1b1b20] text-sm">
              {filteredMovies.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-zinc-400 px-4">
                    <Film className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                    <p className="font-bold text-zinc-200 text-lg">
                      {movies.length === 0 ? 'No Movies in the Screening Room' : 'No movies match your filters'}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                      {movies.length === 0
                        ? 'Firestore is connected and ready. Seed data has been cleared. You can add movies using OMDb lookup or paste your seed movie data directly.'
                        : 'Try adjusting your search query or clear filters to see your movies.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                      {onLoadAdamSeedMovies && currentUserProfile?.isAdmin && (
                        <button
                          type="button"
                          id="empty-load-adam-btn"
                          onClick={onLoadAdamSeedMovies}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Database className="w-3.5 h-3.5" /> Load Adam's 44 Movies
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onOpenAddModal}
                        className="px-4 py-2 rounded-xl bg-[#1a1a1f] hover:bg-[#25252c] border border-[#2a2a30] text-zinc-200 text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Single Movie
                      </button>
                      {onOpenImportModal && currentUserProfile?.isAdmin && (
                        <button
                          type="button"
                          onClick={onOpenImportModal}
                          className="px-4 py-2 rounded-xl bg-[#1a1a1f] hover:bg-[#25252c] border border-[#2a2a30] text-zinc-200 text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-400" /> Custom Import
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMovies.map((movie, index) => {
                  const adderProfile = movie.addedBy ? members.find((m) => m.name === movie.addedBy || (movie.addedBy === 'Matt' && (m.name === 'Matt Tighe' || m.shortName === 'Matt'))) : null;

                  // Group stats for this movie
                  const ratedMembers = members.filter((p) => {
                    const r = movie.ratings?.[p.name] ?? 
                      ((p.name === 'Matt Tighe' || p.shortName === 'Matt') ? movie.ratings?.['Matt'] : undefined) ??
                      ((p.name === 'Matt') ? movie.ratings?.['Matt Tighe'] : undefined) ?? 0;
                    return r > 0;
                  });
                  const sumRatings = ratedMembers.reduce(
                    (acc, p) => {
                      const r = movie.ratings?.[p.name] ?? 
                        ((p.name === 'Matt Tighe' || p.shortName === 'Matt') ? movie.ratings?.['Matt'] : undefined) ??
                        ((p.name === 'Matt') ? movie.ratings?.['Matt Tighe'] : undefined) ?? 0;
                      return acc + r;
                    },
                    0
                  );
                  const groupAvg =
                    ratedMembers.length > 0
                      ? (sumRatings / ratedMembers.length).toFixed(1)
                      : null;
                  const isFullyWatched = ratedMembers.length === members.length;

                  return (
                    <tr
                      key={movie.id || movie.imdbID}
                      id={`movie-row-${movie.imdbID || index}`}
                      className="hover:bg-[#16161b] transition-colors group/row"
                    >
                      {/* Index # */}
                      <td className="sticky left-0 z-10 bg-[#111114] group-hover/row:bg-[#16161b] transition-colors py-2 sm:py-3 px-1 sm:px-3 text-center text-[11px] sm:text-xs font-medium text-zinc-500 w-8 sm:w-10">
                        {index + 1}
                      </td>

                      {/* Movie Column: Poster Only on Mobile, Full Info on Desktop */}
                      <td className="sticky left-[32px] sm:left-[40px] z-10 bg-[#111114] group-hover/row:bg-[#16161b] transition-colors py-2 sm:py-3 px-1 sm:px-4 shadow-[1px_0_0_0_#222225] w-[54px] sm:w-auto">
                        {/* Mobile View: Poster Thumbnail Button (Tap to expand movie popout) */}
                        <div className="sm:hidden flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onSelectMovieDetail(movie)}
                            className="relative group/poster rounded-lg overflow-hidden shadow-sm border border-[#26262a] active:scale-95 transition-transform focus:outline-none focus:ring-1 focus:ring-amber-500 shrink-0 cursor-pointer"
                            title={`Tap for details: ${movie.title} (${movie.year || ''})`}
                            aria-label={`View details for ${movie.title}`}
                          >
                            <img
                              src={
                                movie.poster && movie.poster !== 'N/A'
                                  ? movie.poster
                                  : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={movie.title}
                              className="w-10 h-14 object-cover bg-[#1a1a1f] block"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/poster:opacity-100 flex items-center justify-center transition-opacity">
                              <Info className="w-3.5 h-3.5 text-white drop-shadow" />
                            </div>
                          </button>
                        </div>

                        {/* Desktop View: Poster + Title + Year + Genres + IMDb + Runtime */}
                        <div className="hidden sm:flex items-start gap-3">
                          <img
                            src={
                              movie.poster && movie.poster !== 'N/A'
                                ? movie.poster
                                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={movie.title}
                            className="w-11 h-16 object-cover rounded-lg shadow-sm shrink-0 bg-[#1a1a1f] border border-[#26262a] cursor-pointer hover:opacity-90 transition"
                            onClick={() => onSelectMovieDetail(movie)}
                            referrerPolicy="no-referrer"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => onSelectMovieDetail(movie)}
                                className="font-bold text-zinc-100 hover:text-amber-400 text-left transition text-sm leading-snug line-clamp-1 cursor-pointer"
                              >
                                {movie.title}
                              </button>
                              {movie.year && (
                                <span className="text-xs text-zinc-400 font-medium">
                                  ({movie.year})
                                </span>
                              )}
                              {movie.isHotTake && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/40 text-[10px] font-bold shadow-xs cursor-pointer hover:border-orange-400 transition"
                                  title={`🔥 Curator Hot Take: "${movie.hotTakeText || ''}"`}
                                  onClick={() => onSelectMovieDetail(movie)}
                                >
                                  <Flame className="w-3 h-3 fill-orange-500 text-orange-400 animate-pulse" />
                                  <span>Hot Take</span>
                                </span>
                              )}
                            </div>

                            {/* Genre tags */}
                            {movie.genre && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {movie.genre
                                  .split(',')
                                  .slice(0, 3)
                                  .map((g) => (
                                    <span
                                      key={g.trim()}
                                      className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[#1c1c22] border border-[#282830] text-zinc-300"
                                    >
                                      {g.trim()}
                                    </span>
                                  ))}
                              </div>
                            )}

                            {/* IMDb Link & Info */}
                            <div className="flex items-center gap-2.5 mt-1.5 text-xs text-zinc-400">
                              {movie.imdbID && (
                                <a
                                  href={`https://www.imdb.com/title/${movie.imdbID}/`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-0.5 text-amber-400 hover:text-amber-300 hover:underline font-medium text-[11px]"
                                  title="Open IMDb page in new tab"
                                >
                                  <span>IMDb</span>
                                  {movie.imdbRating && (
                                    <span className="font-semibold text-zinc-300 ml-0.5">
                                      ★{movie.imdbRating}
                                    </span>
                                  )}
                                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                                </a>
                              )}
                              {movie.runtime && (
                                <span className="text-[11px] text-zinc-500">
                                  • {movie.runtime}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Member Star Rating Columns (Signed-in User is first!) */}
                      {orderedMembers.map((member) => {
                        const currentRating =
                          movie.ratings?.[member.name] ??
                          ((member.name === 'Matt Tighe' || member.shortName === 'Matt')
                            ? movie.ratings?.['Matt']
                            : undefined) ??
                          (member.name === 'Matt' ? movie.ratings?.['Matt Tighe'] : undefined) ??
                          0;
                        const isAllowedToRate =
                          currentUserProfile?.personName === member.name ||
                          ((currentUserProfile?.personName === 'Matt' ||
                            currentUserProfile?.personName === 'Matt Tighe') &&
                            (member.name === 'Matt' || member.name === 'Matt Tighe'));
                        return (
                          <td
                            key={member.id}
                            className={`py-2 px-1 text-center align-middle border-l border-[#1e1e23] ${
                              isAllowedToRate ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <StarRating
                              person={member.name}
                              rating={currentRating}
                              disabled={!isAllowedToRate}
                              onChange={(newRating) => onUpdateRating(movie.id, member.name, newRating)}
                            />
                          </td>
                        );
                      })}

                      {/* Added By Badge */}
                      <td className="py-3 px-3 text-center align-middle border-l border-[#1e1e23]">
                        {adderProfile ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenLeaderboard) {
                                  onOpenLeaderboard();
                                } else {
                                  setSelectedAdder(movie.addedBy);
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition cursor-pointer hover:brightness-125 ${adderProfile.badgeBg}`}
                              title={`Added by ${movie.addedBy}. Click to view Curator Leaderboard`}
                            >
                              {adderProfile.avatarUrl ? (
                                <img
                                  src={adderProfile.avatarUrl}
                                  alt={adderProfile.name}
                                  className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <span
                                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${adderProfile.avatarColor} shrink-0`}
                                >
                                  {adderProfile.initials}
                                </span>
                              )}
                              <span>{adderProfile.shortName}</span>
                              {(() => {
                                const adderStat =
                                  curatorStats[movie.addedBy] ||
                                  (movie.addedBy === 'Matt' ? curatorStats['Matt Tighe'] : undefined) ||
                                  (movie.addedBy === 'Matt Tighe' ? curatorStats['Matt'] : undefined);
                                if (adderStat && adderStat.curatorRating !== null) {
                                  return (
                                    <span className="text-[10px] text-amber-300 font-bold ml-0.5">
                                      ★{adderStat.curatorRatingFormatted}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Group Average & Watched Ratio */}
                      <td className="py-3 px-3 text-center align-middle border-l border-[#1e1e23]">
                        {groupAvg ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center gap-1 font-bold text-amber-400 text-sm">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{groupAvg}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 font-medium mt-0.5">
                              <span
                                className={
                                  isFullyWatched
                                    ? 'text-emerald-400 font-bold'
                                    : ''
                                }
                              >
                                {ratedMembers.length}/{members.length} watched
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-zinc-600 text-xs italic">Unwatched</div>
                        )}
                      </td>

                      {/* Actions: Info & Direct Delete */}
                      <td className="py-3 px-3 text-center align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedCommentMovie(movie)}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-amber-950/30 transition cursor-pointer relative"
                            title="View comments"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {movie.comments && movie.comments.length > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-amber-950">
                                {movie.comments.length}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectMovieDetail(movie)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#202026] transition cursor-pointer"
                            title="View movie details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          {onDeleteMovie && currentUserProfile?.isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete "${movie.title}" from Firestore?`)) {
                                  onDeleteMovie(movie.id);
                                }
                              }}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition cursor-pointer"
                              title={`Delete ${movie.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 border-t border-[#222225] bg-[#141417] flex flex-wrap items-center justify-between text-xs text-zinc-400">
          <div>
            Showing <span className="font-semibold text-zinc-200">{filteredMovies.length}</span> of{' '}
            <span className="font-semibold text-zinc-200">{movies.length}</span> total movies
          </div>
          <div className="flex items-center gap-3">
            <span>Click any star to mark watched & set rating</span>
            <span>•</span>
            <span>Click active rating to clear</span>
          </div>
        </div>
      </div>
      
      {selectedCommentMovie && (
        <CommentsModal
          movie={selectedCommentMovie}
          currentUserProfile={currentUserProfile || null}
          members={members}
          onClose={() => setSelectedCommentMovie(null)}
        />
      )}
    </div>
  );
}

