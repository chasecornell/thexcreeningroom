import { MovieItem, MemberProfile, PersonName } from '../types';

export interface DirectorStat {
  name: string;
  movieCount: number;
  movies: MovieItem[];
  squadAvgRating: number;
  squadRatingCount: number;
  imdbAvgRating: number | null;
}

export interface ActorStat {
  name: string;
  movieCount: number;
  movies: MovieItem[];
  squadAvgRating: number;
  squadRatingCount: number;
  imdbAvgRating: number | null;
}

export interface CuratorSpecialAwards {
  // Worst Suggestor
  worstSuggestor: {
    member: MemberProfile;
    avgScoreReceived: number;
    movieCount: number;
    worstMovieTitle?: string;
  } | null;
  // Most Mainstream Suggestor
  mostMainstreamSuggestor: {
    member: MemberProfile;
    avgImdb: number;
    movieCount: number;
    highestImdbMovie?: string;
  } | null;
  // Obscurity Snob / Indie Hipster
  obscuritySnob: {
    member: MemberProfile;
    avgImdb: number;
    movieCount: number;
    lowestImdbMovie?: string;
  } | null;
  // The Rogue Agent (highest deviation from squad consensus)
  rogueCritic: {
    member: MemberProfile;
    avgDivergence: number;
    ratedCount: number;
  } | null;
  // The Grinch (lowest personal avg score given)
  toughestCritic: {
    member: MemberProfile;
    avgScoreGiven: number;
    ratedCount: number;
  } | null;
  // The Generous Benefactor (highest personal avg score given)
  generousCritic: {
    member: MemberProfile;
    avgScoreGiven: number;
    ratedCount: number;
  } | null;
  // Self-Bias Index (narcissist rating own movies higher than others)
  selfBiasLeader: {
    member: MemberProfile;
    biasDelta: number; // selfAvg - othersAvg
    selfAvg: number;
    othersAvg: number;
  } | null;
}

export interface CuratorPairSimilarity {
  memberA: MemberProfile;
  memberB: MemberProfile;
  sharedCount: number;
  avgDivergence: number; // 0 = exact agreement, 4 = max disagreement
  agreementPct: number; // 100% = identical ratings
}

export interface AdvancedStatsResult {
  awards: CuratorSpecialAwards;
  topDirectors: DirectorStat[];
  worstDirectors: DirectorStat[];
  topActors: ActorStat[];
  worstActors: ActorStat[];
  mostFrequentActors: ActorStat[];
  mostFrequentDirectors: DirectorStat[];
  tasteTwins: CuratorPairSimilarity | null;
  mortalEnemies: CuratorPairSimilarity | null;
  pairSimilarities: CuratorPairSimilarity[];
}

/**
 * Calculates fun, challenging, and insightful advanced statistics from the movie catalog and ratings.
 */
export function calculateAdvancedStats(
  movies: MovieItem[],
  members: MemberProfile[]
): AdvancedStatsResult {
  // 1. Map Member Profile lookups and alias handling
  const memberMap: Record<string, MemberProfile> = {};
  members.forEach((m) => {
    memberMap[m.name] = m;
    if (m.shortName) memberMap[m.shortName] = m;
    if (m.name === 'Matt Tighe') memberMap['Matt'] = m;
  });

  const getMember = (name: string): MemberProfile | undefined => {
    return (
      memberMap[name] ||
      (name === 'Matt' ? memberMap['Matt Tighe'] : undefined) ||
      (name === 'Matt Tighe' ? memberMap['Matt'] : undefined)
    );
  };

  // Helper to extract a member's rating on a movie
  const getRating = (movie: MovieItem, memberName: string): number | undefined => {
    if (!movie.ratings) return undefined;
    const r = movie.ratings[memberName as PersonName];
    if (r !== undefined && r > 0) return r;
    if (memberName === 'Matt Tighe' || memberName === 'Matt') {
      const r2 = movie.ratings['Matt'] ?? movie.ratings['Matt Tighe'];
      if (r2 !== undefined && r2 > 0) return r2;
    }
    return undefined;
  };

  // Precompute average squad score on each movie
  const movieSquadAverages = new Map<string, { avg: number; count: number }>();
  movies.forEach((m) => {
    let sum = 0;
    let count = 0;
    members.forEach((mem) => {
      const r = getRating(m, mem.name);
      if (r !== undefined) {
        sum += r;
        count += 1;
      }
    });
    if (count > 0) {
      movieSquadAverages.set(m.id, { avg: sum / count, count });
    }
  });

  // --- A. CURATOR SPECIAL AWARDS ---
  interface CuratorAccumulator {
    member: MemberProfile;
    uploadedMovies: MovieItem[];
    receivedRatingsSum: number;
    receivedRatingsCount: number;
    givenRatingsSum: number;
    givenRatingsCount: number;
    selfRatingsSum: number;
    selfRatingsCount: number;
    othersUploadedRatingsSum: number;
    othersUploadedRatingsCount: number;
    divergenceSum: number;
    divergenceCount: number;
    imdbSum: number;
    imdbCount: number;
  }

  const curatorAcc: Record<string, CuratorAccumulator> = {};
  members.forEach((m) => {
    curatorAcc[m.name] = {
      member: m,
      uploadedMovies: [],
      receivedRatingsSum: 0,
      receivedRatingsCount: 0,
      givenRatingsSum: 0,
      givenRatingsCount: 0,
      selfRatingsSum: 0,
      selfRatingsCount: 0,
      othersUploadedRatingsSum: 0,
      othersUploadedRatingsCount: 0,
      divergenceSum: 0,
      divergenceCount: 0,
      imdbSum: 0,
      imdbCount: 0,
    };
  });

  movies.forEach((m) => {
    const adderMember = getMember(m.addedBy);
    const adderKey = adderMember?.name;

    // Track uploaded movies & IMDb rating
    if (adderKey && curatorAcc[adderKey]) {
      curatorAcc[adderKey].uploadedMovies.push(m);
      const imdbNum = m.imdbRating && m.imdbRating !== 'N/A' ? parseFloat(m.imdbRating) : null;
      if (imdbNum !== null && !isNaN(imdbNum) && imdbNum > 0) {
        curatorAcc[adderKey].imdbSum += imdbNum;
        curatorAcc[adderKey].imdbCount += 1;
      }
    }

    const squadMeta = movieSquadAverages.get(m.id);

    // Track given and received ratings
    members.forEach((reviewer) => {
      const r = getRating(m, reviewer.name);
      if (r !== undefined) {
        const revAcc = curatorAcc[reviewer.name];
        if (revAcc) {
          revAcc.givenRatingsSum += r;
          revAcc.givenRatingsCount += 1;

          // Self vs Others uploaded rating
          const isOwnMovie = adderKey === reviewer.name;
          if (isOwnMovie) {
            revAcc.selfRatingsSum += r;
            revAcc.selfRatingsCount += 1;
          } else {
            revAcc.othersUploadedRatingsSum += r;
            revAcc.othersUploadedRatingsCount += 1;
          }

          // Divergence from squad consensus (only for movies with 2+ reviews)
          if (squadMeta && squadMeta.count >= 2) {
            const diff = Math.abs(r - squadMeta.avg);
            revAcc.divergenceSum += diff;
            revAcc.divergenceCount += 1;
          }
        }

        // Add to adder's received score if it's from another person
        if (adderKey && adderKey !== reviewer.name && curatorAcc[adderKey]) {
          curatorAcc[adderKey].receivedRatingsSum += r;
          curatorAcc[adderKey].receivedRatingsCount += 1;
        }
      }
    });
  });

  // Calculate Worst Suggestor (lowest average score received on their picks)
  const suggestorCandidates = Object.values(curatorAcc).filter(
    (c) => c.uploadedMovies.length >= 1 && c.receivedRatingsCount >= 2
  );

  let worstSuggestor: CuratorSpecialAwards['worstSuggestor'] = null;
  if (suggestorCandidates.length > 0) {
    const sortedWorst = [...suggestorCandidates].sort(
      (a, b) =>
        a.receivedRatingsSum / a.receivedRatingsCount -
        b.receivedRatingsSum / b.receivedRatingsCount
    );
    const worst = sortedWorst[0];
    const avg = worst.receivedRatingsSum / worst.receivedRatingsCount;

    // Find lowest rated movie by this suggestor
    let lowestMovieTitle: string | undefined;
    let lowestMovieScore = 999;
    worst.uploadedMovies.forEach((m) => {
      const meta = movieSquadAverages.get(m.id);
      if (meta && meta.avg < lowestMovieScore) {
        lowestMovieScore = meta.avg;
        lowestMovieTitle = `${m.title} (★${meta.avg.toFixed(1)})`;
      }
    });

    worstSuggestor = {
      member: worst.member,
      avgScoreReceived: avg,
      movieCount: worst.uploadedMovies.length,
      worstMovieTitle: lowestMovieTitle,
    };
  }

  // Calculate Most Mainstream & Obscurity Snob (IMDb average of uploaded picks)
  const imdbCandidates = Object.values(curatorAcc).filter((c) => c.imdbCount >= 1);

  let mostMainstreamSuggestor: CuratorSpecialAwards['mostMainstreamSuggestor'] = null;
  let obscuritySnob: CuratorSpecialAwards['obscuritySnob'] = null;

  if (imdbCandidates.length > 0) {
    const sortedMainstream = [...imdbCandidates].sort(
      (a, b) => b.imdbSum / b.imdbCount - a.imdbSum / a.imdbCount
    );
    const mostMainstream = sortedMainstream[0];
    const leastMainstream = sortedMainstream[sortedMainstream.length - 1];

    let highestTitle: string | undefined;
    let highestImdb = -1;
    mostMainstream.uploadedMovies.forEach((m) => {
      const val = parseFloat(m.imdbRating || '0');
      if (val > highestImdb) {
        highestImdb = val;
        highestTitle = `${m.title} (${m.imdbRating} IMDb)`;
      }
    });

    mostMainstreamSuggestor = {
      member: mostMainstream.member,
      avgImdb: mostMainstream.imdbSum / mostMainstream.imdbCount,
      movieCount: mostMainstream.uploadedMovies.length,
      highestImdbMovie: highestTitle,
    };

    let lowestTitle: string | undefined;
    let lowestImdb = 999;
    leastMainstream.uploadedMovies.forEach((m) => {
      const val = parseFloat(m.imdbRating || '999');
      if (val < lowestImdb && val > 0) {
        lowestImdb = val;
        lowestTitle = `${m.title} (${m.imdbRating} IMDb)`;
      }
    });

    obscuritySnob = {
      member: leastMainstream.member,
      avgImdb: leastMainstream.imdbSum / leastMainstream.imdbCount,
      movieCount: leastMainstream.uploadedMovies.length,
      lowestImdbMovie: lowestTitle,
    };
  }

  // Calculate The Rogue Agent (highest average divergence)
  const divergenceCandidates = Object.values(curatorAcc).filter((c) => c.divergenceCount >= 2);
  let rogueCritic: CuratorSpecialAwards['rogueCritic'] = null;
  if (divergenceCandidates.length > 0) {
    divergenceCandidates.sort(
      (a, b) => b.divergenceSum / b.divergenceCount - a.divergenceSum / a.divergenceCount
    );
    const topDivergent = divergenceCandidates[0];
    rogueCritic = {
      member: topDivergent.member,
      avgDivergence: topDivergent.divergenceSum / topDivergent.divergenceCount,
      ratedCount: topDivergent.divergenceCount,
    };
  }

  // Calculate Toughest (Grinch) & Most Generous Critics
  const ratingGivenCandidates = Object.values(curatorAcc).filter((c) => c.givenRatingsCount >= 2);
  let toughestCritic: CuratorSpecialAwards['toughestCritic'] = null;
  let generousCritic: CuratorSpecialAwards['generousCritic'] = null;

  if (ratingGivenCandidates.length > 0) {
    const sortedGiven = [...ratingGivenCandidates].sort(
      (a, b) => a.givenRatingsSum / a.givenRatingsCount - b.givenRatingsSum / b.givenRatingsCount
    );
    const toughest = sortedGiven[0];
    const generous = sortedGiven[sortedGiven.length - 1];

    toughestCritic = {
      member: toughest.member,
      avgScoreGiven: toughest.givenRatingsSum / toughest.givenRatingsCount,
      ratedCount: toughest.givenRatingsCount,
    };

    generousCritic = {
      member: generous.member,
      avgScoreGiven: generous.givenRatingsSum / generous.givenRatingsCount,
      ratedCount: generous.givenRatingsCount,
    };
  }

  // Calculate Self-Bias Leader
  const biasCandidates = Object.values(curatorAcc).filter(
    (c) => c.selfRatingsCount >= 1 && c.othersUploadedRatingsCount >= 2
  );
  let selfBiasLeader: CuratorSpecialAwards['selfBiasLeader'] = null;
  if (biasCandidates.length > 0) {
    const biasList = biasCandidates.map((c) => {
      const selfAvg = c.selfRatingsSum / c.selfRatingsCount;
      const othersAvg = c.othersUploadedRatingsSum / c.othersUploadedRatingsCount;
      return {
        member: c.member,
        selfAvg,
        othersAvg,
        delta: selfAvg - othersAvg,
      };
    });

    biasList.sort((a, b) => b.delta - a.delta);
    const topBias = biasList[0];
    if (topBias.delta > 0) {
      selfBiasLeader = {
        member: topBias.member,
        biasDelta: topBias.delta,
        selfAvg: topBias.selfAvg,
        othersAvg: topBias.othersAvg,
      };
    }
  }

  const awards: CuratorSpecialAwards = {
    worstSuggestor,
    mostMainstreamSuggestor,
    obscuritySnob,
    rogueCritic,
    toughestCritic,
    generousCritic,
    selfBiasLeader,
  };

  // --- B. DIRECTOR RANKINGS ---
  const directorMap: Record<
    string,
    { movies: MovieItem[]; squadRatings: number[]; imdbRatings: number[] }
  > = {};

  movies.forEach((m) => {
    if (!m.director || m.director === 'N/A') return;
    // Split directors by comma
    const rawDirectors = m.director.split(',').map((d) => d.trim()).filter((d) => d.length > 1);

    rawDirectors.forEach((dirName) => {
      if (!directorMap[dirName]) {
        directorMap[dirName] = { movies: [], squadRatings: [], imdbRatings: [] };
      }
      directorMap[dirName].movies.push(m);

      // Collect all squad reviews for this movie
      members.forEach((mem) => {
        const r = getRating(m, mem.name);
        if (r !== undefined) {
          directorMap[dirName].squadRatings.push(r);
        }
      });

      const imdbNum = m.imdbRating && m.imdbRating !== 'N/A' ? parseFloat(m.imdbRating) : null;
      if (imdbNum !== null && !isNaN(imdbNum)) {
        directorMap[dirName].imdbRatings.push(imdbNum);
      }
    });
  });

  const allDirectors: DirectorStat[] = Object.entries(directorMap)
    .filter(([, data]) => data.squadRatings.length >= 1)
    .map(([name, data]) => {
      const sum = data.squadRatings.reduce((a, b) => a + b, 0);
      const squadAvg = sum / data.squadRatings.length;
      const imdbAvg =
        data.imdbRatings.length > 0
          ? data.imdbRatings.reduce((a, b) => a + b, 0) / data.imdbRatings.length
          : null;
      return {
        name,
        movieCount: data.movies.length,
        movies: data.movies,
        squadAvgRating: squadAvg,
        squadRatingCount: data.squadRatings.length,
        imdbAvgRating: imdbAvg,
      };
    });

  // Sort best directors (prioritize higher average, then more rating count)
  const sortedDirectors = [...allDirectors].sort((a, b) => {
    if (b.squadAvgRating !== a.squadAvgRating) {
      return b.squadAvgRating - a.squadAvgRating;
    }
    return b.squadRatingCount - a.squadRatingCount;
  });

  const topDirectors = sortedDirectors.slice(0, 10);
  const worstDirectors = [...sortedDirectors].reverse().slice(0, 10);
  const mostFrequentDirectors = [...allDirectors]
    .sort((a, b) => b.movieCount - a.movieCount || b.squadAvgRating - a.squadAvgRating)
    .slice(0, 10);

  // --- C. ACTOR RANKINGS ---
  const actorMap: Record<
    string,
    { movies: MovieItem[]; squadRatings: number[]; imdbRatings: number[] }
  > = {};

  movies.forEach((m) => {
    if (!m.actors || m.actors === 'N/A') return;
    const rawActors = m.actors.split(',').map((a) => a.trim()).filter((a) => a.length > 1);

    rawActors.forEach((actName) => {
      if (!actorMap[actName]) {
        actorMap[actName] = { movies: [], squadRatings: [], imdbRatings: [] };
      }
      actorMap[actName].movies.push(m);

      // Collect all squad reviews for this movie
      members.forEach((mem) => {
        const r = getRating(m, mem.name);
        if (r !== undefined) {
          actorMap[actName].squadRatings.push(r);
        }
      });

      const imdbNum = m.imdbRating && m.imdbRating !== 'N/A' ? parseFloat(m.imdbRating) : null;
      if (imdbNum !== null && !isNaN(imdbNum)) {
        actorMap[actName].imdbRatings.push(imdbNum);
      }
    });
  });

  const allActors: ActorStat[] = Object.entries(actorMap)
    .filter(([, data]) => data.squadRatings.length >= 1)
    .map(([name, data]) => {
      const sum = data.squadRatings.reduce((a, b) => a + b, 0);
      const squadAvg = sum / data.squadRatings.length;
      const imdbAvg =
        data.imdbRatings.length > 0
          ? data.imdbRatings.reduce((a, b) => a + b, 0) / data.imdbRatings.length
          : null;
      return {
        name,
        movieCount: data.movies.length,
        movies: data.movies,
        squadAvgRating: squadAvg,
        squadRatingCount: data.squadRatings.length,
        imdbAvgRating: imdbAvg,
      };
    });

  const sortedActors = [...allActors].sort((a, b) => {
    if (b.squadAvgRating !== a.squadAvgRating) {
      return b.squadAvgRating - a.squadAvgRating;
    }
    return b.squadRatingCount - a.squadRatingCount;
  });

  const topActors = sortedActors.slice(0, 10);
  const worstActors = [...sortedActors].reverse().slice(0, 10);
  const mostFrequentActors = [...allActors]
    .sort((a, b) => b.movieCount - a.movieCount || b.squadAvgRating - a.squadAvgRating)
    .slice(0, 10);

  // --- D. CURATOR RIVALRIES & TASTE TWINS MATRIX ---
  const pairSimilarities: CuratorPairSimilarity[] = [];

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const memA = members[i];
      const memB = members[j];

      let diffSum = 0;
      let sharedCount = 0;

      movies.forEach((m) => {
        const ratingA = getRating(m, memA.name);
        const ratingB = getRating(m, memB.name);

        if (ratingA !== undefined && ratingB !== undefined) {
          diffSum += Math.abs(ratingA - ratingB);
          sharedCount += 1;
        }
      });

      if (sharedCount >= 1) {
        const avgDivergence = diffSum / sharedCount;
        // Maximum divergence on a 1-5 scale is 4.0
        const agreementPct = Math.max(0, Math.round((1 - avgDivergence / 4.0) * 100));

        pairSimilarities.push({
          memberA: memA,
          memberB: memB,
          sharedCount,
          avgDivergence,
          agreementPct,
        });
      }
    }
  }

  // Sort pairs by agreement
  pairSimilarities.sort((a, b) => b.agreementPct - a.agreementPct);

  const tasteTwins = pairSimilarities.length > 0 ? pairSimilarities[0] : null;
  const mortalEnemies =
    pairSimilarities.length > 0 ? pairSimilarities[pairSimilarities.length - 1] : null;

  return {
    awards,
    topDirectors,
    worstDirectors,
    topActors,
    worstActors,
    mostFrequentActors,
    mostFrequentDirectors,
    tasteTwins,
    mortalEnemies,
    pairSimilarities,
  };
}
