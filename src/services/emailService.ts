import { MovieItem, MemberProfile, ChatMessage, HotTake, PersonName, WeeklyRoastData, DailyDigestData } from '../types';
import { calculateCuratorStats } from '../lib/curatorStats';

/**
 * Builds the dynamic Weekly Sarcastic Roast data based on current Firestore state
 */
export function buildWeeklyRoastData(
  memberName: PersonName,
  movies: MovieItem[],
  members: MemberProfile[],
  chatMessages: ChatMessage[],
  hotTakes: HotTake[],
  customRoast?: {
    roastHeadline?: string;
    tasteShame?: string;
    slackerRoast?: string;
    spicyQuoteRoast?: string;
    closingZing?: string;
  }
): WeeklyRoastData {
  // 1. Calculate Curator Taste Leaderboard
  const { leaderboard } = calculateCuratorStats(movies, members);
  const topCuratorItem = leaderboard.find((c) => c.curatorRating !== null) || leaderboard[0];
  const bottomCuratorItem = [...leaderboard].reverse().find((c) => c.curatorRating !== null) || leaderboard[leaderboard.length - 1];

  const topCurator = topCuratorItem ? topCuratorItem.member.name : 'Nobody yet';
  const topCuratorScore = topCuratorItem ? topCuratorItem.curatorRating : null;
  const bottomCurator = bottomCuratorItem ? bottomCuratorItem.member.name : 'The Slackers';
  const bottomCuratorScore = bottomCuratorItem ? bottomCuratorItem.curatorRating : null;

  // 2. Find unrated movies for this specific member (up to 10)
  const unratedMovies = movies
    .filter((m) => {
      const userRating =
        m.ratings?.[memberName] ??
        (memberName === 'Matt Tighe' || memberName === 'Matt' ? m.ratings?.['Matt'] ?? m.ratings?.['Matt Tighe'] : undefined);
      return !userRating;
    })
    .slice(0, 10);

  // 3. Recent Hot Take
  const recentHotTake = hotTakes[0];

  // 4. Top spicy chat quote
  const spicyQuotes = chatMessages.filter((m) => m.text.length > 15 && !m.text.includes('Welcome to'));
  const topQuote = spicyQuotes.length > 0 ? { author: spicyQuotes[0].author, text: spicyQuotes[0].text } : undefined;

  // 5. New Features Shipped
  const newFeatures = [
    '⚡ Instant User Rating Column: Your rating column is now pinned front-and-center next to the movie poster on mobile and desktop.',
    '📱 Mobile Responsive Add Modal: Revamped search input geometry so movie queries never get squished.',
    '🔥 Weekly Hot Take Broadcast: One fiery take per curator every 7 days with live emoji fire reactions.',
    '💬 Live Lounge Banter & GIFs: Threaded replies, reactions, and direct Giphy integration.',
    '📧 Automated Email Alerts: Weekly Sunday Sarcastic Roast + Daily 6:00 AM New Movie Watchlist alerts.',
  ];

  return {
    headline:
      customRoast?.roastHeadline ||
      `The Screening Room Weekly Roast: Put Down the Popcorn and Rate Your Movies`,
    tasteShame:
      customRoast?.tasteShame ||
      `${topCurator} is currently lording over the group with a ${topCuratorScore !== null ? topCuratorScore.toFixed(1) : '5.0'}★ Taste Score, while ${bottomCurator} is hovering dangerously close to culinary dumpster status with ${bottomCuratorScore !== null ? bottomCuratorScore.toFixed(1) : '1.0'}★.`,
    slackerRoast:
      customRoast?.slackerRoast ||
      (unratedMovies.length > 0
        ? `You currently have ${unratedMovies.length} unreviewed titles gathering dust. Your peers didn't meticulously curate this library for you to treat it like a passive Netflix queue.`
        : `Miraculously, you've reviewed almost everything in sight. Don't get comfortable — new movies get added every morning.`),
    spicyQuoteRoast:
      customRoast?.spicyQuoteRoast ||
      (topQuote ? `Lounge quote of the week from ${topQuote.author}: "${topQuote.text}"` : undefined),
    closingZing:
      customRoast?.closingZing ||
      `Log your verdicts or surrender your right to complain when we pick a 3-hour foreign drama on movie night. 🍿💀`,
    topCurator,
    topCuratorScore,
    bottomCurator,
    bottomCuratorScore,
    unratedMovies,
    recentHotTake,
    topChatQuote: topQuote,
    newFeatures,
  };
}

/**
 * Builds the Daily 6:00 AM New Movies Digest data
 */
export function buildDailyDigestData(movies: MovieItem[]): DailyDigestData {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Filter movies added within the last 24 hours, or fallback to the 3 most recently added movies
  let recentMovies = movies.filter((m) => now - m.addedAt <= ONE_DAY_MS);
  if (recentMovies.length === 0) {
    recentMovies = movies.slice(0, 3);
  }

  const curatorsActive = Array.from(new Set(recentMovies.map((m) => m.addedBy)));

  const dateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return {
    dateString,
    moviesAdded: recentMovies,
    curatorsActive,
  };
}

/**
 * Generates high-fidelity, inline-styled HTML for the Weekly Sarcastic Roast email
 */
export function renderWeeklyRoastHtml(
  data: WeeklyRoastData,
  recipientName: string = 'Curator',
  appUrl: string = 'https://ai.studio/build'
): string {
  const unratedRowsHtml = data.unratedMovies
    .map(
      (m, idx) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #27272a; vertical-align: top; width: 60px;">
        <img src="${m.poster && m.poster !== 'N/A' ? m.poster : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120'}" 
             alt="${m.title}" 
             style="width: 50px; height: 75px; object-fit: cover; border-radius: 6px; display: block; border: 1px solid #3f3f46;" />
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #27272a; vertical-align: top;">
        <div style="font-size: 15px; font-weight: 700; color: #f4f4f5; margin-bottom: 4px;">
          ${idx + 1}. ${m.title} <span style="color: #a1a1aa; font-size: 13px; font-weight: normal;">(${m.year || 'N/A'})</span>
        </div>
        <div style="font-size: 12px; color: #fbbf24; margin-bottom: 4px;">
          Added by <strong style="color: #f59e0b;">${m.addedBy}</strong> &bull; ${m.genre || 'Cinema'} &bull; ${m.runtime || '90 min'}
        </div>
        <div style="font-size: 12px; color: #9ca3af; line-height: 1.4; max-height: 36px; overflow: hidden;">
          ${m.plot || 'No synopsis provided. Go watch and judge for yourself.'}
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #27272a; vertical-align: middle; text-align: right; width: 110px;">
        <a href="${appUrl}" style="display: inline-block; background-color: #f59e0b; color: #09090b; font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 6px; text-decoration: none;">
          Rate Now ★
        </a>
      </td>
    </tr>
  `
    )
    .join('');

  const featuresHtml = data.newFeatures
    .map(
      (feat) => `
    <li style="margin-bottom: 8px; color: #d4d4d8; font-size: 13px; line-height: 1.5;">
      ${feat}
    </li>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #121215; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 30px;">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #18181b 0%, #09090b 100%); padding: 28px 24px; border-bottom: 2px solid #f59e0b; text-align: center;">
      <div style="display: inline-block; background-color: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fbbf24; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px; border-radius: 20px; margin-bottom: 12px;">
        🎬 THE SCREENING ROOM &bull; 7-DAY ROAST
      </div>
      <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2;">
        ${data.headline}
      </h1>
      <p style="margin: 0; color: #a1a1aa; font-size: 14px;">
        Weekly reckoning for <strong>${recipientName}</strong> and the curator collective.
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 24px;">

      <!-- Taste Board Movement Block -->
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          🏆 Taste Board Shame & Glory
        </div>
        <p style="margin: 0; color: #e4e4e7; font-size: 14px; line-height: 1.5;">
          ${data.tasteShame}
        </p>
      </div>

      <!-- Slacker Callout Block -->
      <div style="background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
          ⚠️ The Slacker Hitlist
        </div>
        <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.5;">
          ${data.slackerRoast}
        </p>
      </div>

      <!-- Unrated Movies Table -->
      ${
        data.unratedMovies.length > 0
          ? `
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 800; color: #ffffff;">
          Top ${data.unratedMovies.length} Movies You Haven't Reviewed Yet:
        </h3>
        <table style="width: 100%; border-collapse: collapse; background-color: #18181b; border-radius: 8px; overflow: hidden; border: 1px solid #27272a;">
          ${unratedRowsHtml}
        </table>
      </div>
      `
          : ''
      }

      <!-- Hot Take / Spicy Banter -->
      ${
        data.recentHotTake
          ? `
      <div style="background-color: #18181b; border-left: 4px solid #f59e0b; padding: 14px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
        <div style="font-size: 11px; font-weight: 800; color: #fbbf24; text-transform: uppercase; margin-bottom: 4px;">
          🔥 Hot Take of the Week &bull; ${data.recentHotTake.author} on "${data.recentHotTake.movieTitle}"
        </div>
        <div style="font-size: 13px; color: #d4d4d8; font-style: italic; line-height: 1.4;">
          "${data.recentHotTake.hotTakeText}"
        </div>
      </div>
      `
          : ''
      }

      <!-- New Features Shipped -->
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
          🚀 What Just Shipped in The Screening Room
        </div>
        <ul style="margin: 0; padding-left: 18px;">
          ${featuresHtml}
        </ul>
      </div>

      <!-- Call to Action -->
      <div style="text-align: center; padding: 12px 0 20px 0;">
        <p style="font-size: 14px; font-weight: 600; color: #f59e0b; margin-bottom: 16px;">
          ${data.closingZing}
        </p>
        <a href="${appUrl}" style="display: inline-block; background-color: #f59e0b; color: #09090b; font-weight: 800; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
          Open The Screening Room &rarr;
        </a>
      </div>

    </div>

    <!-- Footer & Opt-Out -->
    <div style="background-color: #0c0c0e; border-top: 1px solid #27272a; padding: 18px 24px; text-align: center; font-size: 11px; color: #71717a; line-height: 1.5;">
      <p style="margin: 0 0 6px 0;">
        You're receiving this weekly roast because you're a registered curator on The Screening Room.
      </p>
      <p style="margin: 0;">
        <a href="${appUrl}?action=email_settings" style="color: #a1a1aa; text-decoration: underline;">Notification Preferences</a> &bull; 
        <a href="${appUrl}?opt_out=weekly" style="color: #a1a1aa; text-decoration: underline;">Opt out of Weekly Roast</a>
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * Generates high-fidelity HTML for the Daily 6:00 AM New Movies Digest
 */
export function renderDailyDigestHtml(
  data: DailyDigestData,
  recipientName: string = 'Curator',
  appUrl: string = 'https://ai.studio/build'
): string {
  const movieCardsHtml = data.moviesAdded
    .map(
      (m) => `
    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 16px; display: table; width: 100%; box-sizing: border-box;">
      <div style="display: table-cell; width: 80px; vertical-align: top;">
        <img src="${m.poster && m.poster !== 'N/A' ? m.poster : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=160'}" 
             alt="${m.title}" 
             style="width: 70px; height: 105px; object-fit: cover; border-radius: 6px; border: 1px solid #3f3f46; display: block;" />
      </div>
      <div style="display: table-cell; vertical-align: top; padding-left: 14px;">
        <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">
          ${m.title} <span style="font-size: 13px; font-weight: normal; color: #a1a1aa;">(${m.year || 'N/A'})</span>
        </div>
        <div style="font-size: 12px; color: #fbbf24; margin-bottom: 6px; font-weight: 600;">
          Added by <span style="color: #f59e0b;">${m.addedBy}</span> &bull; ${m.genre || 'Uncategorized'} &bull; ${m.runtime || 'N/A'}
        </div>
        <div style="font-size: 12px; color: #9ca3af; line-height: 1.4; margin-bottom: 10px;">
          ${m.plot || 'No synopsis provided yet.'}
        </div>
        <div>
          <a href="${appUrl}" style="display: inline-block; background-color: #f59e0b; color: #09090b; font-weight: 700; font-size: 11px; padding: 5px 12px; border-radius: 6px; text-decoration: none;">
            Rate First &rarr;
          </a>
        </div>
      </div>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily 6:00 AM Watchlist Dispatch</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #121215; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 30px;">
    
    <!-- Header Banner -->
    <div style="background-color: #18181b; padding: 24px; border-bottom: 2px solid #f59e0b; text-align: center;">
      <div style="display: inline-block; background-color: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fbbf24; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 3px 8px; border-radius: 16px; margin-bottom: 8px;">
        🌅 6:00 AM DAILY DISPATCH &bull; ${data.dateString}
      </div>
      <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 900; color: #ffffff;">
        ${data.moviesAdded.length} New ${data.moviesAdded.length === 1 ? 'Movie Added' : 'Movies Added'} to the Watchlist
      </h1>
      <p style="margin: 0; color: #a1a1aa; font-size: 13px;">
        Good morning, <strong>${recipientName}</strong>. Check out what your fellow curators dropped in the queue.
      </p>
    </div>

    <!-- Movie List -->
    <div style="padding: 20px;">
      ${movieCardsHtml}

      <div style="text-align: center; margin-top: 20px;">
        <a href="${appUrl}" style="display: inline-block; background-color: #f59e0b; color: #09090b; font-weight: 800; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
          Open Watchlist in The Screening Room &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #0c0c0e; border-top: 1px solid #27272a; padding: 16px 20px; text-align: center; font-size: 11px; color: #71717a; line-height: 1.5;">
      <p style="margin: 0 0 4px 0;">
        Sent at 6:00 AM daily when new movies are added.
      </p>
      <p style="margin: 0;">
        <a href="${appUrl}?opt_out=daily" style="color: #a1a1aa; text-decoration: underline;">Opt out of Daily 6:00 AM alerts</a> &bull;
        <a href="${appUrl}?action=email_settings" style="color: #a1a1aa; text-decoration: underline;">Manage Preferences</a>
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * Calls server API to generate AI Sarcastic Roast with live stats
 */
export async function fetchAiWeeklyRoast(
  memberName: PersonName,
  topCurator: string,
  bottomCurator: string,
  unratedCount: number,
  recentMovies: MovieItem[],
  hotTakeText?: string,
  chatQuotes: string[] = []
) {
  try {
    const res = await fetch('/api/email/generate-roast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberName,
        topCurator,
        bottomCurator,
        unratedCount,
        recentMovies: recentMovies.map((m) => ({ title: m.title, year: m.year, addedBy: m.addedBy })),
        hotTake: hotTakeText,
        recentQuotes: chatQuotes,
      }),
    });
    if (!res.ok) throw new Error('API request failed');
    return await res.json();
  } catch (err) {
    console.warn('Using client fallback for weekly roast:', err);
    return null;
  }
}

/**
 * Triggers test dispatch API
 */
export async function sendTestEmailDispatch(
  toEmail: string,
  subject: string,
  type: 'daily' | 'weekly',
  memberName: string
) {
  try {
    const res = await fetch('/api/email/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail,
        subject,
        type,
        memberName,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to dispatch email');
    }
    return await res.json();
  } catch (err: any) {
    console.error('Dispatch error:', err);
    throw err;
  }
}
