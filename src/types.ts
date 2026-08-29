export type PersonName = string;

export interface MemberProfile {
  id: string; // Add id to allow firestore doc ID mapping
  name: string;
  shortName: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  addedAt: number;
  email?: string;
  optOutDailyDigest?: boolean;
  optOutWeeklyRoast?: boolean;
}

export const DEFAULT_MEMBER_PROFILES: Omit<MemberProfile, 'id' | 'addedAt'>[] = [
  {
    name: 'Tristan Brady',
    shortName: 'Tristan',
    initials: 'TB',
    avatarColor: 'bg-emerald-600 text-emerald-50',
    badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
    badgeText: 'text-emerald-400',
    borderAccent: 'border-emerald-500/80',
  },
  {
    name: 'Anthony',
    shortName: 'Anthony',
    initials: 'A',
    avatarColor: 'bg-blue-600 text-blue-50',
    badgeBg: 'bg-blue-950/60 text-blue-300 border-blue-800/80',
    badgeText: 'text-blue-400',
    borderAccent: 'border-blue-500/80',
  },
  {
    name: 'Adam',
    shortName: 'Adam',
    initials: 'Ad',
    avatarColor: 'bg-violet-600 text-violet-50',
    badgeBg: 'bg-violet-950/60 text-violet-300 border-violet-800/80',
    badgeText: 'text-violet-400',
    borderAccent: 'border-violet-500/80',
  },
  {
    name: 'Matt Tighe',
    shortName: 'Matt',
    initials: 'MT',
    avatarColor: 'bg-amber-600 text-amber-50',
    badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
    badgeText: 'text-amber-400',
    borderAccent: 'border-amber-500/80',
  },
  {
    name: 'Senior Iglesia',
    shortName: 'Senior Iglesia',
    initials: 'SI',
    avatarColor: 'bg-orange-600 text-orange-50',
    badgeBg: 'bg-orange-950/60 text-orange-300 border-orange-800/80',
    badgeText: 'text-orange-400',
    borderAccent: 'border-orange-500/80',
  },
  {
    name: 'Robert',
    shortName: 'Robert',
    initials: 'R',
    avatarColor: 'bg-rose-600 text-rose-50',
    badgeBg: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
    badgeText: 'text-rose-400',
    borderAccent: 'border-rose-500/80',
  },
  {
    name: 'Don',
    shortName: 'Don',
    initials: 'D',
    avatarColor: 'bg-cyan-600 text-cyan-50',
    badgeBg: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80',
    badgeText: 'text-cyan-400',
    borderAccent: 'border-cyan-500/80',
  },
];

export interface MovieComment {
  id: string;
  text: string;
  author: PersonName;
  createdAt: number;
  parentId?: string | null;
  gifUrl?: string;
  likes?: PersonName[];
  dislikes?: PersonName[];
}

export type HotTakeReactionType = '🔥' | '🧊' | '🍿' | '💀';

export interface HotTake {
  id: string;
  movieId: string;
  movieTitle: string;
  movieYear?: string;
  moviePoster?: string;
  author: PersonName;
  authorShortName?: string;
  authorAvatarUrl?: string;
  hotTakeText: string;
  createdAt: number;
  reactions?: Record<string, PersonName[]>; // Map of emoji (e.g. '🔥') to array of PersonName
  imdbID?: string;
  initialRating?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  author: PersonName;
  createdAt: number;
  parentId?: string | null;
  gifUrl?: string;
  likes?: PersonName[];
  dislikes?: PersonName[];
}

export interface MovieItem {
  id: string;
  title: string;
  year: string;
  releaseDate?: string;
  genre: string;
  poster: string;
  imdbID: string;
  imdbRating?: string;
  director?: string;
  actors?: string;
  plot?: string;
  rated?: string;
  runtime?: string;
  addedBy: PersonName;
  addedAt: number;
  ratings: Partial<Record<PersonName, number>>; // rating 1 to 5
  notes?: string;
  comments?: MovieComment[];
  isHotTake?: boolean;
  hotTakeText?: string;
  hotTakeCreatedAt?: number;
}

export interface OMDBMovieSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OMDBMovieDetail {
  Title: string;
  Year: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  Poster?: string;
  Ratings?: Array<{ Source: string; Value: string }>;
  Metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  imdbID: string;
  Type?: string;
  Response?: string;
  Error?: string;
}

export interface UserEmailPreferences {
  email: string;
  optOutDailyDigest: boolean;
  optOutWeeklyRoast: boolean;
  lastDailySentAt?: number;
  lastWeeklySentAt?: number;
}

export interface WeeklyRoastData {
  headline: string;
  tasteShame: string;
  slackerRoast: string;
  spicyQuoteRoast?: string;
  closingZing: string;
  topCurator: string;
  topCuratorScore: number | null;
  bottomCurator: string;
  bottomCuratorScore: number | null;
  unratedMovies: MovieItem[];
  recentHotTake?: HotTake;
  topChatQuote?: { author: string; text: string };
  newFeatures: string[];
}

export interface DailyDigestData {
  dateString: string;
  moviesAdded: MovieItem[];
  curatorsActive: string[];
}
