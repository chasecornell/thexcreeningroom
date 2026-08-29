import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = 3000;

// Lazy initialization for Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (
    !aiClient &&
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  ) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'The Screening Room Email Engine', timestamp: Date.now() });
  });

  // AI-powered Sarcastic Weekly Roast Text Generator endpoint
  app.post('/api/email/generate-roast', async (req, res) => {
    try {
      const {
        memberName = 'Curator',
        topCurator = 'Nobody yet',
        bottomCurator = 'The Slackers',
        unratedCount = 5,
        recentMovies = [],
        hotTake = '',
        recentQuotes = [],
      } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        // High quality sarcastic fallback if API key is not configured
        return res.json({
          roastHeadline: `Brace Yourselves: Another Week of Questionable Taste & Slacking`,
          tasteShame: `${topCurator} is currently sitting on the cinematic high horse, while ${bottomCurator} is giving 5 stars to direct-to-DVD nonsense.`,
          slackerRoast: `You have ${unratedCount} unwatched or unrated movies rotting in the queue. Your fellow curators didn't log their ratings for you to sit there like a casual.`,
          spicyQuoteRoast: recentQuotes.length > 0 ? `Lounge quote of shame: "${recentQuotes[0]}"` : 'The lounge was eerily quiet — probably because everyone was recovering from terrible movie picks.',
          closingZing: `Log your ratings today or forfeit your right to complain at the next movie night. 🍿💀`,
        });
      }

      const prompt = `You are the witty, sarcastic, slightly punk, sharp-tongued editorial voice of "The Screening Room", an exclusive private movie rating group for cinephiles.
Generate a punchy, hilarious, sarcastic weekly email recap section that roasts the group members, motivates engagement, and shames slackers with loving sarcasm.

Context stats for the past 7 days:
- User receiving this email: ${memberName}
- Current Top Rated Curator: ${topCurator}
- Lowest Rated / Biggest Slacker: ${bottomCurator}
- Number of movies ${memberName} hasn't reviewed yet: ${unratedCount}
- Recent movies added/reviewed: ${JSON.stringify(recentMovies.slice(0, 5))}
- Recent Hot Take: ${hotTake || 'None yet, people are being cowards'}
- Spicy chat quotes: ${JSON.stringify(recentQuotes.slice(0, 3))}

Return a valid JSON object with the following keys:
{
  "roastHeadline": "A catchy, sarcastic 6-10 word headline for this week's email",
  "tasteShame": "2-3 sarcastic sentences about the curator leaderboard movements, praising the top curator with backhanded compliments and mocking the bottom curator's dreadful cinematic choices",
  "slackerRoast": "2-3 direct sentences shaming the recipient for having unreviewed movies and demanding they log their ratings immediately",
  "spicyQuoteRoast": "A quick 1-2 sentence jab at the recent hot takes or lounge banter",
  "closingZing": "A hilarious, edgy call to action sign-off (e.g. 'Get off Letterboxd and rate here, you cowards')"
}`;

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.9,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timed out')), 6000)
      );

      const response = (await Promise.race([aiPromise, timeoutPromise])) as any;
      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      res.json(parsed);
    } catch (error: any) {
      console.warn('AI roast generation notice (using rich template):', error.message || error);
      res.json({
        roastHeadline: 'Another 7 Days of Cinematic Turmoil & Freeloading',
        tasteShame: 'The leaderboard is in shambles and nobody agrees on what constitutes real cinema.',
        slackerRoast: 'There are movies waiting for your verdict. Stop lurking and start rating.',
        closingZing: 'Rate your movies or be forever classified as a popcorn casual. 🍿💀',
      });
    }
  });

  // Dispatch / send test email simulation endpoint
  app.post('/api/email/send-test', async (req, res) => {
    try {
      const { toEmail, subject, type, memberName } = req.body;

      if (!toEmail) {
        return res.status(400).json({ error: 'Recipient email is required' });
      }

      console.log(`[EMAIL DISPATCH] [${type?.toUpperCase() || 'TEST'}] Sending to ${toEmail} (${memberName || 'User'}): "${subject}"`);

      // Simulated successful dispatch with tracking ID
      const dispatchId = `dispatch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      res.json({
        success: true,
        dispatchId,
        recipient: toEmail,
        subject,
        timestamp: new Date().toISOString(),
        message: `Successfully queued ${type === 'daily' ? 'Daily 6:00 AM Watchlist Dispatch' : 'Weekly Sarcastic Roast'} to ${toEmail}`,
      });
    } catch (error: any) {
      console.error('Error dispatching test email:', error);
      res.status(500).json({ error: error.message || 'Failed to dispatch email' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`The Screening Room server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
