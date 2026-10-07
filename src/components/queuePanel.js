import { state, STORAGE, showToast } from '../config/config.js';
import { queuePanel, miniPlayer } from '../config/dom.js';
import { escapeHTML, saveJSON, formatTime } from '../utils/utils.js';
import { renderPlayerBar } from './playerBar.js';
import { previousTrack, nextTrack, play } from './player.js';
import { renderFullscreenPlayer } from './fullscreen.js';

export function renderQueuePanel() {
  if (!queuePanel) return;
  if (!state.queuePanel) {
    queuePanel.classList.remove('active');
    queuePanel.innerHTML = '';
    return;
  }
  queuePanel.classList.add('active');
  const queue = state.queue || [];
  const currentIdx = state.currentSongIndex || 0;

  const nowPlaying =
    currentIdx >= 0 && currentIdx < queue.length ? queue[currentIdx] : state.currentSong;
  const upcoming = queue.slice(currentIdx + 1);
  const previous = queue.slice(0, currentIdx);

  // Calculate total upcoming queue duration
  const totalUpcomingSec = upcoming.reduce((acc, s) => acc + (s.durationSec || 190), 0);
  const totalDurationStr = formatTime(totalUpcomingSec);

  queuePanel.innerHTML = `
    <div class="queue-liquid-glass-drawer">
      <!-- Top Grabber Bar -->
      <div class="queue-drag-handle-wrap" data-action="close-queue">
        <span class="queue-grabber-pill"></span>
      </div>

      <!-- Header with Liquid Glass Pill Actions -->
      <div class="queue-header">
        <div class="queue-title-wrap">
          <h2><i class="fa-solid fa-layer-group" style="margin-right:8px; color:var(--green);"></i>Play Queue</h2>
          <span class="queue-stats-badge">${queue.length} track${queue.length === 1 ? '' : 's'} • ${totalDurationStr}</span>
        </div>
        <div class="queue-header-actions">
          <button class="queue-pill-action" data-action="save-queue-as-playlist" type="button" title="Save queue as new playlist">
            <i class="fa-solid fa-plus"></i> Save
          </button>
          <button class="queue-pill-action" data-action="clear-queue" type="button" title="Clear upcoming tracks">
            <i class="fa-solid fa-trash-can"></i> Clear
          </button>
          <button class="queue-close-circle-btn" data-action="close-queue" type="button" aria-label="Close Queue">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- Queue Body -->
      <div class="queue-list-scroll">
        ${!queue.length ? `
          <div class="empty-state">
            <div class="empty-state-icon-box"><i class="fa-solid fa-list-ul"></i></div>
            <h2>Queue is empty</h2>
            <p>Add songs or start an album to populate your upcoming queue.</p>
          </div>
        ` : ''}

        <!-- 1. Now Playing Card -->
        ${nowPlaying ? `
          <div class="queue-section-header">
            <span>NOW PLAYING</span>
            <span class="queue-source-tag">${nowPlaying.isLocal ? 'Local Audio' : 'YouTube Stream'}</span>
          </div>
          <div class="queue-item active-queue-item" data-action="open-fullscreen-player">
            <div class="queue-item-left">
              <div class="queue-eq-bars">
                <span class="eq-b1"></span>
                <span class="eq-b2"></span>
                <span class="eq-b3"></span>
              </div>
              <img class="queue-item-cover" src="${escapeHTML(nowPlaying.coverUrl)}" alt="" />
            </div>
            <div class="queue-item-info">
              <div class="queue-item-title">${escapeHTML(nowPlaying.title)}</div>
              <div class="queue-item-artist">${escapeHTML(nowPlaying.artist || 'Unknown Artist')}</div>
            </div>
            <div class="queue-item-right">
              <span class="queue-track-duration">${escapeHTML(nowPlaying.duration || '3:30')}</span>
              <button class="queue-action-pill-btn" data-action="open-fullscreen-player" type="button" title="Open Fullscreen Player">
                <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- 2. Next Up List -->
        ${upcoming.length ? `
          <div class="queue-section-header">
            <span>NEXT UP (${upcoming.length})</span>
            <button class="queue-section-action-btn" data-action="toggle-shuffle" type="button">
              <i class="fa-solid fa-shuffle"></i> Shuffle
            </button>
          </div>
          <div class="queue-items-container">
            ${upcoming.map((s, i) => {
              const overallIdx = currentIdx + i + 1;
              return `
              <div class="queue-item upcoming-item" data-action="play-song" data-song-id="${escapeHTML(s?.id || '')}" data-source="queue">
                <div class="queue-item-left">
                  <div class="queue-track-num">${overallIdx + 1}</div>
                  <img class="queue-item-cover" src="${escapeHTML(s?.coverUrl || '')}" alt="" loading="lazy" />
                </div>
                <div class="queue-item-info">
                  <div class="queue-item-title">${escapeHTML(s?.title || '')}</div>
                  <div class="queue-item-artist">${escapeHTML(s?.artist || 'Unknown')}</div>
                </div>
                <div class="queue-item-right">
                  <span class="queue-track-duration">${escapeHTML(s?.duration || '3:30')}</span>
                  <button class="queue-item-remove-btn" data-action="remove-from-queue" data-song-id="${escapeHTML(s?.id || '')}" type="button" onclick="event.stopPropagation();" aria-label="Remove">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            `;
            }).join('')}
          </div>
        ` : ''}

        <!-- 3. Previously Played -->
        ${previous.length ? `
          <div class="queue-section-header">
            <span>PREVIOUS (${previous.length})</span>
          </div>
          <div class="queue-items-container previous-items-container">
            ${previous.map((s, i) => `
              <div class="queue-item previous-item" data-action="play-song" data-song-id="${escapeHTML(s?.id || '')}" data-source="queue">
                <div class="queue-item-left">
                  <div class="queue-track-num muted-num">${i + 1}</div>
                  <img class="queue-item-cover muted-cover" src="${escapeHTML(s?.coverUrl || '')}" alt="" loading="lazy" />
                </div>
                <div class="queue-item-info">
                  <div class="queue-item-title muted-title">${escapeHTML(s?.title || '')}</div>
                  <div class="queue-item-artist muted-artist">${escapeHTML(s?.artist || 'Unknown')}</div>
                </div>
                <div class="queue-item-right">
                  <span class="queue-track-duration">${escapeHTML(s?.duration || '3:30')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Bottom Floating Liquid Bar with Infinite Queue Switch -->
      <div class="queue-bottom-bar">
        <div class="queue-infinite-toggle-row">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-infinity" style="color:var(--green); font-size:1.1rem;"></i>
            <div>
              <div style="font-size:0.85rem; font-weight:700; color:#fff;">Infinite Autoplay</div>
              <div style="font-size:0.72rem; color:var(--muted);">Queue similar tracks when playback ends</div>
            </div>
          </div>
          <label class="liquid-switch">
            <input type="checkbox" ${state.autoplayMode !== false ? 'checked' : ''} data-action="toggle-autoplay" />
            <span class="liquid-switch-slider"></span>
          </label>
        </div>
      </div>
    </div>
  `;
}

export function removeFromQueue(songId) {
  const idx = state.queue.findIndex((s) => s.id === songId);
  if (idx === -1) return;
  if (idx < state.currentSongIndex) state.currentSongIndex--;
  else if (idx === state.currentSongIndex) return;
  state.queue = state.queue.filter((s) => s.id !== songId);
  saveJSON(STORAGE.QUEUE, state.queue);
  showToast('Removed from queue');
  renderQueuePanel();
  renderPlayerBar();
}

export function clearQueue() {
  if (!state.currentSong) state.queue = [];
  else {
    state.queue = [state.currentSong];
    state.currentSongIndex = 0;
  }
  saveJSON(STORAGE.QUEUE, state.queue);
  showToast('Cleared upcoming queue');
  renderQueuePanel();
  renderPlayerBar();
}

// Mobile mini-player swipe gestures
export let miniPlayerTouchStartX = 0;
export let miniPlayerTouchStartY = 0;
export const SWIPE_THRESHOLD = 50;

if (miniPlayer) {
  miniPlayer.addEventListener(
    'touchstart',
    (e) => {
      miniPlayerTouchStartX = e.changedTouches[0].screenX;
      miniPlayerTouchStartY = e.changedTouches[0].screenY;
    },
    { passive: true }
  );
  miniPlayer.addEventListener(
    'touchend',
    (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - miniPlayerTouchStartX;
      const diffY = touchEndY - miniPlayerTouchStartY;
      // Ignore short swipes
      if (
        Math.abs(diffX) < SWIPE_THRESHOLD &&
        Math.abs(diffY) < SWIPE_THRESHOLD
      ) {
        return;
      }
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          previousTrack();
        } else {
          nextTrack();
        }
      } else {
        if (diffY < 0) {
          state.fullscreenPlayer = true;
          renderFullscreenPlayer();
        }
      }
    },
    { passive: true }
  );
}
