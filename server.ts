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

  // Search API Proxy & Provider
  app.get('/api/search', async (req: Request, res: Response) => {
    const cacheKey = req.originalUrl || req.url;
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    try {
      const remoteUrl = new URL('https://pawtify-meow.vercel.app/api/search');
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          remoteUrl.searchParams.set(key, value);
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

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
        apiCache.set(cacheKey, { timestamp: Date.now(), data });
        return res.json(data);
      } else {
        const status = upstreamRes.status;
        const errText = await upstreamRes.text();
        console.warn(`Upstream /api/search responded with ${status}: ${errText.slice(0, 100)}`);
        return res.status(status).json({ items: [], error: 'Upstream error' });
      }
    } catch (err: any) {
      console.error('Error fetching upstream /api/search:', err?.message || err);
      // Return graceful empty items to prevent client crash
      return res.json({ items: [] });
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
