import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Film,
  Plus,
  Upload,
  Database,
  AlertTriangle,
  Info,
  CheckCircle2,
  LogOut,
  Users,
  User as UserIcon
} from 'lucide-react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthScreen } from './components/AuthScreen';
import { MovieItem, PersonName, MemberProfile } from './types';
import {
  subscribeToMovies,
  subscribeToMembers,
  setMovieRatingInFirestore,
  deleteMovieFromFirestore,
  deleteAllMoviesFromFirestore,
  batchAddMoviesToFirestore,
  addMovieToFirestore,
  addMemberToFirestore,
  seedStarterMoviesIfEmpty,
  seedDefaultMembersIfEmpty,
  forceSeedStarterMovies,
  testFirestoreConnection,
  fixMissingPostersOMDB,
} from './lib/firebase';
import { StatsBar } from './components/StatsBar';
import { MovieSpreadsheet } from './components/MovieSpreadsheet';
import { AddMovieModal } from './components/AddMovieModal';
import { MovieDetailModal } from './components/MovieDetailModal';
import { ImportSeedModal } from './components/ImportSeedModal';
import { ManageMembersModal } from './components/ManageMembersModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ isAdmin: boolean; personName: PersonName | null } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [selectedMovieForDetail, setSelectedMovieForDetail] = useState<MovieItem | null>(null);

  // Notification / Toast state
  const [toastMessage, setToastMessage] = useState<{ id: string; text: string; type: 'success' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' = 'success') => {
    const id = String(Date.now());
    setToastMessage({ id, text, type });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.id === id ? null : curr));
    }, 3500);
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch or create profile
        try {
          const profileRef = doc(db, 'users', u.uid);
          const profileSnap = await getDoc(profileRef);
          
          let isAdmin = u.email === 'akleyweg@gmail.com';
          let personName: PersonName | null = null;
          
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            personName = data.personName || null;
            if (data.isAdmin !== undefined) isAdmin = data.isAdmin || u.email === 'akleyweg@gmail.com';
          } else {
            // Setup new user
            await setDoc(profileRef, {
              email: u.email,
              isAdmin,
              personName: null,
              createdAt: Date.now()
            });
          }
          
          setUserProfile({ isAdmin, personName });
        } catch (err) {
          console.error("Failed to load profile:", err);
        }
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Initialize and subscribe to Firestore movies collection
  useEffect(() => {
    if (!user) return; // Only subscribe when authenticated

    let unsubscribeMovies: () => void = () => {};
    let unsubscribeMembers: () => void = () => {};

    const init = async () => {
      try {
        setSyncStatus('connecting');
        await testFirestoreConnection();
        
        await seedDefaultMembersIfEmpty();
        
        // Automatically seed Adam's 44 movies if collection is empty (only if admin)
        if (userProfile?.isAdmin) {
          await seedStarterMoviesIfEmpty();
        }

        unsubscribeMembers = subscribeToMembers(
          (liveMembers) => setMembers(liveMembers),
          (err) => console.error('Members subscription error:', err)
        );

        unsubscribeMovies = subscribeToMovies(
          (liveMovies) => {
            setMovies(liveMovies);
            setIsLoading(false);
            setSyncStatus('connected');
            setErrorMessage(null);
          },
          (err) => {
            console.error('Firestore subscription error:', err);
            setSyncStatus('error');
            setErrorMessage('Unable to connect to live Firestore. Check network or permissions.');
            setIsLoading(false);
          }
        );
      } catch (err) {
        console.error('Initialization error:', err);
        setSyncStatus('error');
        setErrorMessage('Failed to initialize database connection.');
        setIsLoading(false);
      }
    };

    init();

    return () => {
      unsubscribeMovies();
      unsubscribeMembers();
    };
  }, [user, userProfile?.isAdmin]);

  // Handle adding a single movie
  const handleAddMovie = async (movieData: Omit<MovieItem, 'id'>) => {
    try {
      await addMovieToFirestore(movieData);
      showToast(`Added "${movieData.title}" (${movieData.year}) to dashboard!`, 'success');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding movie to Firestore:', err);
      showToast('Failed to add movie to Firestore', 'info');
      throw err;
    }
  };

  // Handle batch importing seed movies
  const handleBatchImport = async (moviesList: Omit<MovieItem, 'id'>[]) => {
    try {
      const count = await batchAddMoviesToFirestore(moviesList);
      showToast(`Successfully saved ${count} seed movies to Firestore!`, 'success');
    } catch (err) {
      console.error('Batch import error:', err);
      showToast('Error importing movies to Firestore', 'info');
      throw err;
    }
  };

  // Handle inline rating change
  const handleUpdateRating = async (movieId: string, person: PersonName, rating: number) => {
    try {
      // Optimistic local state update
      setMovies((prev) =>
        prev.map((m) => {
          if (m.id !== movieId) return m;
          const nextRatings = { ...m.ratings };
          if (rating > 0) {
            nextRatings[person] = rating;
          } else {
            delete nextRatings[person];
          }
          return { ...m, ratings: nextRatings };
        })
      );

      // If detail modal is open for this movie, update it too
      if (selectedMovieForDetail && selectedMovieForDetail.id === movieId) {
        setSelectedMovieForDetail((prev) => {
          if (!prev) return null;
          const nextRatings = { ...prev.ratings };
          if (rating > 0) {
            nextRatings[person] = rating;
          } else {
            delete nextRatings[person];
          }
          return { ...prev, ratings: nextRatings };
        });
      }

      await setMovieRatingInFirestore(movieId, person, rating);
      if (rating > 0) {
        showToast(`${person} rated this ${rating} ★`);
      } else {
        showToast(`Cleared rating for ${person}`, 'info');
      }
    } catch (err) {
      console.error('Failed to update rating:', err);
      showToast('Error updating rating. Check connection.', 'info');
    }
  };

  // Handle movie delete
  const handleDeleteMovie = async (movieId: string) => {
    try {
      const targetMovie = movies.find((m) => m.id === movieId);
      await deleteMovieFromFirestore(movieId);
      showToast(`Removed "${targetMovie?.title || 'Movie'}" from dashboard`, 'info');
      if (selectedMovieForDetail?.id === movieId) {
        setSelectedMovieForDetail(null);
      }
    } catch (err) {
      console.error('Failed to delete movie:', err);
      showToast('Failed to delete movie', 'info');
    }
  };

  // Handle adding member
  const handleAddMember = async (memberData: Omit<MemberProfile, 'id' | 'addedAt'>) => {
    try {
      await addMemberToFirestore(memberData);
      showToast(`Added member ${memberData.name}!`, 'success');
    } catch (err) {
      console.error('Failed to add member:', err);
      showToast('Failed to add member', 'info');
      throw err;
    }
  };

  // Force re-seed / populate Adam's 44 seed movies
  const handleLoadAdamSeedMovies = async () => {
    try {
      setIsLoading(true);
      const count = await forceSeedStarterMovies();
      showToast(`Loaded ${count} movies entered by Adam into Firestore!`, 'success');
    } catch (err) {
      console.error('Seed error:', err);
      showToast('Error populating seed movies', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch missing posters from OMDb
  const handleFixPosters = async () => {
    try {
      setIsLoading(true);
      showToast('Scanning movies and updating missing posters from OMDb...', 'info');
      const count = await fixMissingPostersOMDB();
      showToast(`Successfully updated ${count} movies with new OMDb data/posters!`, 'success');
    } catch (err) {
      console.error('Fix posters error:', err);
      showToast('Error fixing posters', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete all movies
  const handleDeleteAllMovies = async () => {
    try {
      setIsLoading(true);
      const count = await deleteAllMoviesFromFirestore();
      showToast(`Deleted ${count} movies from Firestore.`, 'info');
    } catch (err) {
      console.error('Failed to clear movies:', err);
      showToast('Failed to delete all movies', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate quick totals
  const totalRatingsCount = useMemo(() => {
    return movies.reduce((acc, m) => {
      const ratingsObj = m.ratings || {};
      const count = Object.values(ratingsObj).filter((r) => typeof r === 'number' && r > 0).length;
      return acc + count;
    }, 0);
  }, [movies]);

  // Set of existing IMDb IDs to prevent duplicates in search picker
  const existingImdbIds = useMemo(() => {
    return new Set(movies.map((m) => m.imdbID).filter(Boolean));
  }, [movies]);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSetProfile = async (name: PersonName) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { personName: name }, { merge: true });
      setUserProfile((prev) => prev ? { ...prev, personName: name } : null);
    } catch (err) {
      console.error(err);
      showToast('Failed to set profile', 'info');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!userProfile?.personName) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#161619] border border-[#26262a] rounded-2xl p-6 shadow-2xl text-center">
          <h2 className="text-xl font-bold text-white mb-2">Who are you?</h2>
          <p className="text-zinc-400 text-sm mb-6">Please select your identity from the group to continue.</p>
          <div className="grid grid-cols-2 gap-3">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSetProfile(m.name)}
                className="px-4 py-3 rounded-xl bg-[#202026] hover:bg-[#2a2a32] border border-[#2e2e36] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {m.name}
              </button>
            ))}
          </div>
          <button 
            onClick={handleSignOut}
            className="mt-8 text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="screening-room-app"
      className="min-h-screen bg-[#0c0c0e] text-[#e0e0e0] flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#18181c] border border-[#2e2e36] text-white shadow-2xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Top Header Bar */}
      <header
        id="app-header"
        className="sticky top-0 z-30 bg-[#111114]/95 backdrop-blur-md border-b border-[#222225] px-4 sm:px-6 lg:px-8 py-3.5"
      >
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-xs">
              <Film className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>The Screening Room</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25">
                  {members.length}-Member Group
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                <span>{members.map(m => m.shortName).join(' • ')}</span>
              </p>
            </div>
          </div>

          {/* Header Controls & Status */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Live Firestore status indicator */}
            <div
              id="firestore-status-badge"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161619] border border-[#26262a] text-xs"
              title="Firestore real-time sync status"
            >
              <div className="relative flex items-center justify-center">
                <span
                  className={`w-2 h-2 rounded-full ${
                    syncStatus === 'connected'
                      ? 'bg-emerald-400'
                      : syncStatus === 'connecting'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                {syncStatus === 'connected' && (
                  <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                )}
              </div>
              <span className="text-zinc-400 font-mono text-[11px] hidden xs:inline">
                {syncStatus === 'connected'
                  ? 'Firestore Live'
                  : syncStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Sync Error'}
              </span>
              <span className="text-zinc-600 dark:text-zinc-500">•</span>
              <span className="text-zinc-300 text-[11px] font-semibold">
                {movies.length} {movies.length === 1 ? 'film' : 'films'} ({totalRatingsCount} ratings)
              </span>
            </div>

            {/* Manage Members Button */}
            {userProfile?.isAdmin && (
              <button
                type="button"
                onClick={() => setIsManageMembersModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-[#16161a] hover:bg-[#202026] border border-[#26262a] rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Add group members"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Members</span>
              </button>
            )}

            {/* Load Adam's Seed Movies Button */}
            {userProfile?.isAdmin && movies.length < 44 && (
              <button
                type="button"
                id="header-load-adam-starters-btn"
                onClick={handleLoadAdamSeedMovies}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-[#16161a] hover:bg-[#202026] border border-[#26262a] rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Populate the 44 movies entered by Adam Kleyweg"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Load Adam's 44</span>
              </button>
            )}

            {/* Fix Missing Posters Button */}
            {userProfile?.isAdmin && movies.length > 0 && (
              <button
                type="button"
                id="header-fix-posters-btn"
                onClick={handleFixPosters}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-[#16161a] hover:bg-[#202026] border border-[#26262a] rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Fetch missing posters and metadata from OMDb"
              >
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Sync OMDb Data</span>
              </button>
            )}

            {/* Import Seed Data Button */}
            {userProfile?.isAdmin && (
              <button
                type="button"
                id="header-import-seed-btn"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-[#16161a] hover:bg-[#202026] border border-[#26262a] rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Import or paste your seed movies"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Import Seed</span>
              </button>
            )}

            {/* Primary Action: Add Movie Button */}
            <button
              type="button"
              id="open-add-movie-modal-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs sm:text-sm font-bold tracking-tight shadow-lg shadow-amber-500/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Movie</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error Alert if Firestore failed */}
        {errorMessage && (
          <div
            id="firestore-error-banner"
            className="flex items-center justify-between p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-rose-900/60 hover:bg-rose-900 border border-rose-700/80 text-white rounded-lg transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Aggregate Stats Dashboard */}
        <StatsBar movies={movies} members={members} />

        {/* Giant Spreadsheet View with full member rating columns */}
        <MovieSpreadsheet
          movies={movies}
          members={members}
          currentUserProfile={userProfile}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onLoadAdamSeedMovies={handleLoadAdamSeedMovies}
          onSelectMovieDetail={(movie) => setSelectedMovieForDetail(movie)}
          onUpdateRating={handleUpdateRating}
          onDeleteMovie={handleDeleteMovie}
          onDeleteAllMovies={handleDeleteAllMovies}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1e] bg-[#0c0c0e] py-5 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">The Screening Room</span>
            <span>•</span>
            <span>Firestore Synchronized</span>
            <span>•</span>
            <span>OMDb API Verified</span>
            <span>•</span>
            <span className="text-zinc-300 ml-2 border-l border-zinc-700 pl-4">
              Logged in as <strong className="text-amber-400">{userProfile?.personName}</strong> {userProfile?.isAdmin && '(Admin)'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
            <span>{members.length}-Member Roster: {members.map(m => m.shortName).join(', ')}</span>
          </div>
        </div>
      </footer>

      {/* Add Movie Modal with OMDb Lookup */}
      <AddMovieModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddMovie={handleAddMovie}
        existingImdbIds={existingImdbIds}
        members={members}
      />

      {/* Movie Details Modal */}
      <MovieDetailModal
        movie={selectedMovieForDetail}
        members={members}
        currentUserProfile={userProfile}
        onClose={() => setSelectedMovieForDetail(null)}
        onDelete={handleDeleteMovie}
        onUpdateRating={handleUpdateRating}
      />

      {/* Import Seed Data Modal */}
      <ImportSeedModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBatchImport}
      />

      {/* Manage Members Modal */}
      <ManageMembersModal
        isOpen={isManageMembersModalOpen}
        onClose={() => setIsManageMembersModalOpen(false)}
        members={members}
        onAddMember={handleAddMember}
      />
    </div>
  );
}

