import type { Request, Response } from 'express';
import YTMusic from 'ytmusic-api';

const ytmusic = new YTMusic();
let isYtMusicInitialized = false;
let ytMusicInitPromise: Promise<void> | null = null;

// In-memory stream and search resolution cache to fix stream stalls/timeouts
const resolutionCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache

// Shared HTTP headers matching modern YouTube Music web client to prevent 403 errors
const SHARED_CLIENT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'X-YouTube-Client-Name': '67',
  'X-YouTube-Client-Version': '1.20241001.01.00',
};

export async function initYtMusic(): Promise<void> {
  if (isYtMusicInitialized) return;
  if (!ytMusicInitPromise) {
    ytMusicInitPromise = ytmusic
      .initialize({ GL: 'IN' })
      .then(() => {
        isYtMusicInitialized = true;
        console.log('YouTube Music API initialized successfully');
      })
      .catch((e: any) => {
        ytMusicInitPromise = null;
        console.error('Failed to initialize YouTube Music API:', e?.message || e);
      });
  }
  return ytMusicInitPromise;
}

// Pre-initialize on module load
initYtMusic();

function formatDurationString(seconds: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 4500, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

export async function searchHandler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawQuery =
    (typeof req.query.q === 'string' ? req.query.q : '') ||
    (req.url ? new URL(req.url, 'http://localhost').searchParams.get('q') : '') ||
    '';
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';

  const rawType =
    (typeof req.query.type === 'string' ? req.query.type : '') ||
    (req.url ? new URL(req.url, 'http://localhost').searchParams.get('type') : '') ||
    'songs';
  const type = rawType.toLowerCase();

  if (!query) {
    return res.status(200).json({ items: [] });
  }

  const cacheKey = `${type}:${query.toLowerCase()}`;
  const cached = resolutionCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return res.status(200).json(cached.data);
  }

  await initYtMusic();

  try {
    let items: any[] = [];

    if (type === 'song' || type === 'track' || type === 'song_details') {
      if (!/^[a-zA-Z0-9_-]{11}$/.test(query)) {
        return res.status(400).json({ error: 'Invalid song ID format', item: null, items: [] });
      }

      let songObj: any = null;
      try {
        const item: any = await ytmusic.getSong(query);
        if (item && (item.videoId || item.name)) {
          const durationSec = item.duration || 0;
          const uploader = Array.isArray(item.artist)
            ? item.artist.map((a: any) => a.name || a).join(', ')
            : item.artist?.name || item.artist || 'Unknown Artist';
          const thumb =
            item.thumbnails?.[item.thumbnails.length - 1]?.url ||
            `https://i.ytimg.com/vi/${item.videoId || query}/hqdefault.jpg`;

          songObj = {
            id: item.videoId || query,
            title: item.name || 'Unknown Title',
            uploaderName: uploader,
            thumbnail: thumb,
            duration: durationSec,
            durationString: formatDurationString(durationSec),
            resultType: 'song',
            isVerified: true,
            isOfficialArtist: true,
            isTopic: true,
            tags: ['official release'],
          };
        }
      } catch (_) {
        // Fallback to getVideo
        try {
          const vItem: any = await ytmusic.getVideo(query);
          if (vItem && (vItem.videoId || vItem.name)) {
            const durationSec = vItem.duration || 0;
            const uploader = Array.isArray(vItem.artist)
              ? vItem.artist.map((a: any) => a.name || a).join(', ')
              : vItem.artist?.name || vItem.artist || vItem.author || 'Unknown Artist';
            const thumb =
              vItem.thumbnails?.[vItem.thumbnails.length - 1]?.url ||
              `https://i.ytimg.com/vi/${vItem.videoId || query}/hqdefault.jpg`;

            songObj = {
              id: vItem.videoId || query,
              title: vItem.name || vItem.title || 'Unknown Title',
              uploaderName: uploader,
              thumbnail: thumb,
              duration: durationSec,
              durationString: formatDurationString(durationSec),
              resultType: 'song',
              isVerified: true,
              isOfficialArtist: true,
              isTopic: true,
              tags: ['official release'],
            };
          }
        } catch (_) {}
      }

      if (!songObj) {
        // Fallback: search songs for the ID
        const searchResults: any = await ytmusic.searchSongs(query).catch(() => []);
        if (searchResults && searchResults.length > 0) {
          const match = searchResults.find((s: any) => s.videoId === query) || searchResults[0];
          const durationSec = match.duration || 0;
          const uploader = Array.isArray(match.artist)
            ? match.artist.map((a: any) => a.name || a).join(', ')
            : match.artist?.name || match.artist || 'Unknown Artist';
          const thumb =
            match.thumbnails?.[match.thumbnails.length - 1]?.url ||
            `https://i.ytimg.com/vi/${query}/hqdefault.jpg`;

          songObj = {
            id: match.videoId || query,
            title: match.name || 'Unknown Title',
            uploaderName: uploader,
            thumbnail: thumb,
            duration: durationSec,
            durationString: formatDurationString(durationSec),
            resultType: 'song',
            isVerified: true,
            isOfficialArtist: true,
            isTopic: true,
            tags: ['official release'],
          };
        }
      }

      // Safe fallback if still null but valid query ID
      if (!songObj && /^[a-zA-Z0-9_-]{11}$/.test(query)) {
        songObj = {
          id: query,
          title: 'Track ' + query,
          uploaderName: 'YouTube Music',
          thumbnail: `https://i.ytimg.com/vi/${query}/hqdefault.jpg`,
          duration: 0,
          durationString: '',
          resultType: 'song',
          isVerified: true,
          isOfficialArtist: false,
          isTopic: false,
          tags: ['official release'],
        };
      }

      return res.status(200).json({
        item: songObj,
        items: songObj ? [songObj] : [],
      });
    } else if (type === 'suggestions') {
      const results = await ytmusic.getSearchSuggestions(query).catch(() => []);
      return res.status(200).json({ items: results });
    } else if (type === 'playlist_videos') {
      const results: any = await ytmusic.getPlaylistVideos(query).catch(() => []);
      items = (results || [])
        .map((item: any) => {
          const durationSec = item.duration || 0;
          return {
            id: item.videoId,
            title: item.name || 'Unknown Title',
            uploaderName: Array.isArray(item.artist)
              ? item.artist.map((a: any) => a.name || a).join(', ')
              : item.artist?.name || item.artist || 'Unknown Artist',
            thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
            duration: durationSec,
            durationString: formatDurationString(durationSec),
            resultType: 'song',
            isVerified: true,
            isOfficialArtist: true,
            isTopic: true,
            tags: ['official release'],
          };
        })
        .filter((i: any) => i.id);
    } else if (type === 'playlists') {
      const results: any = await ytmusic.searchPlaylists(query).catch(() => []);
      items = (results || [])
        .map((item: any) => ({
          id: item.playlistId,
          title: item.name || 'Unknown Playlist',
          uploaderName: Array.isArray(item.artist)
            ? item.artist.map((a: any) => a.name || a).join(', ')
            : item.artist?.name || item.artist || 'Various Artists',
          thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
          resultType: 'playlist',
        }))
        .filter((i: any) => i.id);
    } else if (type === 'artists') {
      const results: any = await ytmusic.searchArtists(query).catch(() => []);
      items = (results || [])
        .map((item: any) => ({
          id: item.artistId,
          title: item.name || 'Unknown Artist',
          thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
          resultType: 'artist',
        }))
        .filter((i: any) => i.id);
    } else {
      // Default: searchSongs
      const results: any = await ytmusic.searchSongs(query).catch(() => []);
      items = (results || [])
        .map((item: any) => {
          const durationSec = item.duration || 0;
          return {
            id: item.videoId,
            title: item.name || 'Unknown Title',
            uploaderName: Array.isArray(item.artist)
              ? item.artist.map((a: any) => a.name || a).join(', ')
              : item.artist?.name || item.artist || 'Unknown Artist',
            thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
            duration: durationSec,
            durationString: formatDurationString(durationSec),
            resultType: 'song',
            isVerified: true,
            isOfficialArtist: true,
            isTopic: true,
            tags: ['official release'],
          };
        })
        .filter((i: any) => i.id);
    }

    const responseData = { items };
    resolutionCache.set(cacheKey, { data: responseData, expiry: Date.now() + CACHE_TTL_MS });
    return res.status(200).json(responseData);
  } catch (e: any) {
    console.error('YouTube Music Search error:', e?.message || e);
    // Remote proxy fallback if ytmusic-api had a transient network failure
    try {
      const remoteRes = await fetch(
        `https://pawtify-meow.vercel.app/api/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`,
        { headers: SHARED_CLIENT_HEADERS }
      );
      if (remoteRes.ok) {
        const remoteData = await remoteRes.json();
        resolutionCache.set(cacheKey, { data: remoteData, expiry: Date.now() + CACHE_TTL_MS });
        return res.status(200).json(remoteData);
      }
    } catch (_) {}
    return res.status(500).json({ items: [] });
  }
}
