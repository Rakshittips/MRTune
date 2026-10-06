import { state, STORAGE, showToast } from '../config/config.js';
import { fullscreenPlayer } from '../config/dom.js';
import { escapeHTML, formatTime, saveJSON } from '../utils/utils.js';
import { renderCurrentRoute } from './master.js';
import { play } from './player.js';
import { fetchApi } from '../services/musicApi.js';
import {
  initWavyProgress,
  teardownWavyProgress,
  updateWavyProgress,
} from './wavyProgress.js';

export function renderFullscreenPlayer(force = false) {
  if (!fullscreenPlayer) return;
  if (!state.currentSong || !state.fullscreenPlayer) {
    fullscreenPlayer.classList.remove('active');
    fullscreenPlayer.innerHTML = '';
    delete fullscreenPlayer.dataset.renderedTrackId;
    delete fullscreenPlayer.dataset.renderedKey;
    return;
  }

  try {
    const song = state.currentSong;

    // Track rendering ID including queue mode to allow seamless mode switching
    const renderKey = `${song.id}-${state.fsQueueMode ? 'queue' : 'standard'}-${state.fsMenuOpen ? 'menu' : ''}`;
    if (!force && fullscreenPlayer.dataset.renderedKey === renderKey) {
      return;
    }
    fullscreenPlayer.classList.add('active');
    fullscreenPlayer.dataset.renderedKey = renderKey;
    fullscreenPlayer.dataset.renderedTrackId = String(song.id);

  const isFav = state.favorites.some((item) => item.id === song.id);
  const durSec = Math.max(1, Math.floor(state.duration || song.durationSec || 1));
  const fsMax = durSec;
  const repeatIcon =
    state.repeatMode === 'one' ? 'fa-solid fa-1' : 'fa-solid fa-repeat';

  // Queue tracks calculation
  const currentIdx = state.queue.findIndex((s) => s.id === song.id);
  let upcoming = [];
  if (currentIdx !== -1) {
    upcoming = state.queue.slice(currentIdx);
  } else {
    upcoming = [song, ...state.favorites.filter((s) => s.id !== song.id)];
  }
  if (upcoming.length < 4) {
    const filler = state.favorites.filter((f) => !upcoming.some((u) => u.id === f.id));
    upcoming = [...upcoming, ...filler].slice(0, 6);
  }

  // Popover menu HTML matching Screenshot_20261003_150634.png
  const popoverMenuHTML = state.fsMenuOpen
    ? `
      <div class="fs-popover-backdrop" data-action="close-fs-menu"></div>
      <div class="fs-more-popover-menu" id="fs-more-popover-menu">
        <button class="fs-popover-item" data-action="view-song-album" type="button">
          <i class="fa-regular fa-circle-dot"></i>
          <span>View Album</span>
        </button>
        <button class="fs-popover-item" data-action="open-playlist-picker" data-song-id="${escapeHTML(song.id)}" type="button">
          <i class="fa-solid fa-bars-staggered"></i>
          <span>Add to Playlist</span>
        </button>
        <button class="fs-popover-item" data-action="open-sleep-timer" type="button">
          <i class="fa-regular fa-clock"></i>
          <span>Sleep Timer</span>
        </button>
        <button class="fs-popover-item" data-action="toggle-video" type="button">
          <i class="fa-solid fa-play"></i>
          <span>Watch Video</span>
        </button>
      </div>
    `
    : '';

  // Main content depending on Queue mode
  const mainContentHTML = !state.fsQueueMode
    ? `
      <!-- Standard Fullscreen Artwork View (Screenshot_20261003_150610.png) -->
      <div class="fs-standard-view">
        <div class="fs-main-cover-box">
          <img class="fs-main-cover-img" src="${escapeHTML(song.coverUrl)}" alt="${escapeHTML(song.title)}" />
        </div>
        <div class="fs-track-info-row">
          <div class="fs-track-meta">
            <h2 class="fs-track-title">${escapeHTML(song.title)}</h2>
            <p class="fs-track-subtitle">Song • ${escapeHTML(song.artist || 'Unknown Artist')}</p>
          </div>
          <div class="fs-track-actions">
            <button class="fs-star-btn ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Favorite">
              <i class="${isFav ? 'fa-solid fa-star' : 'fa-regular fa-star'}"></i>
            </button>
            <button class="fs-more-pill-btn" data-action="toggle-fs-menu" type="button" aria-label="More options">
              <i class="fa-solid fa-ellipsis"></i>
            </button>
            ${popoverMenuHTML}
          </div>
        </div>
      </div>
    `
    : `
      <!-- Up Next / Queue View (Screenshot_20261003_150622.png) -->
      <div class="fs-queue-view">
        <div class="fs-compact-track-row">
          <img class="fs-compact-cover-img" src="${escapeHTML(song.coverUrl)}" alt="${escapeHTML(song.title)}" />
          <div class="fs-track-meta">
            <h2 class="fs-track-title">${escapeHTML(song.title)}</h2>
            <p class="fs-track-subtitle">Song • ${escapeHTML(song.artist || 'Unknown Artist')}</p>
          </div>
          <div class="fs-track-actions">
            <button class="fs-star-btn ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Favorite">
              <i class="${isFav ? 'fa-solid fa-star' : 'fa-regular fa-star'}"></i>
            </button>
            <button class="fs-more-pill-btn" data-action="toggle-fs-menu" type="button" aria-label="More options">
              <i class="fa-solid fa-ellipsis"></i>
            </button>
            ${popoverMenuHTML}
          </div>
        </div>

        <!-- 4 Action Pills Row -->
        <div class="fs-mode-pills-row">
          <button class="fs-mode-pill ${state.shuffleMode ? 'active' : ''}" data-action="toggle-shuffle" type="button" aria-label="Shuffle">
            <i class="fa-solid fa-shuffle"></i>
          </button>
          <button class="fs-mode-pill ${state.repeatMode !== 'none' ? 'active' : ''}" data-action="toggle-repeat" type="button" aria-label="Repeat">
            <i class="${repeatIcon}"></i>
          </button>
          <button class="fs-mode-pill ${state.autoplayMode !== false ? 'active-highlight' : ''}" data-action="toggle-autoplay" type="button" aria-label="Autoplay Infinite">
            <i class="fa-solid fa-infinity"></i>
          </button>
          <button class="fs-mode-pill ${state.sleepTimerActive ? 'active' : ''}" data-action="open-sleep-timer" type="button" aria-label="Sleep Timer">
            <i class="fa-solid fa-ban"></i>
          </button>
        </div>

        <!-- Up Next Section -->
        <div class="fs-up-next-section">
          <div class="fs-up-next-header">
            <span class="fs-up-next-title">Up Next</span>
            <span class="fs-up-next-badge">Added by autoplay</span>
          </div>
          <div class="fs-queue-scroll-list">
            ${upcoming.map((qSong, qIdx) => `
              <div class="fs-queue-row ${qSong.id === song.id ? 'is-current' : ''}" data-action="play-song" data-song-id="${escapeHTML(qSong.id)}" data-source="queue">
                <img class="fs-queue-thumb" src="${escapeHTML(qSong.coverUrl)}" alt="" loading="lazy" />
                <div class="fs-queue-info">
                  <div class="fs-queue-title">${escapeHTML(qSong.title)}</div>
                  <div class="fs-queue-artist">${escapeHTML(qSong.artist || 'Unknown')}</div>
                </div>
                <div class="fs-queue-handle">
                  <i class="fa-solid fa-bars"></i>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

  fullscreenPlayer.innerHTML = `
    <div class="fs-ios-backdrop" style="background-image: url('${escapeHTML(song.coverUrl)}');"></div>
    <div class="fs-ios-ambient-overlay"></div>
    <div class="fs-ios-container">
      <!-- Top Navigation & Close Header Bar -->
      <header class="fs-top-bar" aria-label="Player navigation">
        <button class="fs-close-btn" data-action="close-fullscreen-player" type="button" aria-label="Close player" title="Close">
          <i class="fa-solid fa-chevron-down"></i>
          <span>Close</span>
        </button>

        <div class="fs-drag-handle-wrap" data-action="close-fullscreen-player" title="Tap to close">
          <span class="fs-grabber-bar"></span>
        </div>

        <div class="fs-top-spacer" aria-hidden="true"></div>
      </header>

      <!-- Main Body (Standard or Queue) -->
      ${mainContentHTML}

      <!-- Shared Bottom Playback Controls Dock -->
      <div class="fs-playback-dock">
        <!-- Scrubber Timeline -->
        <div class="fs-timeline-container">
          <input id="fs-seekbar" class="fs-ios-slider fs-seekbar" type="range" min="0" max="${fsMax}" step="0.1" value="${state.progress || 0}" aria-label="Playback progress" />
          <div class="fs-time-labels">
            <span id="fs-time-current">${formatTime(state.progress || 0)}</span>
            <span id="fs-time-total">${formatTime(durSec)}</span>
          </div>
        </div>

        <!-- Transport Controls -->
        <div class="fs-main-playback-controls">
          <button class="fs-transport-btn" data-action="prev-track" type="button" aria-label="Previous">
            <i class="fa-solid fa-backward-step"></i>
          </button>
          <button class="fs-transport-btn fs-transport-play" data-action="toggle-play" type="button" aria-label="Play/Pause">
            ${state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'}
          </button>
          <button class="fs-transport-btn" data-action="next-track" type="button" aria-label="Next">
            <i class="fa-solid fa-forward-step"></i>
          </button>
        </div>

        <!-- Volume Slider -->
        <div class="fs-volume-row">
          <i class="fa-solid fa-volume-low fs-volume-icon"></i>
          <input id="fs-volume-slider" class="fs-ios-slider fs-volume-slider" type="range" min="0" max="100" step="1" value="${Math.round((state.volume ?? 0.8) * 100)}" aria-label="Volume" />
          <i class="fa-solid fa-volume-high fs-volume-icon"></i>
        </div>

        <!-- Bottom Icons (Lyrics, Output, Queue) -->
        <div class="fs-bottom-dock-row">
          <button class="fs-dock-btn" data-action="open-lyrics" type="button" aria-label="Lyrics" title="Lyrics">
            <i class="fa-regular fa-message"></i>
          </button>
          <button class="fs-dock-btn" data-action="toggle-audio-output" type="button" aria-label="Audio Output" title="Audio Output">
            <i class="fa-solid fa-tower-broadcast"></i>
          </button>
          <button class="fs-dock-btn ${state.fsQueueMode ? 'fs-dock-queue-active' : ''}" data-action="toggle-fs-queue" type="button" aria-label="Up Next Queue" title="Up Next Queue">
            <i class="fa-solid fa-list-ul"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  } catch (err) {
    console.error('Failed to render fullscreen player:', err);
    fullscreenPlayer.classList.remove('active');
    fullscreenPlayer.innerHTML = '';
  }
}

export async function playYTPlaylist(playlistId) {
  state.isLoading = true;
  renderCurrentRoute();
  try {
    const data = await fetchApi({ type: 'playlist_videos', q: playlistId });
    if (data?.items && data.items.length > 0) {
      const firstSong = data.items[0];
      state.queue = data.items;
      saveJSON(STORAGE.QUEUE, state.queue);
      await play(firstSong, data.items, true);
    } else {
      showToast('Playlist is empty or could not be loaded.');
    }
  } catch (e) {
    showToast('Error loading playlist.');
  }
  state.isLoading = false;
  renderCurrentRoute();
}
