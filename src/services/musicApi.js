import { ALL_MUSIC_CATALOG } from '../config/musicSources.js';
import {
  isValidMusicContent,
  prioritizeMusic,
  mapServerSong,
} from './youtube.js';
import { state } from '../config/config.js';

// Primary endpoints (works seamlessly across localhost, Vercel, and GitHub Pages)
const REMOTE_API_URL = 'https://pawtify-meow.vercel.app/api/search';

/**
 * Robust fetch that handles both local development server and static GitHub Pages deployments
 */
export async function fetchApi(params = {}) {
  const queryString = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryString.append(key, String(value));
    }
  }
  const qStr = queryString.toString();

  // 1. If running on a static host like GitHub Pages, use remote endpoint directly
  const isStaticHost =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('github.io') ||
      window.location.protocol === 'file:');

  const urlsToTry = isStaticHost
    ? [`${REMOTE_API_URL}?${qStr}`]
    : [`/api/search?${qStr}`, `${REMOTE_API_URL}?${qStr}`];

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && (Array.isArray(data.items) || Array.isArray(data))) {
            return data;
          }
        }
      }
    } catch (_) {
      // Continue to next URL
    }
  }

  return null;
}

export function isValidYouTubeId(id) {
  if (!id || typeof id !== 'string') return false;
  // YouTube video IDs are exactly 11 characters containing alphanumeric, -, or _
  return /^[a-zA-Z0-9_-]{11}$/.test(id.trim());
}

/**
 * Searches for songs with guaranteed playable YouTube IDs
 */
export async function searchSongs(
  query,
  page = 0,
  limit = 20,
  source = 'all'
) {
  const qLower = (query || '').toLowerCase().trim();

  // Instant catalog matches (zero latency for India & International hits)
  const localMatches = ALL_MUSIC_CATALOG.filter((song) => {
    if (source === 'india' && song.source !== 'india') return false;
    if (source === 'international' && song.source !== 'international')
      return false;
    if (!qLower) return true;
    return (
      song.title.toLowerCase().includes(qLower) ||
      song.artist.toLowerCase().includes(qLower) ||
      (song.genre && song.genre.toLowerCase().includes(qLower)) ||
      (song.sourceLabel && song.sourceLabel.toLowerCase().includes(qLower))
    );
  });

  let upstreamSongs = [];

  if (query) {
    const data = await fetchApi({
      q: query,
      source,
    });

    if (data && Array.isArray(data.items)) {
      upstreamSongs = data.items
        .filter(isValidMusicContent)
        .sort(prioritizeMusic)
        .map(mapServerSong)
        .filter((s) => s && s.id && isValidYouTubeId(s.id));
    }

    // Secondary query if needed: search specifically for audio / topic stream
    if (upstreamSongs.length < 3) {
      const audioData = await fetchApi({
        q: `${query} audio official`,
        source,
      });
      if (audioData && Array.isArray(audioData.items)) {
        const extraSongs = audioData.items
          .filter(isValidMusicContent)
          .sort(prioritizeMusic)
          .map(mapServerSong)
          .filter((s) => s && s.id && isValidYouTubeId(s.id));
        upstreamSongs = [...upstreamSongs, ...extraSongs];
      }
    }
  }

  // Combine local catalog + upstream results, prioritizing exact query matches
  const combined = [...localMatches, ...upstreamSongs];
  const seen = new Set();
  const deduped = [];
  for (const song of combined) {
    if (!seen.has(song.id)) {
      seen.add(song.id);
      deduped.push(song);
    }
  }

  return deduped.slice(0, limit);
}

/**
 * Searches for an alternative playable stream when YouTube throws embed restriction (error 101/150)
 */
export async function searchAlternativeStream(title, artist, currentId = '') {
  const cleanTitle = (title || '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\s*\[.*?\]\s*/g, '')
    .replace(/official\s+video/gi, '')
    .replace(/official\s+music\s+video/gi, '')
    .replace(/mv/gi, '')
    .trim();
  const cleanArtist = (artist || '').trim();

  const queries = [
    `${cleanTitle} ${cleanArtist} audio`,
    `${cleanTitle} ${cleanArtist} official audio`,
    `${cleanTitle} ${cleanArtist} lyrics`,
    `${cleanTitle} ${cleanArtist}`,
  ];

  for (const q of queries) {
    try {
      const data = await fetchApi({ q });
      if (data && Array.isArray(data.items)) {
        const candidates = data.items
          .filter(isValidMusicContent)
          .sort(prioritizeMusic)
          .map(mapServerSong)
          .filter(
            (s) =>
              s &&
              s.id &&
              isValidYouTubeId(s.id) &&
              s.id !== currentId
          );

        if (candidates.length > 0) {
          return candidates[0];
        }
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Resolves a song that has a numeric or non-YouTube ID to a playable YouTube track
 */
export async function resolveToPlayableSong(song) {
  if (!song) return null;
  if (isValidYouTubeId(song.id)) return song;

  // Song has a non-YouTube ID (e.g. iTunes numeric ID)
  const alt = await searchAlternativeStream(song.title, song.artist, song.id);
  if (alt && isValidYouTubeId(alt.id)) {
    return {
      ...song,
      id: alt.id,
      coverUrl: alt.coverUrl || song.coverUrl,
      duration: alt.duration || song.duration,
      durationSec: alt.durationSec || song.durationSec,
    };
  }

  return song;
}

export async function searchPlaylists(query, limit = 10) {
  try {
    const data = await fetchApi({ q: query, type: 'playlists' });
    if (!data || !Array.isArray(data.items)) return [];
    return data.items.slice(0, limit).map((x) => ({
      id: x.id,
      name: x.title || 'Unknown Playlist',
      uploaderName:
        typeof x.uploaderName === 'string'
          ? x.uploaderName
          : Array.isArray(x.uploaderName)
            ? x.uploaderName.map((a) => a.name || a).join(', ')
            : x.uploaderName?.name || '',
      imageUrl:
        x.thumbnail ||
        'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300',
      type: 'Playlist',
      isSystem: false,
    }));
  } catch (e) {
    return [];
  }
}

export async function searchArtists(query, page = 0, limit = 10) {
  try {
    const data = await fetchApi({ q: query, type: 'artists' });
    if (!data || !Array.isArray(data.items)) return [];
    return data.items.slice(0, limit).map((x) => ({
      id: x.id,
      name:
        (typeof x.uploaderName === 'string'
          ? x.uploaderName
          : Array.isArray(x.uploaderName)
            ? x.uploaderName.map((a) => a.name || a).join(', ')
            : x.uploaderName?.name) ||
        x.title ||
        'Unknown Artist',
      imageUrl: x.thumbnail || './assets/pawtify.png',
      type: 'Artist',
      bio: '',
    }));
  } catch (e) {
    return [];
  }
}

export async function fetchSearchSuggestions(query) {
  try {
    const data = await fetchApi({ q: query, type: 'suggestions' });
    return data?.items || [];
  } catch (e) {
    return [];
  }
}

export async function getSongRecommendations(id, limit = 10) {
  if (!state.currentSong) return [];
  const query = `${state.currentSong.artist} ${state.currentSong.title}`;
  return await searchSongs(query, 0, limit);
}

export async function getNextSong(currentSongId) {
  if (!currentSongId) {
    const pool = state.trendingSongs.length
      ? state.trendingSongs
      : state.indieBandsSongs.length
        ? state.indieBandsSongs
        : state.acousticSongs;
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const suggestions = await getSongRecommendations(currentSongId, 14);
  const next = suggestions.find(
    (song) => !state.recentlyPlayed.includes(song.id)
  );
  return next || suggestions[0] || null;
}
