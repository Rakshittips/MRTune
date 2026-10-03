import { state } from '../config/config.js';
import { renderHomeScrollCard } from './components.js';
import { escapeHTML } from '../utils/utils.js';
import { getSongById } from '../core/details.js';

export function renderHomePage() {
  const categories = state.feedCategories || [];
  const rec = Array.isArray(state.recommendedSongs)
    ? state.recommendedSongs.slice(0, 10)
    : [];

  // 1. Recently Played items (fallback to top rec/categories if history is empty)
  let recentSongs = [];
  if (state.recentlyPlayed && state.recentlyPlayed.length) {
    recentSongs = state.recentlyPlayed.map((id) => getSongById(id)).filter(Boolean);
  }
  if (!recentSongs.length && rec.length) {
    recentSongs = rec.slice(0, 6);
  } else if (!recentSongs.length && categories[0]?.songs) {
    recentSongs = categories[0].songs.slice(0, 6);
  }

  // 2. Quick Picks (4 tracks)
  let quickPickSongs = [];
  if (rec.length >= 4) {
    quickPickSongs = rec.slice(0, 4);
  } else if (categories[0]?.songs?.length >= 4) {
    quickPickSongs = categories[0].songs.slice(0, 4);
  } else if (recentSongs.length >= 4) {
    quickPickSongs = recentSongs.slice(0, 4);
  } else {
    categories.forEach((cat) => {
      cat.songs.forEach((s) => {
        if (quickPickSongs.length < 4 && !quickPickSongs.some((q) => q.id === s.id)) {
          quickPickSongs.push(s);
        }
      });
    });
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
  if (!favoriteSongs.length && categories[1]?.songs) {
    favoriteSongs = categories[1].songs.slice(0, 6);
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
        <button class="profile-popover-item" data-action="open-rate-modal" type="button">
          <i class="fa-solid fa-star"></i>
          <span>Rate the app</span>
        </button>
        <a class="profile-popover-item" href="https://instagram.com" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-instagram"></i>
          <span>Instagram</span>
        </a>
        <button class="profile-popover-item" data-action="open-support-modal" type="button">
          <i class="fa-solid fa-circle-dollar-to-slot"></i>
          <span>Support to keep the app free forever</span>
        </button>
      </div>
    `
    : '';

  const avatarInitial = state.userName ? escapeHTML(state.userName.charAt(0).toUpperCase()) : 'A';

  // Skeleton loading state
  if (state.isLoading) {
    return `
      <section class="page" style="background:#000000;">
        <div class="home-greeting" style="position: relative; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h1 style="font-size: 2.1rem; font-weight: 800; letter-spacing: -0.025em; color: #ffffff;">Listen Now</h1>
          <button class="ios-pink-avatar" data-action="toggle-profile-popover" type="button">${avatarInitial}</button>
        </div>
        <div class="home-section">
          <div class="skeleton skeleton-text-main" style="width: 180px; height: 24px; margin-bottom: 16px;"></div>
          <div class="home-scroll" style="display:flex; overflow:hidden; gap:16px;">
            ${Array(4).fill('').map(() => `
              <div class="home-scroll-card" style="pointer-events:none; flex-shrink:0;">
                <div class="skeleton" style="width:140px; height:140px; border-radius:14px; margin-bottom:12px;"></div>
                <div class="skeleton skeleton-text-main" style="width: 80%; margin: 0 0 8px 0; height:14px;"></div>
                <div class="skeleton skeleton-text-sub" style="width: 50%; margin: 0; height:12px;"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="page" style="background:#000000;">
      <!-- iOS Listen Now Header -->
      <div class="home-greeting" style="position: relative; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h1 style="font-size: 2.15rem; font-weight: 800; letter-spacing: -0.025em; color: #ffffff; margin: 0;">Listen Now</h1>
        <button class="ios-pink-avatar" data-action="toggle-profile-popover" type="button" aria-label="Profile menu" title="Profile menu">
          ${avatarInitial}
        </button>
        ${popoverMenuHTML}
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
          <h2 class="home-section-title" style="margin-bottom: 12px;">Quick picks</h2>
          <div class="quick-picks-container">
            ${quickPickSongs.map((s) => {
              const isCurrent = state.currentSong?.id === s.id;
              const isPlaying = isCurrent && state.isPlaying;
              return `
                <div class="quick-pick-row" data-action="play-song" data-song-id="${escapeHTML(s.id)}" data-source="quick-picks" type="button">
                  <div class="quick-pick-thumb-box">
                    <img src="${escapeHTML(s.coverUrl)}" alt="${escapeHTML(s.title)}" class="quick-pick-thumb-img" loading="lazy" />
                    ${isCurrent ? `
                      <div class="quick-pick-playing-overlay">
                        <i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                      </div>
                    ` : ''}
                  </div>
                  <div class="quick-pick-meta">
                    <span class="quick-pick-title">${escapeHTML(s.title)}</span>
                    <span class="quick-pick-sub">${escapeHTML(s.artist)} • ${Math.floor(Math.random() * 400 + 40)}M plays</span>
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

      <!-- Section 3: Forgotten favorites > -->
      <div class="home-section">
        <h2 class="home-section-title" style="display: flex; align-items: center; gap: 6px; cursor: pointer;" data-route="/playlist/favorites">
          Forgotten favorites <i class="fa-solid fa-chevron-right" style="font-size: 0.75em; opacity: 0.45;"></i>
        </h2>
        <div class="home-scroll">
          ${likedCardHTML}
          ${favoriteSongs.map((s, i) => renderHomeScrollCard(s, i, 'favorites')).join('')}
        </div>
      </div>

      <!-- Section 4: Listen again > -->
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

