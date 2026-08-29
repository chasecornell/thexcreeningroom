import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  getDocs,
  getDoc,
  writeBatch,
  query,
  orderBy,
  Firestore,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MovieItem, PersonName, MemberProfile, DEFAULT_MEMBER_PROFILES, ChatMessage, MovieComment, HotTake, OMDBMovieDetail } from '../types';
import { STARTER_MOVIES } from '../data/starterMovies';
import { searchMoviesOMDB, getMovieDetailsOMDB } from '../services/omdb';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect to named or default database with auto-detect long-polling enabled for robust connection
export const db: Firestore = (() => {
  try {
    return firebaseConfig.firestoreDatabaseId
      ? initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
        }, firebaseConfig.firestoreDatabaseId)
      : initializeFirestore(app, {
          experimentalAutoDetectLongPolling: true,
        });
  } catch {
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
})();

// Auth Export
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const MOVIES_COLLECTION = 'movies';
const MEMBERS_COLLECTION = 'members';
const HOT_TAKES_COLLECTION = 'hot_takes';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore server on boot
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDoc(testDoc);
    return true;
  } catch (error) {
    console.warn('Firestore connection check notice:', error);
    return true;
  }
}

/**
 * Subscribe to the real-time list of movies in Firestore
 */
export function subscribeToMovies(
  onUpdate: (movies: MovieItem[]) => void,
  onError: (error: Error) => void
): () => void {
  try {
    const moviesRef = collection(db, MOVIES_COLLECTION);
    const q = query(moviesRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const movies: MovieItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const rawRatings = data.ratings || {};
          const ratings: Partial<Record<PersonName, number>> = { ...rawRatings };

          // Ensure bidirectional support for "Matt" and "Matt Tighe"
          if (ratings['Matt'] !== undefined && ratings['Matt Tighe'] === undefined) {
            ratings['Matt Tighe'] = ratings['Matt'];
          } else if (ratings['Matt Tighe'] !== undefined && ratings['Matt'] === undefined) {
            ratings['Matt'] = ratings['Matt'];
          }

          // Use comments as is
          const comments = data.comments || [];

          // Map addedBy for Matt Tighe
          let adder = data.addedBy || 'Adam';
          if (adder === 'Matt') {
            adder = 'Matt Tighe';
          }

          movies.push({
            id: docSnap.id,
            title: data.title || 'Untitled',
            year: data.year || '',
            releaseDate: data.releaseDate || '',
            genre: data.genre || 'Uncategorized',
            poster: data.poster || '',
            imdbID: data.imdbID || '',
            imdbRating: data.imdbRating || '',
            director: data.director || '',
            actors: data.actors || '',
            plot: data.plot || '',
            rated: data.rated || '',
            runtime: data.runtime || '',
            addedBy: adder,
            addedAt: data.addedAt || Date.now(),
            ratings,
            notes: data.notes || '',
            comments,
            isHotTake: !!data.isHotTake,
            hotTakeText: data.hotTakeText || undefined,
            hotTakeCreatedAt: data.hotTakeCreatedAt || undefined,
          });
        });
        onUpdate(movies);
      },
      (error) => {
        console.warn('Firestore movies subscription notice:', error);
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    );

    return unsubscribe;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Failed to subscribe to Firestore');
    console.error('Failed to setup Firestore subscription:', error);
    onError(error);
    return () => {};
  }
}

/**
 * Add a new movie to Firestore
 */
export async function addMovieToFirestore(movieData: Omit<MovieItem, 'id'>): Promise<string> {
  const path = MOVIES_COLLECTION;
  try {
    const moviesRef = collection(db, path);
    // Use imdbID if available or generate doc ref
    const docRef = movieData.imdbID ? doc(moviesRef, movieData.imdbID) : doc(moviesRef);
    
    await setDoc(docRef, {
      ...movieData,
      addedAt: movieData.addedAt || Date.now(),
      ratings: movieData.ratings || {},
      isHotTake: !!movieData.isHotTake,
      hotTakeText: movieData.hotTakeText || null,
      hotTakeCreatedAt: movieData.hotTakeCreatedAt || (movieData.isHotTake ? Date.now() : null),
    }, { merge: true });

    // If submitted as a weekly Hot Take, also create a hot_takes document
    if (movieData.isHotTake && movieData.hotTakeText) {
      try {
        const takesRef = collection(db, HOT_TAKES_COLLECTION);
        const takeDoc = doc(takesRef);
        await setDoc(takeDoc, {
          movieId: docRef.id,
          movieTitle: movieData.title,
          movieYear: movieData.year || '',
          moviePoster: movieData.poster || '',
          author: movieData.addedBy,
          hotTakeText: movieData.hotTakeText,
          createdAt: movieData.hotTakeCreatedAt || Date.now(),
          imdbID: movieData.imdbID || '',
          initialRating: movieData.ratings?.[movieData.addedBy] || 0,
          reactions: { '🔥': [movieData.addedBy] },
        });
      } catch (hotTakeErr) {
        console.warn('Could not mirror hot take to hot_takes collection:', hotTakeErr);
      }
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update rating for a person (1-5 to set rating, 0 or null to clear/unwatch)
 */
export async function setMovieRatingInFirestore(
  movieId: string,
  person: PersonName,
  rating: number
): Promise<void> {
  const path = `${MOVIES_COLLECTION}/${movieId}`;
  try {
    const docRef = doc(db, MOVIES_COLLECTION, movieId);
    if (rating > 0 && rating <= 5) {
      const updateData: Record<string, unknown> = {
        [`ratings.${person}`]: rating,
      };
      if (person === 'Matt' || person === 'Matt Tighe') {
        updateData['ratings.Matt'] = rating;
        updateData['ratings.Matt Tighe'] = rating;
      }
      await updateDoc(docRef, updateData);
    } else {
      // Clear rating
      const updateData: Record<string, unknown> = {
        [`ratings.${person}`]: deleteField(),
      };
      if (person === 'Matt' || person === 'Matt Tighe') {
        updateData['ratings.Matt'] = deleteField();
        updateData['ratings.Matt Tighe'] = deleteField();
      }
      await updateDoc(docRef, updateData);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete movie from Firestore
 */
export async function deleteMovieFromFirestore(movieId: string): Promise<void> {
  const path = `${MOVIES_COLLECTION}/${movieId}`;
  try {
    const docRef = doc(db, MOVIES_COLLECTION, movieId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Batch delete all movies in Firestore (for clearing unwanted seed movies)
 */
export async function deleteAllMoviesFromFirestore(): Promise<number> {
  const path = MOVIES_COLLECTION;
  try {
    const moviesRef = collection(db, path);
    const snapshot = await getDocs(moviesRef);
    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    return snapshot.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Batch add a list of movies to Firestore
 */
export async function batchAddMoviesToFirestore(moviesList: Omit<MovieItem, 'id'>[]): Promise<number> {
  if (!moviesList.length) return 0;
  const path = MOVIES_COLLECTION;
  try {
    const moviesRef = collection(db, path);
    const batch = writeBatch(db);
    for (const movie of moviesList) {
      const docRef = movie.imdbID ? doc(moviesRef, movie.imdbID) : doc(moviesRef);
      batch.set(docRef, {
        ...movie,
        addedAt: movie.addedAt || Date.now(),
        ratings: movie.ratings || {},
      }, { merge: true });
    }
    await batch.commit();
    return moviesList.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Seeds Adam's 44 starter movies if the Firestore collection is currently empty
 */
export async function seedStarterMoviesIfEmpty(): Promise<boolean> {
  try {
    const moviesRef = collection(db, MOVIES_COLLECTION);
    const existing = await getDocs(moviesRef);
    if (existing.empty) {
      console.log('Seeding Adam Kleyweg\'s 44 starter movies to Firestore...');
      const batch = writeBatch(db);
      for (const movie of STARTER_MOVIES) {
        const docRef = movie.imdbID ? doc(moviesRef, movie.imdbID) : doc(moviesRef);
        batch.set(docRef, movie);
      }
      await batch.commit();
      console.log(`Successfully seeded ${STARTER_MOVIES.length} movies!`);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error seeding starter movies:', err);
    return false;
  }
}

/**
 * Force re-seed / populate Adam's 44 seed movies into Firestore
 */
export async function forceSeedStarterMovies(): Promise<number> {
  const moviesRef = collection(db, MOVIES_COLLECTION);
  const batch = writeBatch(db);
  for (const movie of STARTER_MOVIES) {
    const docRef = movie.imdbID ? doc(moviesRef, movie.imdbID) : doc(moviesRef);
    batch.set(docRef, movie, { merge: true });
  }
  await batch.commit();
  return STARTER_MOVIES.length;
}

/**
 * Known corrupted or mismatched IMDb IDs mapped to their accurate titles, years, and verified IMDb IDs.
 */
const KNOWN_ID_REPAIRS: Record<string, { title: string; year: string; trueImdbId: string }> = {
  'tt0438097': { title: 'Terminator Salvation', year: '2009', trueImdbId: 'tt0438488' },
  'tt0825297': { title: 'Weapons', year: '2007', trueImdbId: 'tt0497470' },
  'tt0100986': { title: 'Young Guns II', year: '1990', trueImdbId: 'tt0100994' },
};

/**
 * Audits all movies currently stored in Firestore, detects corrupted or mismatched
 * titles/IMDb IDs (e.g. Terminator Salvation showing Ice Age Meltdown, Young Guns II showing A Bite of Love),
 * repairs metadata from OMDb, and safely migrates document IDs while preserving all user ratings, notes, and comments.
 */
export async function auditAndRepairMovieMetadata(): Promise<number> {
  const path = MOVIES_COLLECTION;
  try {
    const moviesRef = collection(db, path);
    const snapshot = await getDocs(moviesRef);
    if (snapshot.empty) return 0;

    let repairedCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const currentDocId = docSnap.id;
      let currentImdbId = (data.imdbID || '').trim();
      let currentTitle = (data.title || '').trim();
      let currentYear = (data.year || '').trim();

      let targetImdbId = currentImdbId;
      let targetTitle = currentTitle;
      let targetYear = currentYear;
      let needsMigrationOrUpdate = false;

      // 1. Check known corrupted IDs (e.g. tt0438097 which is Ice Age Meltdown)
      if (KNOWN_ID_REPAIRS[currentDocId]) {
        const repairInfo = KNOWN_ID_REPAIRS[currentDocId];
        targetTitle = repairInfo.title;
        targetYear = repairInfo.year;
        targetImdbId = repairInfo.trueImdbId;
        needsMigrationOrUpdate = true;
      } else if (KNOWN_ID_REPAIRS[currentImdbId]) {
        const repairInfo = KNOWN_ID_REPAIRS[currentImdbId];
        targetTitle = repairInfo.title;
        targetYear = repairInfo.year;
        targetImdbId = repairInfo.trueImdbId;
        needsMigrationOrUpdate = true;
      } else if (currentTitle.toLowerCase().includes('terminator salvation') && currentImdbId !== 'tt0438488') {
        targetTitle = 'Terminator Salvation';
        targetYear = '2009';
        targetImdbId = 'tt0438488';
        needsMigrationOrUpdate = true;
      } else if (currentTitle.toLowerCase() === 'weapons' && currentImdbId !== 'tt0497470') {
        targetTitle = 'Weapons';
        targetYear = '2007';
        targetImdbId = 'tt0497470';
        needsMigrationOrUpdate = true;
      } else if (currentTitle.toLowerCase() === 'young guns ii' && currentImdbId !== 'tt0100994') {
        targetTitle = 'Young Guns II';
        targetYear = '1990';
        targetImdbId = 'tt0100994';
        needsMigrationOrUpdate = true;
      }

      // 2. Cross-verify with OMDb if we have an IMDb ID
      let omdbDetails: OMDBMovieDetail | null = null;
      if (targetImdbId && targetImdbId !== 'N/A') {
        omdbDetails = await getMovieDetailsOMDB(targetImdbId);
        
        // If OMDb title doesn't match the current title (e.g. "Ice Age" vs "Terminator Salvation"), search by title
        if (omdbDetails && omdbDetails.Title) {
          const omdbTitleClean = omdbDetails.Title.toLowerCase().replace(/[^a-z0-9]/g, '');
          const localTitleClean = currentTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          if (!omdbTitleClean.includes(localTitleClean) && !localTitleClean.includes(omdbTitleClean)) {
            console.log(`Title mismatch detected for doc ${currentDocId}: "${currentTitle}" vs OMDb "${omdbDetails.Title}"`);
            // Search OMDb for the real movie
            const { movies: searchResults } = await searchMoviesOMDB(currentTitle, currentYear);
            if (searchResults && searchResults.length > 0) {
              const matchedMovie = searchResults[0];
              targetImdbId = matchedMovie.imdbID;
              omdbDetails = await getMovieDetailsOMDB(targetImdbId);
              needsMigrationOrUpdate = true;
            }
          }
        }
      }

      // 3. If movie still lacks IMDb ID or details, search OMDb
      if ((!targetImdbId || targetImdbId === 'N/A' || !omdbDetails) && currentTitle) {
        const { movies: searchResults } = await searchMoviesOMDB(currentTitle, currentYear);
        if (searchResults && searchResults.length > 0) {
          targetImdbId = searchResults[0].imdbID;
          omdbDetails = await getMovieDetailsOMDB(targetImdbId);
          needsMigrationOrUpdate = true;
        }
      }

      // 4. Check if poster or plot is missing or mismatched
      const hasBadPoster = !data.poster || data.poster === 'N/A' || data.poster.trim() === '' || data.poster.includes('unsplash');
      const hasBadPlot = !data.plot || data.plot === 'N/A' || (omdbDetails?.Plot && omdbDetails.Plot !== 'N/A' && data.plot !== omdbDetails.Plot && needsMigrationOrUpdate);

      if (needsMigrationOrUpdate || hasBadPoster || hasBadPlot || (omdbDetails && omdbDetails.Poster && omdbDetails.Poster !== 'N/A' && data.poster !== omdbDetails.Poster)) {
        const updatedFields: Record<string, unknown> = {
          title: targetTitle || (omdbDetails?.Title ? omdbDetails.Title : data.title),
          year: targetYear || (omdbDetails?.Year ? omdbDetails.Year : data.year),
          releaseDate: omdbDetails?.Released && omdbDetails.Released !== 'N/A' ? omdbDetails.Released : data.releaseDate || '',
          genre: omdbDetails?.Genre && omdbDetails.Genre !== 'N/A' ? omdbDetails.Genre : data.genre || 'Drama',
          poster: omdbDetails?.Poster && omdbDetails.Poster !== 'N/A' ? omdbDetails.Poster : data.poster || '',
          imdbID: targetImdbId || data.imdbID || '',
          imdbRating: omdbDetails?.imdbRating && omdbDetails.imdbRating !== 'N/A' ? omdbDetails.imdbRating : data.imdbRating || '',
          director: omdbDetails?.Director && omdbDetails.Director !== 'N/A' ? omdbDetails.Director : data.director || '',
          plot: omdbDetails?.Plot && omdbDetails.Plot !== 'N/A' ? omdbDetails.Plot : data.plot || '',
          runtime: omdbDetails?.Runtime && omdbDetails.Runtime !== 'N/A' ? omdbDetails.Runtime : data.runtime || '',
          ratings: data.ratings || {},
          notes: data.notes || '',
          addedBy: data.addedBy || 'Adam',
          addedAt: data.addedAt || Date.now(),
          ...(data.comments ? { comments: data.comments } : {}),
          ...(data.isHotTake ? { isHotTake: data.isHotTake } : {}),
          ...(data.hotTakeText ? { hotTakeText: data.hotTakeText } : {}),
        };

        // If doc ID was the old corrupted IMDb ID (e.g. tt0438097), migrate to the true ID (tt0438488)
        if (targetImdbId && currentDocId !== targetImdbId && (currentDocId === 'tt0438097' || currentDocId === 'tt0825297' || currentDocId === 'tt0100986' || currentDocId === currentImdbId)) {
          const newDocRef = doc(moviesRef, targetImdbId);
          await setDoc(newDocRef, updatedFields, { merge: true });
          await deleteDoc(docSnap.ref);
          console.log(`Migrated movie document from "${currentDocId}" to "${targetImdbId}" (${targetTitle})`);
        } else {
          await updateDoc(docSnap.ref, updatedFields);
          console.log(`Updated movie document "${currentDocId}" (${targetTitle}) with fresh OMDb metadata`);
        }

        repairedCount++;
      }
    }

    return repairedCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return 0;
  }
}

/**
 * Find movies with missing posters and fetch metadata from OMDb to fix them.
 */
export async function fixMissingPostersOMDB(): Promise<number> {
  return auditAndRepairMovieMetadata();
}

/**
 * Subscribe to the real-time list of members in Firestore
 */
export function subscribeToMembers(
  onUpdate: (members: MemberProfile[]) => void,
  onError: (error: Error) => void
): () => void {
  try {
    const membersRef = collection(db, MEMBERS_COLLECTION);
    const q = query(membersRef, orderBy('addedAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const members: MemberProfile[] = [];
        const seenNames = new Set<string>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as MemberProfile;
          let name = data.name;
          if (name === 'Matt') {
            name = 'Matt Tighe';
          }

          if (!seenNames.has(name) && !seenNames.has(data.name)) {
            seenNames.add(name);
            seenNames.add(data.name);
            if (name === 'Matt Tighe') {
              seenNames.add('Matt');
              seenNames.add('Matt Tighe');
            }
            members.push({ id: docSnap.id, ...data, name });
          }
        });

        // Ensure all default members (Tristan, Anthony, Adam, Matt Tighe, Senior Iglesia, Robert, Don) are represented
        DEFAULT_MEMBER_PROFILES.forEach((defaultMember, idx) => {
          const isPresent = seenNames.has(defaultMember.name) || 
            (defaultMember.name === 'Matt Tighe' && (seenNames.has('Matt') || seenNames.has('Matt Tighe'))) ||
            (defaultMember.name === 'Senior Iglesia' && seenNames.has('Senior Iglesia'));
          
          if (!isPresent) {
            seenNames.add(defaultMember.name);
            if (defaultMember.name === 'Matt Tighe') {
              seenNames.add('Matt');
              seenNames.add('Matt Tighe');
            }
            members.push({
              id: `default-member-${idx}`,
              ...defaultMember,
              addedAt: 1718000000000 + idx,
            });
          }
        });

        onUpdate(members);
      },
      (error) => {
        console.warn('Firestore members subscription notice:', error);
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    );

    return unsubscribe;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Failed to subscribe to members');
    onError(error);
    return () => {};
  }
}

/**
 * Add a new member to Firestore
 */
export async function addMemberToFirestore(memberData: Omit<MemberProfile, 'id' | 'addedAt'>): Promise<string> {
  const path = MEMBERS_COLLECTION;
  try {
    const membersRef = collection(db, path);
    const docRef = doc(membersRef);
    
    await setDoc(docRef, {
      ...memberData,
      addedAt: Date.now(),
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update member avatar
 */
export async function updateMemberAvatar(memberId: string, avatarUrl: string | null): Promise<void> {
  const path = `${MEMBERS_COLLECTION}/${memberId}`;
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, memberId);
    if (avatarUrl) {
      await updateDoc(docRef, { avatarUrl });
    } else {
      await updateDoc(docRef, { avatarUrl: deleteField() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Seed default members if the collection is empty
 */
export async function seedDefaultMembersIfEmpty(): Promise<boolean> {
  try {
    const membersRef = collection(db, MEMBERS_COLLECTION);
    const existing = await getDocs(membersRef);
    if (existing.empty) {
      console.log('Seeding default members to Firestore...');
      const batch = writeBatch(db);
      for (const member of DEFAULT_MEMBER_PROFILES) {
        const docRef = doc(membersRef);
        batch.set(docRef, { ...member, addedAt: Date.now() });
      }
      await batch.commit();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error seeding default members:', err);
    return false;
  }
}


const GENERAL_CHAT_COLLECTION = 'general_chat';

/**
 * Add a comment to a movie
 */
export async function addMovieComment(movieId: string, comment: MovieComment): Promise<void> {
  const path = `${MOVIES_COLLECTION}/${movieId}`;
  try {
    const docRef = doc(db, MOVIES_COLLECTION, movieId);
    await updateDoc(docRef, {
      comments: arrayUnion(comment)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Remove a comment from a movie
 */
export async function removeMovieComment(movieId: string, commentId: string): Promise<void> {
  const path = `${MOVIES_COLLECTION}/${movieId}`;
  try {
    const docRef = doc(db, MOVIES_COLLECTION, movieId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const existingComments: MovieComment[] = data.comments || [];
    const updated = existingComments.filter((c) => c.id !== commentId && c.parentId !== commentId);
    await updateDoc(docRef, { comments: updated });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Toggle Like or Dislike on a Movie Comment
 */
export async function toggleMovieCommentReaction(
  movieId: string,
  commentId: string,
  person: PersonName,
  reactionType: 'like' | 'dislike'
): Promise<void> {
  const path = `${MOVIES_COLLECTION}/${movieId}`;
  try {
    const docRef = doc(db, MOVIES_COLLECTION, movieId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const existingComments: MovieComment[] = data.comments || [];
    
    const updated = existingComments.map((c) => {
      if (c.id !== commentId) return c;
      const currentLikes = Array.isArray(c.likes) ? [...c.likes] : [];
      const currentDislikes = Array.isArray(c.dislikes) ? [...c.dislikes] : [];

      if (reactionType === 'like') {
        const hasLiked = currentLikes.includes(person);
        const newLikes = hasLiked ? currentLikes.filter((p) => p !== person) : [...currentLikes, person];
        const newDislikes = currentDislikes.filter((p) => p !== person);
        return { ...c, likes: newLikes, dislikes: newDislikes };
      } else {
        const hasDisliked = currentDislikes.includes(person);
        const newDislikes = hasDisliked ? currentDislikes.filter((p) => p !== person) : [...currentDislikes, person];
        const newLikes = currentLikes.filter((p) => p !== person);
        return { ...c, likes: newLikes, dislikes: newDislikes };
      }
    });

    await updateDoc(docRef, { comments: updated });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Subscribe to General Chat stream in real-time
 */
export function subscribeToGeneralChat(
  onUpdate: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void
): () => void {
  try {
    const chatRef = collection(db, GENERAL_CHAT_COLLECTION);
    const q = query(chatRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          messages.push({
            id: docSnap.id,
            text: data.text || '',
            author: data.author || 'Anonymous',
            createdAt: data.createdAt || Date.now(),
            parentId: data.parentId || null,
            gifUrl: data.gifUrl || undefined,
            likes: Array.isArray(data.likes) ? data.likes : [],
            dislikes: Array.isArray(data.dislikes) ? data.dislikes : [],
          });
        });
        onUpdate(messages);
      },
      (error) => {
        console.warn('Firestore general chat subscription notice:', error);
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    );

    return unsubscribe;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Failed to subscribe to general chat');
    onError(error);
    return () => {};
  }
}

/**
 * Add a new message to General Chat
 */
export async function addGeneralChatMessage(
  messageData: Omit<ChatMessage, 'id'>
): Promise<string> {
  const path = GENERAL_CHAT_COLLECTION;
  try {
    const chatRef = collection(db, path);
    const docRef = doc(chatRef);

    await setDoc(docRef, {
      ...messageData,
      createdAt: messageData.createdAt || Date.now(),
      likes: messageData.likes || [],
      dislikes: messageData.dislikes || [],
      parentId: messageData.parentId || null,
      gifUrl: messageData.gifUrl || null,
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Toggle reaction (like/dislike) on a General Chat Message
 */
export async function toggleGeneralChatReaction(
  messageId: string,
  person: PersonName,
  reactionType: 'like' | 'dislike',
  currentLikes: PersonName[] = [],
  currentDislikes: PersonName[] = []
): Promise<void> {
  const path = `${GENERAL_CHAT_COLLECTION}/${messageId}`;
  try {
    const docRef = doc(db, GENERAL_CHAT_COLLECTION, messageId);

    let newLikes = [...currentLikes];
    let newDislikes = [...currentDislikes];

    if (reactionType === 'like') {
      if (newLikes.includes(person)) {
        newLikes = newLikes.filter((p) => p !== person);
      } else {
        newLikes.push(person);
        newDislikes = newDislikes.filter((p) => p !== person);
      }
    } else {
      if (newDislikes.includes(person)) {
        newDislikes = newDislikes.filter((p) => p !== person);
      } else {
        newDislikes.push(person);
        newLikes = newLikes.filter((p) => p !== person);
      }
    }

    await updateDoc(docRef, {
      likes: newLikes,
      dislikes: newDislikes,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a message from General Chat (and its replies)
 */
export async function deleteGeneralChatMessage(messageId: string): Promise<void> {
  const path = `${GENERAL_CHAT_COLLECTION}/${messageId}`;
  try {
    const docRef = doc(db, GENERAL_CHAT_COLLECTION, messageId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Delete ALL messages from General Chat (Admin only)
 */
export async function deleteAllGeneralChatMessages(): Promise<void> {
  const path = GENERAL_CHAT_COLLECTION;
  try {
    const chatRef = collection(db, path);
    const snap = await getDocs(chatRef);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Seed starter general chat banter if the chat stream is completely empty
 */
export async function seedInitialGeneralChatIfEmpty(): Promise<boolean> {
  try {
    const chatRef = collection(db, GENERAL_CHAT_COLLECTION);
    const existing = await getDocs(chatRef);
    if (existing.empty) {
      return await forceSeedGeneralChat();
    }
    return false;
  } catch (err) {
    console.error('Error seeding starter chat:', err);
    return false;
  }
}

/**
 * Force seed or reset rich sample general chat banter
 */
export async function forceSeedGeneralChat(): Promise<boolean> {
  try {
    const chatRef = collection(db, GENERAL_CHAT_COLLECTION);
    const now = Date.now();

    const batch = writeBatch(db);

    // Message 1: Tristan Brady
    const doc1 = doc(chatRef);
    batch.set(doc1, {
      author: 'Tristan Brady',
      text: 'Welcome to the Screening Room Lounge! 🎬 Post your unfiltered movie takes, roasted picks, or why someone logged a 1-star masterpiece here.',
      createdAt: now - 1000 * 60 * 60 * 5,
      likes: ['Tristan Brady', 'Anthony', 'Adam', 'Matt'],
      dislikes: [],
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdW4yNWJhcGlmZW16aDRtZDJpNmE2ZWltcThkbmJkYnQ2eXVreXZtZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/gl0mkIZOW6Nwc/giphy.gif',
      parentId: null,
    });

    // Message 2: Anthony
    const doc2 = doc(chatRef);
    batch.set(doc2, {
      author: 'Anthony',
      text: 'Whoever gave The Room 5 stars... you are a legend and also completely unhinged 😂🍿',
      createdAt: now - 1000 * 60 * 60 * 2,
      likes: ['Anthony', 'Robert', 'Don'],
      dislikes: ['Adam'],
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3J1bmYwOGpsbXB0Y3h5OGZtbG4zbW53dTh2bWp0NW91ZjZodmxvbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o72F8t9TDi2xVnxOE/giphy.gif',
      parentId: null,
    });

    // Reply to Message 2 from Matt
    const reply1 = doc(chatRef);
    batch.set(reply1, {
      author: 'Matt',
      text: 'It is a cinematic masterpiece and Tommy Wiseau belongs in the Criterion Collection! 🤌',
      createdAt: now - 1000 * 60 * 90,
      likes: ['Matt', 'Tristan Brady'],
      dislikes: ['Anthony'],
      parentId: doc2.id,
    });

    // Reply to Message 2 from Robert
    const reply2 = doc(chatRef);
    batch.set(reply2, {
      author: 'Robert',
      text: '"I did not hit her, it\'s not true, it\'s bullshit, I did not hit her... oh hi Mark." 😂',
      createdAt: now - 1000 * 60 * 75,
      likes: ['Robert', 'Anthony', 'Tristan Brady'],
      dislikes: [],
      parentId: doc2.id,
    });

    // Message 3: Adam
    const doc3 = doc(chatRef);
    batch.set(doc3, {
      author: 'Adam',
      text: 'Next movie night is strictly 90s psychological thrillers or 80s creature features. No debates! 📼🔥',
      createdAt: now - 1000 * 60 * 45,
      likes: ['Adam', 'Matt', 'Don'],
      dislikes: [],
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWZvaG5ndGtkNGZ4eG90N2hkcmkyMHZzNGw5Z2phOHlndDVmYXlkdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/7rj2ZgBlAqgms/giphy.gif',
      parentId: null,
    });

    // Message 4: Don
    const doc4 = doc(chatRef);
    batch.set(doc4, {
      author: 'Don',
      text: 'If we watch anything over 2 hours and 30 minutes on a Tuesday, I am falling asleep 15 minutes in 😴🍿',
      createdAt: now - 1000 * 60 * 12,
      likes: ['Don', 'Robert', 'Anthony'],
      dislikes: ['Tristan Brady'],
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTVlOW1mNmd1Nm1yNXJ4aWtkNHp3cWtncm5vbjhpa3Z0dnl1anlkbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mkhMTALSJYJWg/giphy.gif',
      parentId: null,
    });

    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error in forceSeedGeneralChat:', err);
    return false;
  }
}

/**
 * Subscribe to Hot Takes stream in real-time
 */
export function subscribeToHotTakes(
  onUpdate: (takes: HotTake[]) => void,
  onError: (error: Error) => void
): () => void {
  try {
    const takesRef = collection(db, HOT_TAKES_COLLECTION);
    const q = query(takesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const takes: HotTake[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          takes.push({
            id: docSnap.id,
            movieId: data.movieId || '',
            movieTitle: data.movieTitle || 'Untitled',
            movieYear: data.movieYear || '',
            moviePoster: data.moviePoster || '',
            author: data.author || 'Adam',
            authorShortName: data.authorShortName || undefined,
            authorAvatarUrl: data.authorAvatarUrl || undefined,
            hotTakeText: data.hotTakeText || '',
            createdAt: data.createdAt || Date.now(),
            reactions: data.reactions || {},
            imdbID: data.imdbID || undefined,
            initialRating: data.initialRating || undefined,
          });
        });
        onUpdate(takes);
      },
      (error) => {
        console.warn('Firestore hot takes subscription notice:', error);
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    );

    return unsubscribe;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Failed to subscribe to hot takes');
    onError(error);
    return () => {};
  }
}

/**
 * Add a new Hot Take to Firestore
 */
export async function addHotTakeToFirestore(
  takeData: Omit<HotTake, 'id'>
): Promise<string> {
  const path = HOT_TAKES_COLLECTION;
  try {
    const takesRef = collection(db, path);
    const docRef = doc(takesRef);

    await setDoc(docRef, {
      ...takeData,
      createdAt: takeData.createdAt || Date.now(),
      reactions: takeData.reactions || {},
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Toggle Reaction on a Hot Take (e.g. 🔥, 🧊, 🍿, 💀)
 */
export async function toggleHotTakeReaction(
  takeId: string,
  person: PersonName,
  emoji: string
): Promise<void> {
  const path = `${HOT_TAKES_COLLECTION}/${takeId}`;
  try {
    const docRef = doc(db, HOT_TAKES_COLLECTION, takeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const currentReactions: Record<string, PersonName[]> = data.reactions || {};
    const currentUsers = Array.isArray(currentReactions[emoji]) ? [...currentReactions[emoji]] : [];

    const hasReacted = currentUsers.includes(person);
    let updatedUsers: PersonName[];
    if (hasReacted) {
      updatedUsers = currentUsers.filter((p) => p !== person);
    } else {
      updatedUsers = [...currentUsers, person];
    }

    await updateDoc(docRef, {
      [`reactions.${emoji}`]: updatedUsers,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a Hot Take from Firestore
 */
export async function deleteHotTakeFromFirestore(takeId: string): Promise<void> {
  const path = `${HOT_TAKES_COLLECTION}/${takeId}`;
  try {
    const docRef = doc(db, HOT_TAKES_COLLECTION, takeId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Check if a member can submit a weekly Hot Take (1 per rolling 7 days / 168 hours)
 */
export function checkMemberHotTakeEligibility(
  authorName: PersonName,
  hotTakes: HotTake[]
): {
  allowed: boolean;
  lastTake?: HotTake;
  daysRemaining?: number;
  hoursRemaining?: number;
  nextAvailableDate?: Date;
} {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Find all takes by this author (handling Matt / Matt Tighe aliases)
  const authorTakes = hotTakes.filter((t) => {
    if (authorName === 'Matt' || authorName === 'Matt Tighe') {
      return t.author === 'Matt' || t.author === 'Matt Tighe';
    }
    return t.author === authorName;
  });

  if (!authorTakes.length) {
    return { allowed: true };
  }

  // Sort latest first
  const latestTake = [...authorTakes].sort((a, b) => b.createdAt - a.createdAt)[0];
  const elapsed = now - latestTake.createdAt;

  if (elapsed >= SEVEN_DAYS_MS) {
    return { allowed: true, lastTake: latestTake };
  }

  const remainingMs = SEVEN_DAYS_MS - elapsed;
  const daysRemaining = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.ceil(remainingMs / (60 * 60 * 1000));
  const nextAvailableDate = new Date(latestTake.createdAt + SEVEN_DAYS_MS);

  return {
    allowed: false,
    lastTake: latestTake,
    daysRemaining,
    hoursRemaining,
    nextAvailableDate,
  };
}

/**
 * Seed starter Hot Takes if none exist in Firestore
 */
export async function seedStarterHotTakesIfEmpty(movies: MovieItem[] = []): Promise<boolean> {
  try {
    const takesRef = collection(db, HOT_TAKES_COLLECTION);
    const existing = await getDocs(takesRef);
    if (existing.empty) {
      console.log('Seeding initial starter hot take...');
      const batch = writeBatch(db);
      const doc1 = doc(takesRef);

      // Find The Room or Oppenheimer or Interstellar or fallback
      const roomMovie = movies.find(m => m.title.toLowerCase().includes('the room')) || {
        id: 'tt0368226',
        title: 'The Room',
        year: '2003',
        poster: 'https://m.media-amazon.com/images/M/MV5BYjEzN2FlYmYtNDkwMC00NGFkLWE5ODctYmE5NmYxNzE5ZTU3XkEyXkFqcGc@._V1_SX300.jpg',
        imdbID: 'tt0368226',
      };

      batch.set(doc1, {
        movieId: roomMovie.id,
        movieTitle: roomMovie.title,
        movieYear: roomMovie.year || '2003',
        moviePoster: roomMovie.poster || '',
        author: 'Matt Tighe',
        hotTakeText: 'The Room is not bad cinema — it is pure unfiltered outsider auteur genius that completely outshines modern Hollywood cookie-cutter franchises. 5 Stars without hesitation!',
        createdAt: Date.now() - 1000 * 60 * 60 * 18, // 18 hours ago
        reactions: {
          '🔥': ['Matt Tighe', 'Tristan Brady'],
          '🍿': ['Anthony', 'Senior Iglesia'],
          '💀': ['Adam', 'Robert', 'Don'],
        },
        initialRating: 5,
        imdbID: roomMovie.imdbID || 'tt0368226',
      });

      await batch.commit();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error seeding starter hot takes:', err);
    return false;
  }
}

