import { escapeHTML } from '../utils/utils.js';
import { state } from '../config/config.js';
import { getSongById, dedupeSongs } from '../core/details.js';


export function renderSongRowSkeleton() {
  return `
    <div class="skeleton-song-row">
      <div class="skeleton skeleton-cover-sm"></div>
      <div class="skeleton-text-wrap">
        <div class="skeleton skeleton-text-main" style="width: 60%;"></div>
        <div class="skeleton skeleton-text-sub" style="width: 40%;"></div>
      </div>
      <div class="skeleton skeleton-text-sub" style="width: 32px; margin-left: auto;"></div>
    </div>
  `;
}

export function renderCardSkeleton(isRound = false) {
  return `
    <div class="skeleton-card">
      <div class="skeleton skeleton-card-cover" style="border-radius: ${isRound ? '50%' : 'var(--radius-md)'}; margin-bottom: 12px; aspect-ratio: 1/1;"></div>
      <div class="skeleton skeleton-card-title" style="margin-left: 0;"></div>
      <div class="skeleton skeleton-card-meta" style="margin-left: 0;"></div>
    </div>
  `;
}

export function renderHomeGridSkeleton() {
  return `
    <div class="home-grid-card" style="pointer-events:none;">
      <div class="skeleton" style="width:56px; height:56px; flex-shrink:0;"></div>
      <div class="skeleton skeleton-text-main" style="width: 70%; margin: 0;"></div>
    </div>
  `;
}

export function renderHomeScrollSkeleton() {
  return `
    <div class="home-scroll-card" style="pointer-events:none;">
      <div class="skeleton" style="width:140px; height:140px; border-radius:var(--radius-md); margin-bottom:12px; aspect-ratio: 1/1;"></div>
      <div class="skeleton skeleton-text-main" style="width: 80%; margin: 0 0 8px 0; border-radius: 4px;"></div>
      <div class="skeleton skeleton-text-sub" style="width: 50%; margin: 0; border-radius: 4px;"></div>
    </div>
  `;
}

export function renderHomeGridCard(song, source, playlistId = '') {
  if (!song) return '';
  return `
    <article class="home-grid-card" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" data-playlist-id="${escapeHTML(playlistId)}" type="button">
      <img src="${escapeHTML(song.coverUrl)}" alt="${escapeHTML(song.title)}" loading="lazy" />
      <span>${escapeHTML(song.title)}</span>
    </article>
  `;
}

export function renderHomeScrollCard(song, index, source, playlistId = '') {
  if (!song) return '';
  const badgeHTML = song.sourceLabel
    ? `<span class="scroll-card-source-badge">${escapeHTML(song.sourceLabel)}</span>`
    : '';
  return `
    <article class="home-scroll-card" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" data-playlist-id="${escapeHTML(playlistId)}" type="button">
      <div class="scroll-cover-wrap" style="position: relative;">
        <img src="${escapeHTML(song.coverUrl)}" alt="${escapeHTML(song.title)}" loading="lazy" />
        <div class="ios-cover-badge"><i class="fa-solid fa-play"></i></div>
        ${badgeHTML}
      </div>
      <h3>${escapeHTML(song.title)}</h3>
      <p>${escapeHTML(song.artist)}</p>
    </article>
  `;
}

export function renderSearchResults() {
  const songs = state.searchResults.songs || [];
  const artists = state.searchResults.artists || [];
  const playlists = state.searchResults.playlists || [];

  let content = '';

  if (state.searchLoading) {
    if (state.searchTab === 'songs') {
      content = `<div class="song-table">${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>`;
    } else {
      content = `<div class="card-grid">${Array(8).fill('').map(() => renderCardSkeleton(state.searchTab === 'artists')).join('')}</div>`;
    }
  } else {
    const noSongsMsg = `
      <div class="empty-state">
        <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; color: var(--muted); margin-bottom: 12px;"></i>
        <h2>No results found</h2>
        <p>We couldn't find anything matching "${escapeHTML(state.searchQuery)}". Check your spelling or try a different search.</p>
        <div style="margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 480px;">
          <button class="btn btn-soft" data-action="use-recent-search" data-query="Prateek Kuhad" type="button" style="font-size: 0.8125rem; padding: 6px 14px; border-radius: 999px;">Prateek Kuhad</button>
          <button class="btn btn-soft" data-action="use-recent-search" data-query="Lo-Fi Chill" type="button" style="font-size: 0.8125rem; padding: 6px 14px; border-radius: 999px;">Lo-Fi Chill</button>
          <button class="btn btn-soft" data-action="use-recent-search" data-query="Arijit Singh" type="button" style="font-size: 0.8125rem; padding: 6px 14px; border-radius: 999px;">Arijit Singh</button>
        </div>
      </div>
    `;
    if (state.searchTab === 'songs') {
      content = `<div class="song-table">${songs.length ? songs.map((s, i) => renderSongRow(s, i + 1, 'search')).join('') : noSongsMsg}</div>`;
    } else if (state.searchTab === 'artists') {
      content = `<div class="card-grid">${artists.length ? artists.map((a, i) => renderArtistSearchCard(a, i)).join('') : '<div class="empty-state"><h2>No artists found</h2><p>Try searching for a different name.</p></div>'}</div>`;
    } else {
      content = `<div class="card-grid">${playlists.length ? playlists.map((p, i) => renderPlaylistSearchCard(p, i)).join('') : '<div class="empty-state"><h2>No playlists found</h2><p>Try searching with different keywords.</p></div>'}</div>`;
    }
  }

  return `
    <div class="tab-list">
      <button class="tab-btn ${state.searchTab === 'songs' ? 'active' : ''}" data-action="set-search-tab" data-value="songs" type="button">Songs</button>
      <button class="tab-btn ${state.searchTab === 'artists' ? 'active' : ''}" data-action="set-search-tab" data-value="artists" type="button">Artists</button>
      <button class="tab-btn ${state.searchTab === 'playlists' ? 'active' : ''}" data-action="set-search-tab" data-value="playlists" type="button">Playlists</button>
    </div>
    ${content}
  `;
}

export function renderSearchDynamicUI() {
  const hasQuery = state.searchQuery.trim().length > 0;
  const recentQueries = (state.recentSearches || [])
    .filter((item) => item.type === 'query')
    .slice(0, 5);
  const suggestions = state.searchSuggestions || [];

  let html = '';
  if (hasQuery) {
    html += `<button class="clear-search" data-action="clear-search-input" type="button" aria-label="Clear Search"><i class="fa-solid fa-xmark" style="font-size: 1rem;"></i></button>`;
  }
  
  // Only show suggestions dropdown if actively requested/typing and not already dismissed
  const shouldShowDropdown = state.showSuggestions !== false;

  if (hasQuery && suggestions.length > 0 && shouldShowDropdown) {
    html += `
      <div class="recent-searches-dropdown" style="display: flex; position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: #141a16; background: linear-gradient(180deg, #1c241f 0%, #121614 100%); border: 1px solid rgba(255, 255, 255, 0.18); border-radius: var(--radius-md); box-shadow: 0 16px 40px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.06); z-index: 1000; flex-direction: column; overflow: hidden; max-height: 280px; overflow-y: auto;">
        ${suggestions.map(s => `
          <button class="recent-search-item" data-action="use-recent-search" data-query="${escapeHTML(s)}" type="button" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: transparent; border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.05); color: #fff; text-align: left; cursor: pointer; width: 100%; transition: background 0.15s;">
            <div style="display: flex; align-items: center; gap: 12px; pointer-events: none;">
              <i class="fa-solid fa-magnifying-glass" style="color: var(--green); font-size: 0.85rem;"></i>
              <span style="color: #fff; font-size: 0.9rem; font-weight: 500;">${escapeHTML(s)}</span>
            </div>
            <i class="fa-solid fa-arrow-up-left" style="color: var(--muted); font-size: 0.75rem; transform: rotate(45deg);"></i>
          </button>
        `).join('')}
      </div>
    `;
  } else if (!hasQuery && recentQueries.length > 0 && shouldShowDropdown) {
    html += `
      <div class="recent-searches-dropdown" style="display: flex; position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: #141a16; background: linear-gradient(180deg, #1c241f 0%, #121614 100%); border: 1px solid rgba(255, 255, 255, 0.18); border-radius: var(--radius-md); box-shadow: 0 16px 40px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.06); z-index: 1000; flex-direction: column; overflow: hidden;">
        <div style="padding: 12px 16px; font-size: 0.75rem; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid rgba(255,255,255,0.06);">
          Recent Searches
        </div>
        ${recentQueries.map(item => `
          <button class="recent-search-item" data-action="use-recent-search" data-query="${escapeHTML(item.query)}" type="button" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: transparent; border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.04); color: #fff; text-align: left; cursor: pointer; width: 100%; transition: background 0.15s;">
            <div style="display: flex; align-items: center; gap: 12px; pointer-events: none;">
              <i class="fa-solid fa-clock-rotate-left" style="color: var(--muted); font-size: 0.85rem;"></i>
              <span style="color: #fff; font-size: 0.9rem;">${escapeHTML(item.query)}</span>
            </div>
            <div data-action="remove-recent-search" data-type="query" data-id="${escapeHTML(item.query)}" style="padding: 4px 8px; color: var(--muted); cursor: pointer;" title="Remove">
              <i class="fa-solid fa-xmark" style="pointer-events: none;"></i>
            </div>
          </button>
        `).join('')}
      </div>
    `;
  }
  return html;
}

export function updateSearchPageUI() {
  const contentArea = document.getElementById('search-content-area');
  if (contentArea) {
    const hasQuery = state.searchQuery && state.searchQuery.trim().length > 0;
    const isLibraryScope = state.searchScope === 'library';
    contentArea.innerHTML = hasQuery
      ? (isLibraryScope ? renderLibrarySearchResults() : renderSearchResults())
      : renderSearchCategories();
  }
}

export function renderSearchPage() {
  const hasQuery = state.searchQuery && state.searchQuery.trim().length > 0;
  const isLibraryScope = state.searchScope === 'library';

  return `
    <section class="page search-page ${hasQuery ? 'search-active' : ''}">
      <!-- Top Scope Selector when searching or typing, matching Screenshot_20261003_144545.png -->
      <div class="search-top-header">
        <div class="search-scope-pill-container">
          <button class="search-scope-btn ${!isLibraryScope ? 'active' : ''}" data-action="set-search-scope" data-scope="online" type="button">
            MRTune Music
          </button>
          <button class="search-scope-btn ${isLibraryScope ? 'active' : ''}" data-action="set-search-scope" data-scope="library" type="button">
            Library
          </button>
        </div>
        ${!hasQuery ? `<h1 class="search-main-title">Search</h1>` : ''}
      </div>

      <!-- Main Search Results or Discover Content -->
      <div id="search-content-area" class="search-content-area">
        ${hasQuery ? (isLibraryScope ? renderLibrarySearchResults() : renderSearchResults()) : renderSearchCategories()}
      </div>

      <!-- Floating Bottom Search Dock matching Screenshot_20261003_144527.png & Screenshot_20261003_144545.png -->
      <div class="search-floating-dock-container">
        <div class="search-floating-dock">
          <button class="search-dock-home-btn" data-route="/" type="button" aria-label="Home" title="Home">
            <i class="fa-solid fa-house"></i>
          </button>
          <div class="search-dock-input-wrap">
            <i class="fa-solid fa-magnifying-glass search-dock-icon"></i>
            <input
              type="text"
              id="search-input"
              class="search-dock-input"
              placeholder="Songs, albums or artists"
              value="${escapeHTML(state.searchQuery || '')}"
              autocomplete="off"
            />
            ${state.searchQuery ? `
              <button class="search-dock-clear-btn" data-action="clear-search-input" type="button" aria-label="Clear Search">
                <i class="fa-solid fa-xmark"></i>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </section>
  `;
}

export function renderLibraryPage() {
  const libraryTitle = state.userName ? `${state.userName}'s Library` : "Guest's Library";

  if (state.libraryCategory) {
    return renderLibraryCategoryView(state.libraryCategory, libraryTitle);
  }

  return `
    <section class="page library-page">
      <!-- Header matching Screenshot_20261002_173014.png -->
      <div class="library-header-row">
        <h1 class="library-title">${escapeHTML(libraryTitle)}</h1>
        <div class="library-capsule-actions">
          <button class="lib-capsule-btn" data-action="open-create-playlist" type="button" aria-label="Create Playlist" title="Create Playlist">
            <i class="fa-solid fa-plus"></i>
          </button>
          <button class="lib-capsule-btn" data-action="open-library-menu" type="button" aria-label="Library Options" title="Library Options">
            <i class="fa-solid fa-ellipsis"></i>
          </button>
        </div>
      </div>

      <!-- 8 iOS Grouped Categories -->
      <div class="library-grouped-list">
        <!-- 1. Now Playing -->
        <button class="library-row-item" data-action="open-library-category" data-category="nowplaying" type="button">
          <div class="library-row-icon">
            <i class="fa-solid fa-bars-staggered"></i>
          </div>
          <span class="library-row-label">Now Playing</span>
          <i class="fa-solid fa-chevron-right library-row-chevron"></i>
        </button>

        <!-- 2. Recently Played -->
        <button class="library-row-item" data-action="open-library-category" data-category="recent" type="button">
          <div class="library-row-icon">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </div>
          <span class="library-row-label">Recently Played</span>
          <i class="fa-solid fa-chevron-right library-row-chevron"></i>
        </button>

        <!-- 3. Favorites -->
        <button class="library-row-item" data-action="open-library-category" data-category="favorites" type="button">
          <div class="library-row-icon">
            <i class="fa-regular fa-heart"></i>
          </div>
          <span class="library-row-label">Favorites</span>
          <i class="fa-solid fa-chevron-right library-row-chevron"></i>
        </button>

        <!-- 4. Albums -->
        <button class="library-row-item" data-action="open-library-category" data-category="albums" type="button">
          <div class="library-row-icon">
            <i class="fa-solid fa-compact-disc"></i>
          </div>
          <span class="library-row-label">Albums</span>
          <i class="fa-solid fa-chevron-right library-row-chevron"></i>
        </button>

        <!-- 5. Playlists -->
        <button class="library-row-item" data-action="open-library-category" data-category="playlists" type="button">
          <div class="library-row-icon">
            <i class="fa-solid fa-list-ul"></i>
          </div>
          <span class="library-row-label">Playlists</span>
          <i class="fa-solid fa-chevron-right library-row-chevron"></i>
        </button>

        <!-- 6. Artists -->
        <button class="library-row-item" data-action="open-library-category" data-category="artists" type="button">
          <div class="library-row-icon">
            <i class="fa-solid fa-microphone"></i>
          </div>
          <span class="library-row-label">Artists</span>
          <i class="fa-solid fa-chevron-right library-row-chevron"></i>
        </button>

        <!-- 7. Songs -->
        <button class="library-row-item" data-action="open-library-category" data-category="songs" type="button">
          <div class="library-row-icon">
            <i class="fa-solid fa-music"></i>
          </div>
          <span class="library-row-label">Songs</span>
          <i class="fa-solid fa-chevron-right library-row-chevron"></i>
        </button>

        <!-- 8. LocalSongs -->
        <button class="library-row-item" data-action="open-library-category" data-category="local" type="button">
          <div class="library-row-icon">
            <i class="fa-solid fa-folder-open"></i>
          </div>
          <span class="library-row-label">LocalSongs</span>
          <i class="fa-solid fa-chevron-right library-row-chevron"></i>
        </button>
      </div>
    </section>
  `;
}

function renderLibraryCategoryView(category, libraryTitle) {
  let title = 'Library';
  let content = '';

  if (category === 'favorites') {
    title = 'Favorites';
    const songs = state.favorites || [];
    content = songs.length
      ? `<div class="song-table">${songs.map((s, i) => renderSongRow(s, i + 1, 'favorites')).join('')}</div>`
      : `<div class="empty-state"><i class="fa-regular fa-heart"></i><h2>No favorites yet</h2><p>Heart any song while playing to save it here.</p></div>`;
  } else if (category === 'recent') {
    title = 'Recently Played';
    const recentSongs = (state.recentlyPlayed || []).map((id) => getSongById(id)).filter(Boolean);
    content = recentSongs.length
      ? `<div class="song-table">${recentSongs.map((s, i) => renderSongRow(s, i + 1, 'recent')).join('')}</div>`
      : `<div class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><h2>No recent history</h2><p>Songs you stream will show up here.</p></div>`;
  } else if (category === 'playlists') {
    title = 'Playlists';
    const lists = state.playlists || [];
    content = `
      <div style="margin-bottom:18px;">
        <button class="btn btn-primary" data-action="open-create-playlist" type="button">
          <i class="fa-solid fa-plus"></i> New Playlist
        </button>
      </div>
      <div class="card-grid">${lists.map((p, i) => renderPlaylistCard(p, i)).join('')}</div>
    `;
  } else if (category === 'albums') {
    title = 'Albums';
    const categories = state.feedCategories || [];
    content = categories.length
      ? `<div class="card-grid">${categories.map((c) => `
          <div class="card album-card" data-action="play-album" data-album-id="${c.id}" style="cursor:pointer;">
            <div class="card-cover-wrap">
              <img src="${c.songs?.[0]?.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400'}" class="card-cover" alt="${escapeHTML(c.title)}" />
              <button class="play-btn-circle" data-action="play-album" data-album-id="${c.id}"><i class="fa-solid fa-play"></i></button>
            </div>
            <h3 class="card-title">${escapeHTML(c.title)}</h3>
            <p class="card-meta">${c.songs?.length || 0} tracks</p>
          </div>
        `).join('')}</div>`
      : `<div class="empty-state"><i class="fa-solid fa-compact-disc"></i><h2>No albums found</h2></div>`;
  } else if (category === 'artists') {
    title = 'Artists';
    const artistsMap = new Map();
    [...state.favorites, ...state.queue, ...(state.feedCategories || []).flatMap((c) => c.songs)].forEach((s) => {
      if (s && s.artist && !artistsMap.has(s.artist)) {
        artistsMap.set(s.artist, s.coverUrl);
      }
    });
    const artists = Array.from(artistsMap.entries()).slice(0, 30);
    content = artists.length
      ? `<div class="card-grid">${artists.map(([artistName, cover]) => `
          <div class="card artist-card" data-action="search-artist-click" data-artist="${escapeHTML(artistName)}" style="cursor:pointer; text-align:center;">
            <div class="card-cover-wrap" style="border-radius:50%; width:120px; height:120px; margin:0 auto 10px;">
              <img src="${cover}" class="card-cover" style="border-radius:50%;" alt="${escapeHTML(artistName)}" />
            </div>
            <h3 class="card-title" style="font-weight:700;">${escapeHTML(artistName)}</h3>
            <p class="card-meta">Artist</p>
          </div>
        `).join('')}</div>`
      : `<div class="empty-state"><i class="fa-solid fa-microphone"></i><h2>No artists in library</h2></div>`;
  } else if (category === 'songs') {
    title = 'All Songs';
    const allSongs = dedupeSongs([
      ...state.favorites,
      ...(state.playlists || []).flatMap((p) => p.songs || []),
      ...(state.downloads || []),
    ]);
    content = allSongs.length
      ? `<div class="song-table">${allSongs.map((s, i) => renderSongRow(s, i + 1, 'all')).join('')}</div>`
      : `<div class="empty-state"><i class="fa-solid fa-music"></i><h2>No songs yet</h2><p>Favorite tracks to see them here.</p></div>`;
  } else if (category === 'local') {
    title = 'LocalSongs';
    const local = state.localSongs || [];
    content = `
      <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 16px 20px; border-radius: var(--radius-md);">
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 1rem;">
            <i class="fa-solid fa-folder-open" style="color: var(--green); margin-right: 8px;"></i> Offline Device Files
          </div>
          <div style="font-size: 0.8rem; color: var(--muted); margin-top: 2px;">
            ${local.length} audio files imported from your device
          </div>
        </div>
        <button class="btn btn-primary" data-action="pick-local-audio" type="button" style="font-size: 0.85rem; padding: 10px 18px;">
          <i class="fa-solid fa-plus" style="margin-right: 6px;"></i> Import Files
        </button>
        <input type="file" id="local-audio-file-input" multiple accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac" style="display:none;" />
      </div>
      ${local.length
        ? `<div class="song-table">${local.map((s, i) => renderSongRow(s, i + 1, 'local')).join('')}</div>`
        : `<div class="empty-state"><i class="fa-solid fa-folder-open"></i><h2>No local audio files imported</h2><p>Select MP3, M4A, or WAV files from your phone or PC to play offline directly.</p></div>`}
    `;
  }

  return `
    <section class="page library-page">
      <div class="library-subview-nav">
        <button class="library-back-btn" data-action="back-to-library-menu" type="button">
          <i class="fa-solid fa-chevron-left"></i> Library
        </button>
        <h2 style="font-size: 1.35rem; font-weight: 700; color: #fff;">${escapeHTML(title)}</h2>
        <div style="width: 70px;"></div>
      </div>
      ${content}
    </section>
  `;
}

export function renderPlaylistPage(playlistId) {
  let playlist;
  if (playlistId === 'history') {
    const historySongs = state.recentlyPlayed
      .map((id) => getSongById(id))
      .filter(Boolean);
    playlist = {
      id: 'history',
      name: 'Listening History',
      songs: historySongs,
      isSystem: true,
    };
  } else {
    playlist = state.playlists.find((p) => p.id === playlistId);
    if (!playlist && state.ytPlaylists && state.ytPlaylists[playlistId]) {
      playlist = state.ytPlaylists[playlistId];
    }
  }
  if (!playlist) return '<div class="empty-state">Playlist not found.</div>';
  
  if (playlist.isLoading) {
    return `<section class="page">
    <div class="page-header" style="display:flex; align-items:center; gap:24px; padding-bottom:24px;">
      <div class="skeleton" style="width:160px; height:160px; border-radius:var(--radius-md);"></div>
      <div style="flex:1; display:flex; flex-direction:column; gap:12px;">
        <div class="skeleton skeleton-text-main" style="width:100px; height:14px; border-radius:4px;"></div>
        <div class="skeleton skeleton-text-main" style="width:60%; height:48px; border-radius:8px;"></div>
        <div class="skeleton skeleton-text-sub" style="width:40%; height:14px; border-radius:4px;"></div>
      </div>
    </div>
    <div class="song-table">${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>
  </section>`;
  }
  
  const coverUrl = playlist.coverUrl || (playlist.songs && playlist.songs.length > 0 ? playlist.songs[0].coverUrl : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300');
  
  return `
    <section class="page" style="padding-top: 0;">
      <div style="margin-bottom: 24px; margin-top: 16px;">
        <button class="btn btn-soft" data-action="navigate" data-path="/" type="button" style="padding: 8px 16px; font-size: 0.875rem;">
          <i class="fa-solid fa-arrow-left" style="margin-right: 8px;"></i> Back to Home
        </button>
      </div>
      <div class="hero-player" style="margin-bottom: 32px; border-radius: var(--radius-lg); background: var(--glass-surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--glass-border); padding: 32px;">
        <img class="hero-cover" src="${escapeHTML(coverUrl)}" alt="${escapeHTML(playlist.name)}" />
        <div class="hero-info" style="display: flex; flex-direction: column; justify-content: flex-end;">
          <h4 style="text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; margin-bottom: 8px; color: var(--muted);">Playlist</h4>
          <h1 class="hero-title" style="font-size: 3rem; line-height: 1.1; margin-bottom: 16px; font-family: var(--font-display); font-weight: 800;">${escapeHTML(playlist.name)}</h1>
          <p class="hero-artist" style="margin-bottom: 24px; color: var(--muted);">
            ${playlist.isSystem ? 'System Playlist' : (playlist.songs ? playlist.songs.length : 0) + ' songs'}
          </p>
          <div class="hero-actions" style="display: flex; gap: 12px;">
            <button class="btn btn-primary" data-action="play-all-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button">
              <i class="fa-solid fa-play"></i> Play All
            </button>
            <button class="btn btn-soft" data-action="share-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Share Playlist">
              <i class="fa-solid fa-share-nodes"></i> Share
            </button>
            ${
              playlist.id !== 'default' && !playlist.isSystem
                ? `<button class="btn btn-danger" data-action="delete-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Delete Playlist"><i class="fa-solid fa-trash"></i></button>`
                : ''
            }
          </div>
        </div>
      </div>
      <div class="song-table">
        ${playlist.songs && playlist.songs.length ? playlist.songs.map((s, i) => renderSongRow(s, i + 1, 'playlist', playlist.id)).join('') : '<div class="empty-state">This playlist is empty. Search for songs to add them.</div>'}
      </div>
    </section>
  `;
}

export function renderSongRow(song, index, source, playlistId = '') {
  if (!song) return '';
  const active = state.currentSong?.id === song.id;
  const isFav = state.favorites.some((item) => item.id === song.id);
  const activeIndicatorHTML = active
    ? (state.isPlaying
        ? `<div class="active-track-breathing-pill" aria-label="Now playing" title="Now playing">
             <span class="breathe-bar b-1"></span>
             <span class="breathe-bar b-2"></span>
             <span class="breathe-bar b-3"></span>
           </div>`
        : `<i class="fa-solid fa-play active-track-indicator" style="font-size:0.75rem;"></i>`
      )
    : `<span>${index}</span>`;

  return `
     <div class="song-row ${active ? 'active' : ''}" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" data-playlist-id="${escapeHTML(playlistId)}" type="button">
       <div class="song-index">
         ${activeIndicatorHTML}
       </div>
       <img class="song-cover-sm" src="${escapeHTML(song.coverUrl)}" alt="" />
       <div class="song-info">
         <div class="song-title ${active ? 'active-track-title' : ''}">${escapeHTML(song.title)}</div>
         <div class="song-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}" onclick="event.stopPropagation();">${escapeHTML(song.artist)}</div>
       </div>
       <div class="song-duration">${escapeHTML(song.duration || '0:00')}</div>
       <div class="song-actions">
         <button class="song-action-btn ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" onclick="event.stopPropagation();" title="Toggle Favorite">
           <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
         </button>
         <button class="song-action-btn" data-action="open-playlist-picker" data-song-id="${escapeHTML(song.id)}" type="button" onclick="event.stopPropagation();" title="Add to Playlist">
           <i class="fa-solid fa-plus"></i>
         </button>
         <button class="song-action-btn" data-action="share-specific-song" data-song-id="${escapeHTML(song.id)}" type="button" onclick="event.stopPropagation();" title="Share Song">
           <i class="fa-solid fa-share-nodes"></i>
         </button>
       </div>
     </div>
   `;
}

export function renderPlaylistCard(playlist, index) {
  if (!playlist) return '';
  const coverUrl =
    playlist.songs && playlist.songs.length > 0
      ? playlist.songs[0].coverUrl
      : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300';
  return `
    <div class="card" data-action="navigate" data-path="/playlist/${escapeHTML(playlist.id)}" tabindex="0">
      <div class="card-img-wrap">
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(playlist.name)}" loading="lazy" />
        <button class="card-play-btn" data-action="play-all-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Play ${escapeHTML(playlist.name)}" onclick="event.stopPropagation();">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
      <div class="card-title">${escapeHTML(playlist.name)}</div>
      <div class="card-meta">${playlist.isSystem ? 'System Playlist' : (playlist.songs ? playlist.songs.length : 0) + ' songs'}</div>
    </div>
  `;
}

export function renderPlaylistSearchCard(playlist, index) {
  if (!playlist) return '';
  const coverUrl =
    playlist.imageUrl ||
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300';
  return `
    <div class="card" data-action="open-playlist-profile" data-playlist-id="${escapeHTML(playlist.id)}" tabindex="0">
      <div class="card-img-wrap">
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(playlist.name)}" loading="lazy" />
      </div>
      <div class="card-title">${escapeHTML(playlist.name)}</div>
      <div class="card-meta">${escapeHTML(playlist.uploaderName || 'Playlist')}</div>
    </div>
  `;
}

export function renderArtistSearchCard(artist, index) {
  if (!artist) return '';
  const coverUrl =
    artist.imageUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300&h=300';
  return `
    <div class="card" data-action="open-artist-profile" data-artist="${escapeHTML(artist.name)}" tabindex="0">
      <div class="card-img-wrap" style="border-radius: 50%; overflow: hidden; margin-bottom: 12px; aspect-ratio: 1/1;">
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(artist.name)}" loading="lazy" style="object-fit: cover; width: 100%; height: 100%;" />
      </div>
      <div class="card-title" style="text-align: center;">${escapeHTML(artist.name)}</div>
      <div class="card-meta" style="text-align: center;">Artist</div>
    </div>
  `;
}


const TRENDING_SEARCH_SHORTCUTS = [
  { label: 'Prateek Kuhad', icon: 'fa-guitar' },
  { label: 'Arijit Singh', icon: 'fa-microphone' },
  { label: 'Lo-Fi Chill', icon: 'fa-headphones' },
  { label: 'Anuv Jain', icon: 'fa-heart' },
  { label: 'Desi Hip Hop', icon: 'fa-fire' },
  { label: 'Indie Rock', icon: 'fa-bolt' },
  { label: 'Late Night', icon: 'fa-moon' },
];

export const NEW_ALBUMS_AND_SINGLES = [
  {
    id: 'nas-1',
    title: 'Casa Tupka Anthem...',
    type: 'Single',
    artist: 'Yo Yo Honey Singh',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400',
    query: 'Casa Tupka Anthem',
  },
  {
    id: 'nas-2',
    title: 'Ghostface Killah',
    type: 'Single',
    artist: 'Ghostface Villain',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400',
    query: 'Ghostface Killah',
  },
  {
    id: 'nas-3',
    title: 'Assay Passay',
    type: 'Single',
    artist: 'Talwinder',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=400',
    query: 'Assay Passay Talwinder',
  },
  {
    id: 'nas-4',
    title: 'Afsaana Banaaya Aa...',
    type: 'Single',
    artist: 'Gunmaaster G9',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400',
    query: 'Afsaana Banaaya Aapne',
  },
  {
    id: 'nas-5',
    title: 'AUJLA SZN 1',
    type: 'EP',
    artist: 'Karan Aujla',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
    query: 'Karan Aujla SZN 1',
  },
  {
    id: 'nas-6',
    title: 'Fallen Angel (Digital ...',
    type: 'EP',
    artist: 'Luna Rose',
    coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    query: 'Fallen Angel Digital',
  },
];

export const MOODS_AND_GENRES = [
  { name: 'African', color: '#107c41', query: 'African Afrobeat' },
  { name: 'Feel good', color: '#57a773', query: 'Feel good songs' },
  { name: 'Party', color: '#7b2cbf', query: 'Party dance' },
  { name: 'Desi hip-hop', color: '#3a3a3c', query: 'Desi hip hop' },
  { name: 'Romance', color: '#c1121f', query: 'Romantic love songs' },
  { name: '1960s', color: '#2b9348', query: '1960s retro hits' },
  { name: 'Lo-Fi Chill', color: '#3d5a80', query: 'Lofi chill beats' },
  { name: 'Bollywood Hits', color: '#e76f51', query: 'Bollywood hits' },
];

export function renderSearchCategories() {
  return `
    <div class="search-discover-wrapper">
      <!-- Section 1: New albums & singles matching Screenshot_20261003_144527.png -->
      <div class="search-section">
        <div class="search-section-header">
          <h2 class="search-section-title">New albums &amp; singles</h2>
          <i class="fa-solid fa-chevron-right search-section-chevron"></i>
        </div>
        <div class="search-new-releases-grid">
          ${NEW_ALBUMS_AND_SINGLES.map((item) => `
            <div class="search-release-card" data-action="use-recent-search" data-query="${escapeHTML(item.query)}">
              <div class="release-cover-box">
                <img src="${item.coverUrl}" alt="${escapeHTML(item.title)}" loading="lazy" />
              </div>
              <h3 class="release-title">${escapeHTML(item.title)}</h3>
              <p class="release-meta">${escapeHTML(item.type)}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Section 2: Moods & genres matching Screenshot_20261003_144527.png -->
      <div class="search-section" style="margin-top: 26px;">
        <div class="search-section-header">
          <h2 class="search-section-title">Moods &amp; genres</h2>
        </div>
        <div class="search-genres-grid">
          ${MOODS_AND_GENRES.map((g) => `
            <button class="search-genre-card" data-action="use-recent-search" data-query="${escapeHTML(g.query)}" type="button" style="background-color: ${g.color};">
              <span class="genre-name">${escapeHTML(g.name)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

export function renderLibrarySearchResults() {
  const q = (state.searchQuery || '').toLowerCase().trim();
  const allLibrarySongs = dedupeSongs([
    ...(state.favorites || []),
    ...(state.playlists || []).flatMap((p) => p.songs || []),
    ...(state.downloads || []),
    ...(state.localSongs || []),
  ]);
  const matched = allLibrarySongs.filter(
    (s) =>
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.artist && s.artist.toLowerCase().includes(q)) ||
      (s.album && s.album.toLowerCase().includes(q))
  );

  if (!matched.length) {
    return `
      <div class="empty-state" style="padding: 40px 20px; text-align: center;">
        <i class="fa-solid fa-music" style="font-size: 2.2rem; color: var(--muted); margin-bottom: 14px;"></i>
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #fff;">No matching library songs</h2>
        <p style="color: var(--muted); font-size: 0.85rem; margin-top: 4px;">Couldn't find "${escapeHTML(state.searchQuery)}" in your Library.</p>
        <button class="btn btn-primary" data-action="set-search-scope" data-scope="online" type="button" style="margin-top: 16px;">
          Search MRTune Music Online
        </button>
      </div>
    `;
  }

  return `
    <div class="song-table">
      ${matched.map((s, i) => renderSongRow(s, i + 1, 'library-search')).join('')}
    </div>
  `;
}
