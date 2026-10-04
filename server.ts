import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // In-memory cache for API requests
  const apiCache = new Map<string, { timestamp: number; data: any }>();
  const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  // Fallback: iTunes Apple Music API
  async function fetchFromITunes(term: string, country: string = 'IN') {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=25&country=${country}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'MRTune/2.0' } });
      if (!res.ok) return [];
      const json: any = await res.json();
      if (!json.results) return [];
      return json.results.map((r: any) => ({
        id: String(r.trackId),
        title: r.trackName,
        uploaderName: r.artistName,
        duration: Math.round((r.trackTimeMillis || 180000) / 1000),
        thumbnail: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '600x600bb') : '',
        previewUrl: r.previewUrl,
        source: 'itunes',
        type: 'track',
      }));
    } catch {
      return [];
    }
  }

  // Search API Proxy & Provider with Multi-Source Fallback
  app.get('/api/search', async (req: Request, res: Response) => {
    const cacheKey = req.originalUrl || req.url;
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const source = typeof req.query.source === 'string' ? req.query.source : 'all';

    try {
      const remoteUrl = new URL('https://pawtify-meow.vercel.app/api/search');
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string' && key !== 'source') {
          remoteUrl.searchParams.set(key, value);
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const upstreamRes = await fetch(remoteUrl.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (upstreamRes.ok) {
        const data = await upstreamRes.json();
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          apiCache.set(cacheKey, { timestamp: Date.now(), data });
          return res.json(data);
        }
      }

      // If upstream is empty or failed, try secondary source (iTunes)
      const countryCode = source === 'international' ? 'US' : 'IN';
      const itunesItems = await fetchFromITunes(query || 'Top Hits', countryCode);
      if (itunesItems.length > 0) {
        const payload = { items: itunesItems, source: 'itunes' };
        apiCache.set(cacheKey, { timestamp: Date.now(), data: payload });
        return res.json(payload);
      }

      return res.json({ items: [] });
    } catch (err: any) {
      console.warn('Primary /api/search failed, trying secondary source:', err?.message || err);
      try {
        const countryCode = source === 'international' ? 'US' : 'IN';
        const itunesItems = await fetchFromITunes(query || 'Top Hits', countryCode);
        return res.json({ items: itunesItems, source: 'itunes' });
      } catch {
        return res.json({ items: [] });
      }
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'pawtify-engine' });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pawtify server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
