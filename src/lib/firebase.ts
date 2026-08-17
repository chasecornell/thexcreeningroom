import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
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
  getDocFromServer,
  writeBatch,
  query,
  orderBy,
  Firestore,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MovieItem, PersonName, MemberProfile, DEFAULT_MEMBER_PROFILES, ChatMessage, MovieComment } from '../types';
import { STARTER_MOVIES } from '../data/starterMovies';
import { searchMoviesOMDB, getMovieDetailsOMDB } from '../services/omdb';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect to named or default database
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Auth Export
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const MOVIES_COLLECTION = 'movies';
const MEMBERS_COLLECTION = 'members';

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
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline status detected:', error.message);
      return false;
    }
    // Document not existing or any response means connection is live
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
            addedBy: data.addedBy || 'Adam',
            addedAt: data.addedAt || Date.now(),
            ratings: data.ratings || {},
            notes: data.notes || '',
            comments: data.comments || [],
          });
        });
        onUpdate(movies);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        handleFirestoreError(error, OperationType.LIST, MOVIES_COLLECTION);
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
    }, { merge: true });

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
      await updateDoc(docRef, {
        [`ratings.${person}`]: rating,
      });
    } else {
      // Clear rating
      await updateDoc(docRef, {
        [`ratings.${person}`]: deleteField(),
      });
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
 * Find movies with missing posters and fetch metadata from OMDb to fix them.
 */
export async function fixMissingPostersOMDB(): Promise<number> {
  const path = MOVIES_COLLECTION;
  try {
    const moviesRef = collection(db, path);
    const snapshot = await getDocs(moviesRef);
    if (snapshot.empty) return 0;

    let updatedCount = 0;
    // We update individually since API calls might take time
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const needsFix = !data.poster || data.poster === 'N/A' || data.poster.trim() === '' || data.poster.includes('unsplash') || !data.imdbID || data.imdbID === 'N/A' || !data.plot;
      
      let imdbID = data.imdbID;

      // 1. If we already have an imdbID, verify the poster is correct and not a broken/hallucinated URL
      if (imdbID && imdbID !== 'N/A') {
        const details = await getMovieDetailsOMDB(imdbID);
        if (details && details.Poster && details.Poster !== 'N/A' && details.Poster !== data.poster) {
          // Poster mismatch (likely a broken hallucinated URL from seed data) -> fix it!
          await updateDoc(docSnap.ref, {
            poster: details.Poster,
            ...(data.director ? {} : { director: details.Director !== 'N/A' ? details.Director : '' }),
            ...(data.plot ? {} : { plot: details.Plot !== 'N/A' ? details.Plot : '' }),
            ...(data.genre === 'Uncategorized' || !data.genre ? { genre: details.Genre !== 'N/A' ? details.Genre : 'Uncategorized' } : {}),
            ...(data.runtime ? {} : { runtime: details.Runtime !== 'N/A' ? details.Runtime : '' }),
            ...(data.imdbRating ? {} : { imdbRating: details.imdbRating !== 'N/A' ? details.imdbRating : '' }),
            ...(data.releaseDate ? {} : { releaseDate: details.Released !== 'N/A' ? details.Released : '' })
          });
          updatedCount++;
          console.log(`Fixed broken/hallucinated poster for: ${data.title}`);
          continue; // Move to the next movie
        }
      }

      // 2. If it still needs fixing (e.g. no imdbID at all, or missing plot), try searching by title
      if (needsFix && data.title && (!imdbID || imdbID === 'N/A')) {
        console.log(`Searching OMDb to fix: ${data.title}`);
        
        const { movies } = await searchMoviesOMDB(data.title, data.year);
        if (movies && movies.length > 0) {
          imdbID = movies[0].imdbID;
        }
        
        if (imdbID && imdbID !== 'N/A') {
          const details = await getMovieDetailsOMDB(imdbID);
          if (details && details.Poster && details.Poster !== 'N/A') {
            await updateDoc(docSnap.ref, {
              poster: details.Poster,
              imdbID: imdbID,
              ...(data.director ? {} : { director: details.Director !== 'N/A' ? details.Director : '' }),
              ...(data.plot ? {} : { plot: details.Plot !== 'N/A' ? details.Plot : '' }),
              ...(data.genre === 'Uncategorized' || !data.genre ? { genre: details.Genre !== 'N/A' ? details.Genre : 'Uncategorized' } : {}),
              ...(data.runtime ? {} : { runtime: details.Runtime !== 'N/A' ? details.Runtime : '' }),
              ...(data.imdbRating ? {} : { imdbRating: details.imdbRating !== 'N/A' ? details.imdbRating : '' }),
              ...(data.releaseDate ? {} : { releaseDate: details.Released !== 'N/A' ? details.Released : '' })
            });
            updatedCount++;
            console.log(`Updated missing metadata/poster for: ${data.title}`);
          }
        }
      }
    }
    
    return updatedCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
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
          if (!seenNames.has(data.name)) {
            seenNames.add(data.name);
            members.push({ id: docSnap.id, ...data });
          } else {
             // It's a duplicate, we can optionally delete it if we have permission
             deleteDoc(doc(db, MEMBERS_COLLECTION, docSnap.id)).catch(() => {});
          }
        });
        onUpdate(members);
      },
      (error) => {
        console.error('Firestore members subscription error:', error);
        handleFirestoreError(error, OperationType.LIST, MEMBERS_COLLECTION);
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
        console.error('Firestore general chat subscription error:', error);
        handleFirestoreError(error, OperationType.LIST, GENERAL_CHAT_COLLECTION);
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
