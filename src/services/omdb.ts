import { OMDBMovieSearchResult, OMDBMovieDetail } from '../types';

const OMDB_API_KEY = 'a6b81d45';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

export async function searchMoviesOMDB(
  query: string,
  year?: string
): Promise<{ movies: OMDBMovieSearchResult[]; error?: string }> {
  if (!query.trim()) {
    return { movies: [] };
  }

  try {
    const url = new URL(OMDB_BASE_URL);
    url.searchParams.set('apikey', OMDB_API_KEY);
    url.searchParams.set('s', query.trim());
    url.searchParams.set('type', 'movie');
    if (year && year.trim()) {
      url.searchParams.set('y', year.trim());
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      return { movies: [], error: `Network error (${res.status})` };
    }

    const data = await res.json();
    if (data.Response === 'False') {
      return { movies: [], error: data.Error || 'No movies found.' };
    }

    // Filter to only movies with valid imdbIDs and unique
    const unique = new Map<string, OMDBMovieSearchResult>();
    for (const item of (data.Search || []) as OMDBMovieSearchResult[]) {
      if (item.imdbID && !unique.has(item.imdbID)) {
        unique.set(item.imdbID, item);
      }
    }

    return { movies: Array.from(unique.values()) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to search OMDb';
    return { movies: [], error: message };
  }
}

export async function getMovieDetailsOMDB(imdbID: string): Promise<OMDBMovieDetail | null> {
  if (!imdbID) return null;

  try {
    const url = new URL(OMDB_BASE_URL);
    url.searchParams.set('apikey', OMDB_API_KEY);
    url.searchParams.set('i', imdbID.trim());
    url.searchParams.set('plot', 'short');

    const res = await fetch(url.toString());
    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.Response === 'False') {
      return null;
    }

    return data as OMDBMovieDetail;
  } catch (err) {
    console.error('Error fetching OMDb details for:', imdbID, err);
    return null;
  }
}
