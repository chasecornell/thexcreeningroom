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
  User as UserIcon,
  Trophy,
  BarChart3,
  MessageSquare,
  Layers,
  Sparkles,
  HelpCircle,
  Mail,
} from 'lucide-react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthScreen } from './components/AuthScreen';
import { MovieItem, PersonName, MemberProfile, ChatMessage, HotTake } from './types';
import {
  subscribeToMovies,
  subscribeToMembers,
  subscribeToGeneralChat,
  subscribeToHotTakes,
  seedStarterHotTakesIfEmpty,
  seedInitialGeneralChatIfEmpty,
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
  auditAndRepairMovieMetadata,
} from './lib/firebase';
import { StatsBar } from './components/StatsBar';
import { StatsSection } from './components/StatsSection';
import { MembersSection } from './components/MembersSection';
import { GeneralChat } from './components/GeneralChat';
import { MovieSpreadsheet } from './components/MovieSpreadsheet';
import { AddMovieModal } from './components/AddMovieModal';
import { MovieDetailModal } from './components/MovieDetailModal';
import { HotTakeBanner } from './components/HotTakeBanner';
import { ImportSeedModal } from './components/ImportSeedModal';
import { ManageMembersModal } from './components/ManageMembersModal';
import { EditProfileModal } from './components/EditProfileModal';
import { RatingSystemModal } from './components/RatingSystemModal';
import { AboutAppModal } from './components/AboutAppModal';
import { CuratorLeaderboardModal } from './components/CuratorLeaderboardModal';
import { EmailAlertsModal } from './components/EmailAlertsModal';
import { ThemeToggle } from './components/ThemeToggle';
import { getInitialTheme, applyTheme, ThemeMode } from './lib/theme';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ isAdmin: boolean; personName: PersonName | null } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hotTakes, setHotTakes] = useState<HotTake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isRatingSystemModalOpen, setIsRatingSystemModalOpen] = useState(false);
  const [isAboutAppModalOpen, setIsAboutAppModalOpen] = useState(false);
  const [isCuratorLeaderboardOpen, setIsCuratorLeaderboardOpen] = useState(false);
  const [isEmailAlertsModalOpen, setIsEmailAlertsModalOpen] = useState(false);
  const [selectedMovieForDetail, setSelectedMovieForDetail] = useState<MovieItem | null>(null);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<PersonName | 'ALL'>('ALL');
  const [activeSection, setActiveSection] = useState<'movies' | 'stats' | 'members' | 'chat' | 'all'>('movies');
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  // Check URL parameters for email opt-outs or direct preferences link
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'email_settings') {
        setIsEmailAlertsModalOpen(true);
      } else if (params.get('opt_out') === 'daily') {
        setIsEmailAlertsModalOpen(true);
        showToast('Opened Email Settings: Daily 6am alert preference', 'info');
      } else if (params.get('opt_out') === 'weekly') {
        setIsEmailAlertsModalOpen(true);
        showToast('Opened Email Settings: Weekly Roast preference', 'info');
      }
    } catch {
      // safe fallback
    }
  }, []);

  // Sync theme with document element
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

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
          const isSeniorIglesiaEmail = u.email?.toLowerCase() === 'mchurches@gmail.com';
          const isAdamEmail = u.email?.toLowerCase() === 'akleyweg@gmail.com';
          const isMattTigheEmail = u.email?.toLowerCase().includes('tighe');
          
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            personName = data.personName || null;
            if (data.isAdmin !== undefined) isAdmin = data.isAdmin || isAdamEmail;

            // Senior Iglesia curator identity for Matt Churches
            if (isSeniorIglesiaEmail) {
              personName = 'Senior Iglesia';
              if (data.personName !== 'Senior Iglesia') {
                await setDoc(profileRef, {
                  email: u.email,
                  isAdmin: false,
                  personName: 'Senior Iglesia',
                  createdAt: data.createdAt || 1787159252786,
                }, { merge: true });
              }
            } else if (isAdamEmail && (!data.personName || data.personName !== 'Adam')) {
              personName = 'Adam';
              await setDoc(profileRef, {
                email: u.email,
                isAdmin: true,
                personName: 'Adam',
                createdAt: data.createdAt || Date.now(),
              }, { merge: true });
            } else if (isMattTigheEmail && !data.personName) {
              personName = 'Matt Tighe';
              await setDoc(profileRef, {
                email: u.email,
                isAdmin: false,
                personName: 'Matt Tighe',
                createdAt: data.createdAt || Date.now(),
              }, { merge: true });
            }
          } else {
            // Setup new user
            if (isSeniorIglesiaEmail) {
              personName = 'Senior Iglesia';
            } else if (isAdamEmail) {
              personName = 'Adam';
            } else if (isMattTigheEmail) {
              personName = 'Matt Tighe';
            }
            await setDoc(profileRef, {
              email: u.email,
              isAdmin,
              personName,
              createdAt: Date.now(),
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
    let unsubscribeChat: () => void = () => {};
    let unsubscribeHotTakes: () => void = () => {};

    const init = async () => {
      try {
        setSyncStatus('connecting');
        await testFirestoreConnection();
        
        await seedDefaultMembersIfEmpty();
        await seedStarterHotTakesIfEmpty();

        // Background check to fix any corrupted or mismatched movie IDs / posters
        auditAndRepairMovieMetadata().catch((err) =>
          console.warn('Background movie metadata audit non-fatal error:', err)
        );

        unsubscribeMembers = subscribeToMembers(
          (liveMembers) => setMembers(liveMembers),
          (err) => console.error('Members subscription error:', err)
        );

        unsubscribeChat = subscribeToGeneralChat(
          (liveChat) => setChatMessages(liveChat),
          (err) => console.error('General chat subscription error:', err)
        );

        unsubscribeHotTakes = subscribeToHotTakes(
          (liveTakes) => setHotTakes(liveTakes),
          (err) => console.error('Hot takes subscription error:', err)
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
      unsubscribeChat();
      unsubscribeHotTakes();
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
    return <AuthScreen theme={theme} onToggleTheme={handleToggleTheme} />;
  }

  if (!userProfile?.personName) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} showLabel />
        </div>
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

      {/* Main Top Header Bar - Clean 3-Zone Contract */}
      <header
        id="app-header"
        className="sticky top-0 z-30 bg-[#111114]/95 backdrop-blur-md border-b border-[#222225] px-4 sm:px-6 lg:px-8 py-3"
      >
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Zone 1: Brand Identity / Homepage Link */}
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <div className="flex items-center gap-2.5">
              {/* Standalone Film Icon Home Button */}
              <button
                type="button"
                id="brand-film-icon-btn"
                onClick={() => {
                  setActiveSection('movies');
                  setSelectedMemberFilter('ALL');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-10 h-10 rounded-xl bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/60 flex items-center justify-center text-amber-400 hover:text-amber-300 shadow-xs shrink-0 transition cursor-pointer active:scale-95 group focus:outline-hidden"
                title="Return to Movies (Homepage)"
                aria-label="Return to Movies (Homepage)"
              >
                <Film className="w-5 h-5 stroke-[2.2] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200" />
              </button>

              {/* Title Home Link */}
              <button
                type="button"
                id="brand-title-home-link"
                onClick={() => {
                  setActiveSection('movies');
                  setSelectedMemberFilter('ALL');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-left group cursor-pointer focus:outline-hidden transition"
                title="Return to Movies (Homepage)"
                aria-label="The Screening Room - Return to Homepage"
              >
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-amber-300 transition">
                    The Screening Room
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 hidden xs:inline group-hover:border-amber-500/40">
                    {movies.length} Movies
                  </span>
                </div>
              </button>
            </div>

            {/* Mobile-only Quick Add Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition shadow-xs cursor-pointer"
              title="Add Movie"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Zone 2: Navigation Section Switcher Tabs */}
          <nav
            aria-label="Dashboard Sections"
            className="flex items-center p-1 bg-[#16161a] border border-[#26262a] rounded-xl overflow-x-auto max-w-full no-scrollbar shadow-inner"
          >
            {/* 1. Chat Lounge */}
            <button
              type="button"
              id="nav-chat-lounge-btn"
              onClick={() => setActiveSection('chat')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'chat'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-[#202026]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Lounge</span>
              {chatMessages.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeSection === 'chat' ? 'bg-amber-600 text-amber-100' : 'bg-[#222228] text-zinc-400'
                }`}>
                  {chatMessages.length}
                </span>
              )}
            </button>

            {/* 2. Stats */}
            <button
              type="button"
              id="nav-stats-btn"
              onClick={() => setActiveSection('stats')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                activeSection === 'stats'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-[#202026]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Stats</span>
            </button>

            {/* 3. About */}
            <button
              type="button"
              id="nav-about-btn"
              onClick={() => setIsAboutAppModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-white hover:bg-[#202026]"
              title="About The App"
            >
              <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>About</span>
            </button>
          </nav>

          {/* Zone 3: Actions, Tools & Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            {/* Live Sync Status Pill */}
            <div
              id="firestore-status-badge"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#161619] border border-[#26262a] text-xs shrink-0"
              title="Firestore real-time sync status"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncStatus === 'connected'
                    ? 'bg-emerald-400'
                    : syncStatus === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
                {syncStatus === 'connected' ? 'Live' : 'Syncing'}
              </span>
            </div>

            {/* Dark / Light Mode Switcher */}
            <ThemeToggle theme={theme} onToggle={handleToggleTheme} />

            {/* Email Alerts & Weekly Roast Button */}
            <button
              type="button"
              id="open-email-alerts-btn"
              onClick={() => setIsEmailAlertsModalOpen(true)}
              className="px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-amber-400 bg-[#16161a] hover:bg-[#202026] border border-[#26262a] hover:border-amber-500/40 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Email Alerts & Weekly Sarcastic Roast"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Alerts & Roast</span>
            </button>

            {/* Profile Avatar / Edit Profile */}
            <button
              type="button"
              onClick={() => setIsEditProfileModalOpen(true)}
              className="px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-[#16161a] hover:bg-[#202026] border border-[#26262a] rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Edit Profile"
            >
              {members.find(m => m.name === userProfile?.personName)?.avatarUrl ? (
                <img 
                  src={members.find(m => m.name === userProfile?.personName)!.avatarUrl} 
                  alt="Profile" 
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden sm:inline">{userProfile?.personName || 'Profile'}</span>
            </button>

            {/* Club Tools Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isToolsMenuOpen
                    ? 'bg-[#25252e] text-white border-zinc-600'
                    : 'bg-[#16161a] hover:bg-[#202026] text-zinc-300 hover:text-white border-[#26262a]'
                }`}
                title="Club Tools & Guides"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Tools</span>
              </button>

              {/* Tools Dropdown Popover */}
              {isToolsMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsToolsMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-[#16161b] border border-[#2a2a32] rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCuratorLeaderboardOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-amber-300 hover:bg-[#202028] transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Curator Leaderboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsEmailAlertsModalOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-amber-300 hover:bg-[#202028] transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-amber-400" />
                      <span>Email Alerts & Roast</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsRatingSystemModalOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-blue-300 hover:bg-[#202028] transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <Info className="w-4 h-4 text-blue-400" />
                      <span>Rating System Guide</span>
                    </button>

                    {userProfile?.isAdmin && (
                      <>
                        <div className="my-1 border-t border-[#26262f]" />
                        <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          Admin Actions
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsManageMembersModalOpen(true);
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white hover:bg-[#202028] transition flex items-center gap-2.5 cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-emerald-400" />
                          <span>Manage Members</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleFixPosters();
                            setIsToolsMenuOpen(false);
                          }}
                          disabled={isLoading}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white hover:bg-[#202028] transition flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
                        >
                          <Film className="w-4 h-4 text-emerald-400" />
                          <span>Sync OMDb Metadata</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsImportModalOpen(true);
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white hover:bg-[#202028] transition flex items-center gap-2.5 cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>Import Seed Movies</span>
                        </button>

                        {movies.length < 44 && (
                          <button
                            type="button"
                            onClick={() => {
                              handleLoadAdamSeedMovies();
                              setIsToolsMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-[#202028] transition flex items-center gap-2.5 cursor-pointer"
                          >
                            <Database className="w-4 h-4 text-amber-400" />
                            <span>Load Adam's 44 Picks</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Primary Action: Add Movie Button */}
            <button
              type="button"
              id="open-add-movie-modal-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="hidden lg:flex px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs sm:text-sm font-bold tracking-tight shadow-lg shadow-amber-500/10 transition-all items-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Movie</span>
            </button>
          </div>
        </div>
      </header>

      {/* Exciting Weekly Hot Take Broadcast Banner */}
      {hotTakes.length > 0 && (
        <div className="pt-4 sm:pt-6">
          <HotTakeBanner
            hotTakes={hotTakes}
            members={members}
            movies={movies}
            currentUserProfile={userProfile}
            onOpenMovieDetail={(m) => setSelectedMovieForDetail(m)}
            onOpenChat={() => setActiveSection('chat')}
          />
        </div>
      )}

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

        {/* VIEW 1: MOVIES SECTION */}
        {(activeSection === 'movies' || activeSection === 'all') && (
          <div className="space-y-6">
            {activeSection === 'movies' && (
              <StatsBar 
                movies={movies} 
                members={members} 
                selectedMemberFilter={selectedMemberFilter}
                onSelectMemberFilter={setSelectedMemberFilter}
                onSelectMovie={(m) => setSelectedMovieForDetail(m)}
                onOpenLeaderboard={() => setIsCuratorLeaderboardOpen(true)}
              />
            )}

            <MovieSpreadsheet
              movies={movies}
              members={members}
              currentUserProfile={userProfile}
              selectedMemberFilter={selectedMemberFilter}
              onSelectMemberFilter={setSelectedMemberFilter}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onLoadAdamSeedMovies={handleLoadAdamSeedMovies}
              onSelectMovieDetail={(movie) => setSelectedMovieForDetail(movie)}
              onUpdateRating={handleUpdateRating}
              onDeleteMovie={handleDeleteMovie}
              onDeleteAllMovies={handleDeleteAllMovies}
              onOpenLeaderboard={() => setIsCuratorLeaderboardOpen(true)}
            />
          </div>
        )}

        {/* VIEW 2: STATS SECTION */}
        {(activeSection === 'stats' || activeSection === 'all') && (
          <div className={activeSection === 'all' ? 'pt-6 border-t border-[#222228]' : ''}>
            <StatsSection
              movies={movies}
              members={members}
              onSelectMovie={(m) => setSelectedMovieForDetail(m)}
              onOpenLeaderboard={() => setIsCuratorLeaderboardOpen(true)}
              onSelectMemberFilter={(mem) => {
                setSelectedMemberFilter(mem);
                setActiveSection('movies');
              }}
            />
          </div>
        )}

        {/* VIEW 3: MEMBERS SECTION */}
        {(activeSection === 'members' || activeSection === 'all') && (
          <div className={activeSection === 'all' ? 'pt-6 border-t border-[#222228]' : ''}>
            <MembersSection
              movies={movies}
              members={members}
              currentUserProfile={userProfile}
              selectedMemberFilter={selectedMemberFilter}
              onSelectMemberFilter={(mem) => {
                setSelectedMemberFilter(mem);
                setActiveSection('movies');
              }}
              onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
              onOpenManageMembers={() => setIsManageMembersModalOpen(true)}
              onOpenLeaderboard={() => setIsCuratorLeaderboardOpen(true)}
              onSelectMovie={(m) => setSelectedMovieForDetail(m)}
            />
          </div>
        )}

        {/* VIEW 4: CHAT LOUNGE */}
        {(activeSection === 'chat' || activeSection === 'all') && (
          <div className={activeSection === 'all' ? 'pt-6 border-t border-[#222228]' : ''}>
            <GeneralChat
              messages={chatMessages}
              members={members}
              currentUserProfile={userProfile}
              defaultExpanded={activeSection === 'chat'}
            />
          </div>
        )}
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
            <span className="text-zinc-300 ml-2 border-l border-zinc-700 pl-4 flex items-center gap-1.5">
              Logged in as 
              <button 
                onClick={() => setIsEditProfileModalOpen(true)}
                className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                title="Edit your profile picture"
              >
                {userProfile?.personName}
              </button> 
              {userProfile?.isAdmin && '(Admin)'}
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
        currentUserProfile={userProfile}
        hotTakes={hotTakes}
      />

      {/* Movie Details Modal */}
      <MovieDetailModal
        movie={selectedMovieForDetail}
        members={members}
        allMovies={movies}
        currentUserProfile={userProfile}
        onClose={() => setSelectedMovieForDetail(null)}
        onDelete={handleDeleteMovie}
        onUpdateRating={handleUpdateRating}
        onOpenLeaderboard={() => setIsCuratorLeaderboardOpen(true)}
      />

      {/* Curator & Taste Leaderboard Modal */}
      <CuratorLeaderboardModal
        isOpen={isCuratorLeaderboardOpen}
        onClose={() => setIsCuratorLeaderboardOpen(false)}
        movies={movies}
        members={members}
        onSelectMovie={(movie) => setSelectedMovieForDetail(movie)}
        onFilterByUploader={(name) => {
          setSelectedMemberFilter('ALL');
          const adderSelect = document.querySelector('select[id*="addedBy"]') as HTMLSelectElement;
          if (adderSelect) {
            adderSelect.value = name;
            adderSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }}
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

      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          members={members}
          onSelectPersonName={async (newPersonName) => {
            if (!user) return;
            setUserProfile((prev) => prev ? { ...prev, personName: newPersonName } : { isAdmin: false, personName: newPersonName });
            try {
              const profileRef = doc(db, 'users', user.uid);
              await setDoc(profileRef, { personName: newPersonName }, { merge: true });
              showToast(`Switched identity to ${newPersonName}`, 'success');
            } catch (err) {
              console.error('Failed to update personName:', err);
            }
          }}
          currentMember={
            (userProfile?.personName && members.find(m => m.name === userProfile.personName)) ||
            members.find(m => m.name === 'Senior Iglesia') || {
              id: 'member-senior-iglesia',
              name: 'Senior Iglesia',
              shortName: 'Senior Iglesia',
              initials: 'SI',
              avatarColor: 'bg-orange-600 text-orange-50',
              badgeBg: 'bg-orange-950/60 text-orange-300 border-orange-800/80',
              badgeText: 'text-orange-400',
              borderAccent: 'border-orange-500/80',
              addedAt: Date.now(),
            }
          }
          onOpenEmailAlerts={() => setIsEmailAlertsModalOpen(true)}
        />
      )}

      {/* Email Alert System & Weekly Sarcastic Roast Modal */}
      <EmailAlertsModal
        isOpen={isEmailAlertsModalOpen}
        onClose={() => setIsEmailAlertsModalOpen(false)}
        movies={movies}
        members={members}
        chatMessages={chatMessages}
        hotTakes={hotTakes}
        currentMemberName={userProfile?.personName || 'Adam'}
        userEmail={user?.email}
        userId={user?.uid}
        onShowToast={showToast}
      />

      {/* Rating System Guide Modal */}
      <RatingSystemModal 
        isOpen={isRatingSystemModalOpen}
        onClose={() => setIsRatingSystemModalOpen(false)}
        onOpenLeaderboard={() => setIsCuratorLeaderboardOpen(true)}
      />

      {/* About App Modal */}
      <AboutAppModal
        isOpen={isAboutAppModalOpen}
        onClose={() => setIsAboutAppModalOpen(false)}
      />
    </div>
  );
}

