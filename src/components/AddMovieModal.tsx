import { useState, useEffect, useId, FormEvent } from 'react';
import {
  Search,
  X,
  Film,
  Calendar,
  Clock,
  ExternalLink,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  User,
} from 'lucide-react';
import {
  MemberProfile,
  PersonName,
  OMDBMovieSearchResult,
  OMDBMovieDetail,
  MovieItem,
} from '../types';
import { searchMoviesOMDB, getMovieDetailsOMDB } from '../services/omdb';

interface AddMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMovie: (movie: Omit<MovieItem, 'id'>) => Promise<void>;
  existingImdbIds?: Set<string>;
  members: MemberProfile[];
}

export function AddMovieModal({
  isOpen,
  onClose,
  onAddMovie,
  existingImdbIds = new Set(),
  members,
}: AddMovieModalProps) {
  const searchInputId = useId();
  const yearInputId = useId();
  const addedBySelectId = useId();

  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OMDBMovieSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedMovie, setSelectedMovie] = useState<OMDBMovieDetail | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [addedBy, setAddedBy] = useState<PersonName>('Adam');
  const [initialRating, setInitialRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced auto-search when query changes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setYearFilter('');
      setSearchResults([]);
      setSearchError(null);
      setSelectedMovie(null);
      setInitialRating(0);
      return;
    }
  }, [isOpen]);

  const handleSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSelectedMovie(null);

    const { movies, error } = await searchMoviesOMDB(query, yearFilter);
    setIsSearching(false);

    if (error) {
      setSearchError(error);
      setSearchResults([]);
    } else {
      setSearchResults(movies);
    }
  };

  const handleSelectSearchResult = async (result: OMDBMovieSearchResult) => {
    setIsLoadingDetails(true);
    setSearchError(null);

    const details = await getMovieDetailsOMDB(result.imdbID);
    setIsLoadingDetails(false);

    if (details) {
      setSelectedMovie(details);
    } else {
      setSearchError('Could not fetch full details for this movie. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedMovie) return;

    setIsSubmitting(true);
    try {
      const newMovie: Omit<MovieItem, 'id'> = {
        title: selectedMovie.Title,
        year: selectedMovie.Year,
        releaseDate: selectedMovie.Released || '',
        genre: selectedMovie.Genre || 'Uncategorized',
        poster:
          selectedMovie.Poster && selectedMovie.Poster !== 'N/A'
            ? selectedMovie.Poster
            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80',
        imdbID: selectedMovie.imdbID,
        imdbRating: selectedMovie.imdbRating && selectedMovie.imdbRating !== 'N/A' ? selectedMovie.imdbRating : undefined,
        director: selectedMovie.Director && selectedMovie.Director !== 'N/A' ? selectedMovie.Director : undefined,
        actors: selectedMovie.Actors && selectedMovie.Actors !== 'N/A' ? selectedMovie.Actors : undefined,
        plot: selectedMovie.Plot && selectedMovie.Plot !== 'N/A' ? selectedMovie.Plot : undefined,
        rated: selectedMovie.Rated && selectedMovie.Rated !== 'N/A' ? selectedMovie.Rated : undefined,
        runtime: selectedMovie.Runtime && selectedMovie.Runtime !== 'N/A' ? selectedMovie.Runtime : undefined,
        addedBy: addedBy,
        addedAt: Date.now(),
        ratings: initialRating > 0 ? { [addedBy]: initialRating } : {},
      };

      await onAddMovie(newMovie);
      onClose();
    } catch (err) {
      console.error('Failed to add movie:', err);
      setSearchError('Failed to save movie to Firestore. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="add-movie-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-movie-modal-card"
        className="bg-[#111114] border border-[#26262a] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222225] bg-[#151518]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Add Movie to Screening Room</h2>
              <p className="text-xs text-zinc-400">
                Verify title and year against OMDb to prevent wrong editions
              </p>
            </div>
          </div>
          <button
            id="close-add-modal-btn"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#202026] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <label htmlFor={searchInputId} className="sr-only">
                  Movie Title
                </label>
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id={searchInputId}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search movie title (e.g., Dune, Inception, Blade Runner)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#26262a] bg-[#161619] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
                  autoFocus
                />
              </div>

              <div className="w-28 relative">
                <label htmlFor={yearInputId} className="sr-only">
                  Year (optional)
                </label>
                <input
                  id={yearInputId}
                  type="text"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  placeholder="Year (opt)"
                  maxLength={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#26262a] bg-[#161619] text-sm text-center text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>

              <button
                type="submit"
                id="omdb-search-btn"
                disabled={isSearching || !query.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md shadow-amber-500/10 cursor-pointer"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 stroke-[2.5]" />
                    <span>Lookup</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Search Error Notice */}
          {searchError && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Search Results Picker (if not selected) */}
          {!selectedMovie && searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Select matching movie version ({searchResults.length} found)
              </p>
              <div className="max-h-60 overflow-y-auto border border-[#26262a] rounded-xl divide-y divide-[#1e1e23] bg-[#141417]">
                {searchResults.map((result) => {
                  const alreadyAdded = existingImdbIds.has(result.imdbID);
                  return (
                    <div
                      key={result.imdbID}
                      onClick={() => !alreadyAdded && handleSelectSearchResult(result)}
                      className={`flex items-center justify-between p-3 transition-colors ${
                        alreadyAdded
                          ? 'bg-[#18181c] opacity-50 cursor-not-allowed'
                          : 'hover:bg-[#1c1c22] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            result.Poster && result.Poster !== 'N/A'
                              ? result.Poster
                              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={result.Title}
                          className="w-10 h-14 object-cover rounded-md bg-[#1e1e24] border border-[#2a2a30] shrink-0 shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                            <span>{result.Title}</span>
                            {alreadyAdded && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#26262d] text-zinc-400 font-normal">
                                Already on Dashboard
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Calendar className="w-3 h-3 text-zinc-500" /> {result.Year}
                            </span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1e1e24] text-zinc-400 border border-[#2a2a30]">
                              {result.imdbID}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={alreadyAdded || isLoadingDetails}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                          alreadyAdded
                            ? 'text-zinc-500'
                            : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-xs'
                        }`}
                      >
                        {alreadyAdded ? 'Added' : 'Verify'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading details state */}
          {isLoadingDetails && (
            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <p className="text-xs">Fetching verified details from OMDb...</p>
            </div>
          )}

          {/* Selected Movie Preview & Verification Card */}
          {selectedMovie && (
            <div
              id="verified-movie-preview"
              className="border border-amber-500/40 bg-amber-500/5 rounded-2xl p-4.5 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Verified Match from OMDb</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMovie(null)}
                  className="text-xs text-zinc-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Choose a different version
                </button>
              </div>

              <div className="flex gap-4">
                <img
                  src={
                    selectedMovie.Poster && selectedMovie.Poster !== 'N/A'
                      ? selectedMovie.Poster
                      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80'
                  }
                  alt={selectedMovie.Title}
                  className="w-24 h-36 object-cover rounded-xl shadow-md shrink-0 bg-[#1e1e24] border border-[#2a2a30]"
                  referrerPolicy="no-referrer"
                />

                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">
                      {selectedMovie.Title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-200">
                        {selectedMovie.Year}
                      </span>
                      {selectedMovie.Runtime && selectedMovie.Runtime !== 'N/A' && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {selectedMovie.Runtime}
                          </span>
                        </>
                      )}
                      {selectedMovie.imdbRating && selectedMovie.imdbRating !== 'N/A' && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                            IMDb {selectedMovie.imdbRating}
                          </span>
                        </>
                      )}
                      <a
                        href={`https://www.imdb.com/title/${selectedMovie.imdbID}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-amber-400 hover:underline font-medium ml-1"
                      >
                        IMDb Page
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {selectedMovie.Genre && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMovie.Genre.split(',').map((g) => (
                        <span
                          key={g.trim()}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#1e1e24] border border-[#282830] text-zinc-300"
                        >
                          {g.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedMovie.Director && selectedMovie.Director !== 'N/A' && (
                    <p className="text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-300">Director:</span>{' '}
                      {selectedMovie.Director}
                    </p>
                  )}

                  {selectedMovie.Plot && selectedMovie.Plot !== 'N/A' && (
                    <p className="text-xs text-zinc-400 line-clamp-2 italic">
                      "{selectedMovie.Plot}"
                    </p>
                  )}
                </div>
              </div>

              {/* Attribution and Adder Rating */}
              <div className="pt-3.5 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={addedBySelectId}
                    className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Added by (Fixed Roster of 6):</span>
                  </label>
                  <select
                    id={addedBySelectId}
                    value={addedBy}
                    onChange={(e) => setAddedBy(e.target.value as PersonName)}
                    className="w-full px-3 py-2 rounded-xl border border-[#26262a] bg-[#161619] text-sm text-zinc-200 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    {addedBy}'s Star Rating (Optional initial watch):
                  </label>
                  <div className="flex items-center gap-2 h-9">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setInitialRating(initialRating === star ? 0 : star)}
                        className="p-1 rounded hover:scale-125 transition cursor-pointer"
                      >
                        <span
                          className={`text-xl ${
                            initialRating >= star
                              ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]'
                              : 'text-[#3f3f46]'
                          }`}
                        >
                          ★
                        </span>
                      </button>
                    ))}
                    {initialRating > 0 ? (
                      <span className="text-xs font-semibold text-amber-400">
                        {initialRating} / 5
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500">Unwatched</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#222225] bg-[#151518]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-[#202026] rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-add-movie-btn"
            disabled={!selectedMovie || isSubmitting}
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/10 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Add Movie to Dashboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
