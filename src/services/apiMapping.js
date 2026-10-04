import {
  isValidMusicContent,
  prioritizeMusic,
  mapServerSong,
} from './youtube.js';
import { state } from '../config/config.js';
import { ALL_MUSIC_CATALOG } from '../config/musicSources.js';

export async function searchSongs(query, page = 0, limit = 15, source = 'all') {
  const qLower = (query || '').toLowerCase().trim();

  // Instant Catalog Matches (Zero latency for India & International hits)
  const localMatches = ALL_MUSIC_CATALOG.filter((song) => {
    if (source === 'india' && song.source !== 'india') return false;
    if (source === 'international' && song.source !== 'international') return false;
    if (!qLower) return true;
    return (
      song.title.toLowerCase().includes(qLower) ||
      song.artist.toLowerCase().includes(qLower) ||
      (song.genre && song.genre.toLowerCase().includes(qLower)) ||
      (song.sourceLabel && song.sourceLabel.toLowerCase().includes(qLower))
    );
  });

  let upstreamSongs = [];
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&source=${encodeURIComponent(source)}`);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.items) {
          upstreamSongs = data.items
            .filter(isValidMusicContent)
            .sort(prioritizeMusic)
            .map(mapServerSong)
            .filter((s) => s && s.id);
        }
      }
    }
  } catch (_) {}

  // Client-side public API fallback for static hosts (e.g. GitHub Pages)
  if (!upstreamSongs.length && query) {
    try {
      const country = source === 'international' ? 'US' : 'IN';
      const itunesRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15&country=${country}`
      );
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        if (itunesData?.results?.length) {
          upstreamSongs = itunesData.results.map((r) => ({
            id: String(r.trackId),
            title: r.trackName,
            artist: r.artistName,
            plays: '100M+',
            coverUrl: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '600x600bb') : '',
            duration: `${Math.floor((r.trackTimeMillis || 180000) / 60000)}:${String(Math.floor(((r.trackTimeMillis || 180000) % 60000) / 1000)).padStart(2, '0')}`,
            durationSec: Math.round((r.trackTimeMillis || 180000) / 1000),
            source: source === 'international' ? 'international' : 'india',
            sourceLabel: source === 'international' ? '🌍 Global Top' : '🇮🇳 India Top',
          }));
        }
      }
    } catch (_) {}
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

export async function searchPlaylists(query, limit = 10) {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=playlists`
    );
    if (!res.ok) return [];
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return [];
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.slice(0, limit).map((x) => ({
      id: x.id,
      name: x.title || 'Unknown Playlist',
      uploaderName: typeof x.uploaderName === 'string' ? x.uploaderName : (Array.isArray(x.uploaderName) ? x.uploaderName.map(a => a.name || a).join(', ') : (x.uploaderName?.name || '')),
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
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=artists`
    );
    if (!res.ok) return [];
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return [];
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.slice(0, limit).map((x) => ({
      id: x.id,
      name: (typeof x.uploaderName === 'string' ? x.uploaderName : (Array.isArray(x.uploaderName) ? x.uploaderName.map(a => a.name || a).join(', ') : x.uploaderName?.name)) || x.title || 'Unknown Artist',
      imageUrl:
        x.thumbnail ||
        './assets/pawtify.png',
      type: 'Artist',
      bio: '',
    }));
  } catch (e) {
    return [];
  }
}

export async function getSongRecommendations(id, limit = 10) {
  if (!state.currentSong) return [];
  const query = state.currentSong.artist + ' ' + state.currentSong.title;
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


export async function fetchSearchSuggestions(query) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=suggestions`);
    const data = await res.json();
    return data.items || [];
  } catch (e) {
    return [];
  }
}
