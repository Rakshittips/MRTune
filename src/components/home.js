import { state, CURATED_IOS_TRACKS } from '../config/config.js';
import { renderHomeScrollCard } from './components.js';
import { escapeHTML } from '../utils/utils.js';
import { getSongById } from '../core/details.js';
import { renderDailyRecommendations } from './dailyRecommendations.js';
import {
  MUSIC_SOURCES,
  INDIA_TOP_TRACKS,
  INTERNATIONAL_TOP_TRACKS,
  getSongsBySource,
} from '../config/musicSources.js';

export function renderHomePage() {
  const currentSource = state.activeMusicSource || 'all';
  const sourceSongs = getSongsBySource(currentSource);

  const categories = state.feedCategories || [];
  const defaultTracks = Array.isArray(CURATED_IOS_TRACKS) && CURATED_IOS_TRACKS.length
    ? CURATED_IOS_TRACKS
    : [];

  const rec = Array.isArray(state.recommendedSongs) && state.recommendedSongs.length
    ? state.recommendedSongs.slice(0, 10)
    : defaultTracks;

  // 1. Recently Played items (fallback to curated tracks so never empty)
  let recentSongs = [];
  if (state.recentlyPlayed && state.recentlyPlayed.length) {
    recentSongs = state.recentlyPlayed.map((id) => getSongById(id)).filter(Boolean);
  }
  if (!recentSongs.length && rec.length) {
    recentSongs = rec.slice(0, 6);
  } else if (!recentSongs.length && categories[0]?.songs?.length) {
    recentSongs = categories[0].songs.slice(0, 6);
  } else if (!recentSongs.length) {
    recentSongs = defaultTracks.slice(0, 6);
  }

  // 2. Quick Picks (4 tracks adapted by active source filter)
  let quickPickSongs = [];
  if (currentSource !== 'all') {
    quickPickSongs = sourceSongs.slice(0, 4);
  } else if (rec.length >= 4) {
    quickPickSongs = rec.slice(0, 4);
  } else if (categories[0]?.songs?.length >= 4) {
    quickPickSongs = categories[0].songs.slice(0, 4);
  } else if (recentSongs.length >= 4) {
    quickPickSongs = recentSongs.slice(0, 4);
  } else {
    quickPickSongs = defaultTracks.slice(0, 4);
  }

  // 3. Forgotten Favorites (Liked Music Card + Favorites / Songs)
  const likedCardHTML = `
    <article class="liked-music-card" data-route="/playlist/favorites" type="button">
      <div class="liked-music-icon">
        <i class="fa-solid fa-thumbs-up"></i>
      </div>
      <div class="liked-music-meta">
        <h3>Liked music</h3>
        <p>Auto playlist • ${state.favorites.length || 0} songs</p>
      </div>
    </article>
  `;

  let favoriteSongs = state.favorites.slice(0, 8);
  if (!favoriteSongs.length && categories[1]?.songs?.length) {
    favoriteSongs = categories[1].songs.slice(0, 6);
  } else if (!favoriteSongs.length) {
    favoriteSongs = defaultTracks.slice(2, 6);
  }

  // 4. Popover Menu HTML
  const popoverMenuHTML = state.profileMenuOpen
    ? `
      <div class="profile-popover-backdrop" data-action="close-profile-popover"></div>
      <div class="profile-popover-menu" id="profile-popover-menu">
        <button class="profile-popover-item" data-action="open-signin-modal" type="button">
          <i class="fa-solid fa-circle-user"></i>
          <span>${state.userName ? escapeHTML(state.userName) : 'Sign in'}</span>
        </button>
        <button class="profile-popover-item" data-action="app-refresh" type="button">
          <i class="fa-solid fa-rotate-right"></i>
          <span>Refresh</span>
        </button>
        <a class="profile-popover-item" href="https://www.instagram.com/mr._rakshit_2.0" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-instagram" style="color:#e1306c;"></i>
          <span>Instagram (@mr._rakshit_2.0)</span>
          <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem; color:var(--muted); margin-left:auto;"></i>
        </a>
        <button class="profile-popover-item" data-action="open-support-modal" type="button">
          <i class="fa-solid fa-circle-dollar-to-slot"></i>
          <span>Support to keep the app free forever</span>
        </button>
      </div>
    `
    : '';

  const avatarInitial = state.userName ? escapeHTML(state.userName.charAt(0).toUpperCase()) : 'A';

  return `
    <section class="page" style="background:#000000;">
      <!-- iOS Listen Now Header -->
      <div class="home-greeting" style="position: relative; display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
        <div>
          <h1 style="font-size: 2.15rem; font-weight: 800; letter-spacing: -0.025em; color: #ffffff; margin: 0;">Listen Now</h1>
          <div style="font-size: 0.78rem; color: rgba(255,255,255,0.5); margin-top: 2px; display: flex; align-items: center; gap: 6px;">
            <span class="source-live-indicator"></span>
            <span>Multi-Source Engine • India & International</span>
          </div>
        </div>
        <button class="ios-pink-avatar" data-action="toggle-profile-popover" type="button" aria-label="Profile menu" title="Profile menu">
          ${avatarInitial}
        </button>
        ${popoverMenuHTML}
      </div>

      <!-- Multiple Music Sources & Regional Quick Access Pill Bar -->
      <div class="music-source-pill-bar" role="tablist" aria-label="Music sources and regions">
        ${MUSIC_SOURCES.map((s) => `
          <button class="source-pill ${currentSource === s.id ? 'active' : ''}" data-action="select-music-source" data-source-id="${s.id}" type="button">
            <i class="fa-solid ${s.icon}"></i>
            <span>${escapeHTML(s.name)}</span>
          </button>
        `).join('')}
      </div>

      <!-- Section 1: Recently Played > -->
      ${recentSongs.length ? `
        <div class="home-section">
          <h2 class="home-section-title" style="display: flex; align-items: center; gap: 6px; cursor: pointer;" data-route="/playlist/history">
            Recently Played <i class="fa-solid fa-chevron-right" style="font-size: 0.75em; opacity: 0.45;"></i>
          </h2>
          <div class="home-scroll">
            ${recentSongs.map((s, i) => renderHomeScrollCard(s, i, 'history')).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Section 2: Quick picks -->
      ${quickPickSongs.length ? `
        <div class="home-section">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
            <h2 class="home-section-title" style="margin: 0;">Quick picks</h2>
            <span style="font-size: 0.75rem; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.05em;">
              ${currentSource === 'india' ? '🇮🇳 India Hits' : (currentSource === 'international' ? '🌍 International' : '🔥 Trending Now')}
            </span>
          </div>
          <div class="quick-picks-container">
            ${quickPickSongs.map((s) => {
              const isCurrent = state.currentSong?.id === s.id;
              const isPlaying = isCurrent && state.isPlaying;
              return `
                <div class="quick-pick-row ${isCurrent ? 'active' : ''}" data-action="play-song" data-song-id="${escapeHTML(s.id)}" data-source="quick-picks" type="button">
                  <div class="quick-pick-thumb-box">
                    <img src="${escapeHTML(s.coverUrl)}" alt="${escapeHTML(s.title)}" class="quick-pick-thumb-img" loading="lazy" />
                    ${isCurrent ? `
                      <div class="quick-pick-playing-overlay">
                        <i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} active-track-indicator"></i>
                      </div>
                    ` : ''}
                  </div>
                  <div class="quick-pick-meta">
                    <span class="quick-pick-title ${isCurrent ? 'active-track-title' : ''}">${escapeHTML(s.title)}</span>
                    <span class="quick-pick-sub">
                      ${escapeHTML(s.artist)} • ${s.plays || '120M'} plays
                      ${s.sourceLabel ? `<span class="quick-pick-source-tag">${escapeHTML(s.sourceLabel)}</span>` : ''}
                    </span>
                  </div>
                  <button class="quick-pick-more" data-action="open-song-menu" data-song-id="${escapeHTML(s.id)}" type="button" aria-label="More options">
                    <i class="fa-solid fa-ellipsis"></i>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Section 3: Dedicated 🇮🇳 India & Desi Mega Hits -->
      ${(currentSource === 'all' || currentSource === 'india' || currentSource === 'punjabi' || currentSource === 'bollywood') ? `
        <div class="home-section">
          <h2 class="home-section-title" style="display: flex; align-items: center; gap: 6px;">
            🇮🇳 Top India & Desi Hits <i class="fa-solid fa-chevron-right" style="font-size: 0.75em; opacity: 0.45;"></i>
          </h2>
          <div class="home-scroll">
            ${INDIA_TOP_TRACKS.map((s, i) => renderHomeScrollCard(s, i, 'india-top')).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Section 4: Dedicated 🌍 International Billboard Top 50 -->
      ${(currentSource === 'all' || currentSource === 'international') ? `
        <div class="home-section">
          <h2 class="home-section-title" style="display: flex; align-items: center; gap: 6px;">
            🌍 International Billboard Top 50 <i class="fa-solid fa-chevron-right" style="font-size: 0.75em; opacity: 0.45;"></i>
          </h2>
          <div class="home-scroll">
            ${INTERNATIONAL_TOP_TRACKS.map((s, i) => renderHomeScrollCard(s, i, 'international-top')).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Section 5: Forgotten favorites > -->
      <div class="home-section">
        <h2 class="home-section-title" style="display: flex; align-items: center; gap: 6px; cursor: pointer;" data-route="/playlist/favorites">
          Forgotten favorites <i class="fa-solid fa-chevron-right" style="font-size: 0.75em; opacity: 0.45;"></i>
        </h2>
        <div class="home-scroll">
          ${likedCardHTML}
          ${favoriteSongs.map((s, i) => renderHomeScrollCard(s, i, 'favorites')).join('')}
        </div>
      </div>

      <!-- Section 6: Personalized Daily Music Recommendations -->
      ${renderDailyRecommendations()}

      <!-- Section 7: Listen again > -->
      ${rec.length ? `
        <div class="home-section">
          <h2 class="home-section-title" style="display: flex; align-items: center; gap: 6px;">
            Listen again <i class="fa-solid fa-chevron-right" style="font-size: 0.75em; opacity: 0.45;"></i>
          </h2>
          <div class="home-scroll">
            ${rec.map((s, i) => renderHomeScrollCard(s, i, 'listen-again')).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Additional Curated Categories -->
      ${categories.slice(0, 3).map((cat) => `
        <div class="home-section">
          <h2 class="home-section-title">${escapeHTML(cat.title)}</h2>
          <div class="home-scroll">
            ${cat.songs.map((s, i) => renderHomeScrollCard(s, i, cat.id)).join('')}
          </div>
        </div>
      `).join('')}
    </section>
  `;
}

