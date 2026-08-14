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
} from 'lucide-react';
import { MovieItem, MemberProfile, PersonName } from '../types';
import { StarRating } from './StarRating';
import { CommentsModal } from './CommentsModal';

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
          if (movie.addedBy !== selectedAdder) {
            return false;
          }
        }

        // Member stat bar filter
        if (selectedMemberFilter !== 'ALL') {
          const rating = movie.ratings?.[selectedMemberFilter];
          if (!rating || rating === 0) {
            return false;
          }
        }

        // Watch status filter
        if (watchStatusFilter === 'FULLY_WATCHED') {
          const count = members.filter((p) => (movie.ratings?.[p.name] ?? 0) > 0).length;
          if (count !== members.length) return false;
        } else if (watchStatusFilter === 'UNWATCHED_BY_ALL') {
          const count = members.filter((p) => (movie.ratings?.[p.name] ?? 0) > 0).length;
          if (count > 0) return false;
        } else if (watchStatusFilter.startsWith('WATCHED_BY_')) {
          const person = watchStatusFilter.replace('WATCHED_BY_', '') as PersonName;
          if (!(movie.ratings?.[person] && movie.ratings[person] > 0)) return false;
        } else if (watchStatusFilter.startsWith('UNWATCHED_BY_')) {
          const person = watchStatusFilter.replace('UNWATCHED_BY_', '') as PersonName;
          if (movie.ratings?.[person] && movie.ratings[person] > 0) return false;
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
            const ratings = members.map((p) => m.ratings?.[p.name] || 0).filter((r) => r > 0);
            return ratings.length > 0 ? ratings.reduce((acc, v) => acc + v, 0) / ratings.length : 0;
          };
          comp = getAvg(a) - getAvg(b);
        } else if (sortField === 'watchedCount') {
          const getCount = (m: MovieItem) =>
            members.filter((p) => (m.ratings?.[p.name] ?? 0) > 0).length;
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
              {members.map((member) => (
                <option key={member.id} value={member.name}>
                  Added by {member.name}
                </option>
              ))}
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
              <option value="FULLY_WATCHED">Watched by All Members</option>
              <option value="UNWATCHED_BY_ALL">Unwatched by Anyone</option>
              <optgroup label="Watched by Person">
                {members.map((p) => (
                  <option key={`watched-${p.name}`} value={`WATCHED_BY_${p.name}`}>
                    Watched by {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Unwatched by Person">
                {members.map((p) => (
                  <option key={`unwatched-${p.name}`} value={`UNWATCHED_BY_${p.name}`}>
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
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            {/* Table Header with Fixed Columns */}
            <thead>
              <tr className="border-b border-[#222225] bg-[#151518] text-xs font-bold text-zinc-400 select-none">
                {/* # Col */}
                <th className="py-3.5 px-3 w-10 text-center text-zinc-500">#</th>

                {/* Movie Details Column */}
                <th
                  onClick={() => handleSortToggle('title')}
                  className="py-3.5 px-4 min-w-[280px] cursor-pointer hover:text-amber-400 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Movie & Details</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                {/* Added By Column */}
                <th className="py-3.5 px-3 min-w-[110px] text-center">Added By</th>

                {/* 6 Person Columns side by side */}
                {members.map((member) => {
                  const profile = member;
                  return (
                    <th
                      key={member.id}
                      id={`col-header-${profile.shortName.toLowerCase()}`}
                      className="py-3.5 px-2 min-w-[115px] text-center border-l border-[#1e1e23]"
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold ${profile.avatarColor}`}
                          >
                            {profile.initials}
                          </span>
                          <span className="font-semibold text-zinc-200 truncate max-w-[90px]">
                            {profile.shortName}
                          </span>
                        </div>
                        <span className="text-[10px] font-normal text-zinc-500">
                          {profile.name === 'Tristan Brady' ? 'Tristan B.' : profile.name}
                        </span>
                      </div>
                    </th>
                  );
                })}

                {/* Group Stats Column */}
                <th
                  onClick={() => handleSortToggle('avgRating')}
                  className="py-3.5 px-3 min-w-[120px] text-center border-l border-[#1e1e23] cursor-pointer hover:text-amber-400 transition"
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <div className="flex items-center gap-1">
                      <span>Group Avg</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                    <span className="text-[10px] font-normal text-zinc-500">Watched count</span>
                  </div>
                </th>

                {/* Actions Column */}
                <th className="py-3.5 px-3 min-w-[90px] text-center">Actions</th>
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
                  const adderProfile = movie.addedBy ? members.find((m) => m.name === movie.addedBy) : null;

                  // Group stats for this movie
                  const ratedMembers = members.filter((p) => (movie.ratings?.[p.name] ?? 0) > 0);
                  const sumRatings = ratedMembers.reduce(
                    (acc, p) => acc + (movie.ratings[p.name] || 0),
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
                      <td className="py-3 px-3 text-center text-xs font-medium text-zinc-500">
                        {index + 1}
                      </td>

                      {/* Movie Info & Poster */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
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
                            <div className="flex items-center gap-2">
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

                      {/* Added By Badge */}
                      <td className="py-3 px-3 text-center align-middle">
                        {adderProfile ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${adderProfile.badgeBg}`}
                            title={`Added by ${movie.addedBy}`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${adderProfile.avatarColor}`}
                            >
                              {adderProfile.initials}
                            </span>
                            <span>{adderProfile.shortName}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Member Star Rating Columns */}
                      {members.map((member) => {
                        const currentRating = movie.ratings?.[member.name] || 0;
                        const isAllowedToRate = currentUserProfile?.personName === member.name;
                        return (
                          <td
                            key={member.id}
                            className="py-2 px-1 text-center align-middle border-l border-[#1e1e23]"
                          >
                            <StarRating person={member.name} rating={currentRating} disabled={!isAllowedToRate} onChange={(newRating) => onUpdateRating(movie.id, member.name, newRating)}
                            />
                          </td>
                        );
                      })}

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

