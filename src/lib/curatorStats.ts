import { MovieItem, MemberProfile, PersonName } from '../types';

export interface MemberCuratorStats {
  member: MemberProfile;
  name: PersonName;
  uploadedCount: number;
  ratingsReceivedCount: number;
  ratingsReceivedSum: number;
  curatorRating: number | null;
  curatorRatingFormatted: string;
  tierStars: number;
  tierLabel: string;
  tierDescription: string;
  tierColor: string;
  tierBg: string;
  tierBorder: string;
  bestMovie: { movie: MovieItem; avg: number; count: number } | null;
  worstMovie: { movie: MovieItem; avg: number; count: number } | null;
  moviesAdded: Array<{
    movie: MovieItem;
    avgScore: number | null;
    ratingsCount: number;
    othersRatingsCount: number;
    othersAvgScore: number | null;
  }>;
}

export function getCuratorTier(rating: number | null): {
  stars: number;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
} {
  if (rating === null) {
    return {
      stars: 0,
      label: 'Unrated Curator',
      description: 'Upload movies and get reviews from others to receive your rating.',
      color: 'text-zinc-400',
      bg: 'bg-zinc-800/40',
      border: 'border-zinc-700/50',
    };
  }

  if (rating >= 4.5) {
    return {
      stars: 5,
      label: 'Masterpiece Curator',
      description: "Seriously, question your life choices unless you're going to watch their movie picks.",
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/30',
    };
  }
  if (rating >= 3.5) {
    return {
      stars: 4,
      label: 'Very Good Taste',
      description: 'Consistently uploads very good movies.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/30',
    };
  }
  if (rating >= 2.5) {
    return {
      stars: 3,
      label: 'Average Recommender',
      description: "Yes, give their picks a watch but don't expect too much.",
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/30',
    };
  }
  if (rating >= 1.5) {
    return {
      stars: 2,
      label: 'Poor Taste',
      description: 'Watchable if you have absolutely nothing left to do in your life.',
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      border: 'border-orange-400/30',
    };
  }
  return {
    stars: 1,
    label: 'Terrible Taste',
    description: "Absolutely terrible. Don't watch their uploads.",
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  };
}

export function calculateCuratorStats(
  movies: MovieItem[],
  members: MemberProfile[]
): {
  leaderboard: MemberCuratorStats[];
  statsMap: Record<PersonName, MemberCuratorStats>;
  topCurator: MemberCuratorStats | null;
} {
  const statsMap: Record<PersonName, MemberCuratorStats> = {};

  // Initialize for all members
  members.forEach((member) => {
    const tier = getCuratorTier(null);
    statsMap[member.name] = {
      member,
      name: member.name,
      uploadedCount: 0,
      ratingsReceivedCount: 0,
      ratingsReceivedSum: 0,
      curatorRating: null,
      curatorRatingFormatted: '—',
      tierStars: tier.stars,
      tierLabel: tier.label,
      tierDescription: tier.description,
      tierColor: tier.color,
      tierBg: tier.bg,
      tierBorder: tier.border,
      bestMovie: null,
      worstMovie: null,
      moviesAdded: [],
    };
  });

  // Calculate stats for each movie uploaded
  movies.forEach((movie) => {
    let adder = movie.addedBy;
    if (!adder) return;
    
    // Resolve alias if adder is not directly in statsMap
    if (!statsMap[adder]) {
      if ((adder === 'Matt' || adder === 'Matt Tighe') && statsMap['Matt Tighe']) {
        adder = 'Matt Tighe';
      } else if ((adder === 'Matt' || adder === 'Matt Tighe') && statsMap['Matt']) {
        adder = 'Matt';
      }
    }

    if (!adder || !statsMap[adder]) return;

    statsMap[adder].uploadedCount += 1;

    let allSum = 0;
    let allCount = 0;
    let othersSum = 0;
    let othersCount = 0;

    members.forEach((reviewer) => {
      const score = movie.ratings?.[reviewer.name] ?? 
        ((reviewer.name === 'Matt Tighe' || reviewer.shortName === 'Matt') ? movie.ratings?.['Matt'] : undefined) ??
        ((reviewer.name === 'Matt') ? movie.ratings?.['Matt Tighe'] : undefined);

      if (score && score > 0) {
        allSum += score;
        allCount += 1;

        // Rate by others (excluding self-rating if any, or including if reviewer !== adder)
        const isSelfReview = reviewer.name === adder || ((reviewer.name === 'Matt Tighe' || reviewer.shortName === 'Matt') && (adder === 'Matt' || adder === 'Matt Tighe'));
        if (!isSelfReview) {
          othersSum += score;
          othersCount += 1;
          statsMap[adder].ratingsReceivedSum += score;
          statsMap[adder].ratingsReceivedCount += 1;
        }
      }
    });

    const avgScore = allCount > 0 ? allSum / allCount : null;
    const othersAvgScore = othersCount > 0 ? othersSum / othersCount : null;

    statsMap[adder].moviesAdded.push({
      movie,
      avgScore,
      ratingsCount: allCount,
      othersRatingsCount: othersCount,
      othersAvgScore,
    });
  });

  // Finalize averages, best & worst movies, and tiers
  members.forEach((member) => {
    const stat = statsMap[member.name];
    if (!stat) return;

    if (stat.ratingsReceivedCount > 0) {
      const avg = stat.ratingsReceivedSum / stat.ratingsReceivedCount;
      stat.curatorRating = avg;
      stat.curatorRatingFormatted = avg.toFixed(1);
    } else if (stat.moviesAdded.length > 0) {
      // If only self rated or 0 ratings from others
      const ratedMovies = stat.moviesAdded.filter((m) => m.avgScore !== null);
      if (ratedMovies.length > 0) {
        const sum = ratedMovies.reduce((acc, m) => acc + (m.avgScore || 0), 0);
        const avg = sum / ratedMovies.length;
        stat.curatorRating = avg;
        stat.curatorRatingFormatted = avg.toFixed(1);
      }
    }

    const tier = getCuratorTier(stat.curatorRating);
    stat.tierStars = tier.stars;
    stat.tierLabel = tier.label;
    stat.tierDescription = tier.description;
    stat.tierColor = tier.color;
    stat.tierBg = tier.bg;
    stat.tierBorder = tier.border;

    // Find best and worst movies
    const scoredMovies = stat.moviesAdded
      .filter((m) => (m.othersAvgScore !== null && m.othersRatingsCount > 0) || m.avgScore !== null)
      .map((m) => ({
        movie: m.movie,
        avg: m.othersAvgScore !== null ? m.othersAvgScore : (m.avgScore as number),
        count: m.othersRatingsCount > 0 ? m.othersRatingsCount : m.ratingsCount,
      }));

    if (scoredMovies.length > 0) {
      scoredMovies.sort((a, b) => b.avg - a.avg || b.count - a.count);
      stat.bestMovie = scoredMovies[0];
      stat.worstMovie = scoredMovies[scoredMovies.length - 1];
    }
  });

  // Map alias keys so any lookup for 'Matt' or 'Matt Tighe' succeeds
  if (statsMap['Matt Tighe'] && !statsMap['Matt']) {
    statsMap['Matt'] = statsMap['Matt Tighe'];
  } else if (statsMap['Matt'] && !statsMap['Matt Tighe']) {
    statsMap['Matt Tighe'] = statsMap['Matt'];
  }

  // Generate sorted leaderboard strictly from unique curator stats (deduplicating any aliased keys in statsMap)
  const uniqueStats = Array.from(new Set(Object.values(statsMap)));
  const leaderboard = uniqueStats.sort((a, b) => {
    if (a.curatorRating === null && b.curatorRating === null) {
      return b.uploadedCount - a.uploadedCount;
    }
    if (a.curatorRating === null) return 1;
    if (b.curatorRating === null) return -1;
    if (b.curatorRating !== a.curatorRating) {
      return b.curatorRating - a.curatorRating;
    }
    return b.uploadedCount - a.uploadedCount;
  });

  const topCurator = leaderboard.find((c) => c.curatorRating !== null && c.uploadedCount > 0) || null;

  return {
    leaderboard,
    statsMap,
    topCurator,
  };
}
