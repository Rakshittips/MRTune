import { navigate, parseRoute } from '../config/router.js';
import { state, showToast } from '../config/config.js';
import { renderLyricsPanel } from '../components/lyrics.js';
import { dedupeSongs } from '../core/details.js';
import { saveJSON } from '../utils/utils.js';

export function setupSwipeGestures() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;
  let songRowTarget = null;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return; // Ignore multi-touch
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchMoved = false;
    songRowTarget = e.target.closest('.song-row');
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    touchMoved = true;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY || !touchMoved) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    const startX = touchStartX;
    touchStartX = 0;
    touchStartY = 0;

    // 1. Optional back gesture to dismiss lyrics page (swipe right from body or left edge)
    if (state.lyricsPanel && state.lyricsBackGesture !== false) {
      if (deltaX > 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        state.lyricsPanel = false;
        renderLyricsPanel();
        showToast('Dismissed lyrics');
        return;
      }
    }

    // 2. Song Row Swipe-to-add to Queue
    // Fixed: Require intentional horizontal flick (> 95px, 2.2x vertical) to prevent accidental drags while scrolling
    if (songRowTarget && Math.abs(deltaX) > 95 && Math.abs(deltaX) > Math.abs(deltaY) * 2.2) {
      const songId = songRowTarget.dataset.songId;
      if (songId && deltaX > 0) {
        // Swipe right -> Add to Queue
        const allSongs = [
          ...(state.favorites || []),
          ...(state.queue || []),
          ...(state.trendingSongs || []),
          ...(state.downloads || []),
          ...(state.localSongs || []),
        ];
        const targetSong = allSongs.find((s) => s.id === songId);
        if (targetSong) {
          if (!state.queue) state.queue = [];
          if (!state.queue.some((s) => s.id === targetSong.id)) {
            state.queue.push(targetSong);
            saveJSON('pawtify-queue', state.queue);
            showToast(`Added "${targetSong.title}" to Queue!`);
          } else {
            showToast(`"${targetSong.title}" is already in Queue.`);
          }
          return;
        }
      }
    }

    // 3. Check if it's a primarily horizontal swipe between app tabs
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 85) {
      // Ignore if target is a range input (e.g., volume/seek sliders)
      if (e.target.tagName && e.target.tagName.toLowerCase() === 'input' && e.target.type === 'range') return;

      // Ignore if swiping on a horizontally scrollable container
      let el = e.target;
      while (el && el !== document.body) {
        if (el.scrollWidth > el.clientWidth) {
          const style = window.getComputedStyle(el);
          if (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') {
            return;
          }
        }
        el = el.parentElement;
      }

      // Ignore if any modal/panel is open
      if (state.fullscreenPlayer || state.artistProfile || state.queuePanel || state.lyricsPanel || state.modal) return;

      // Ignore swipes on the player UI area
      if (e.target.closest('#mini-player') || e.target.closest('#player-bar')) return;

      const routes = ['/', '/search', '/library'];
      
      const routeInfo = parseRoute();
      let currentPath = '/';
      if (routeInfo.name === 'search') currentPath = '/search';
      else if (routeInfo.name === 'library') currentPath = '/library';
      else if (routeInfo.name === 'home') currentPath = '/';
      else return; // If we are on a playlist page or song page, ignore swipe tabs

      const currentIdx = routes.indexOf(currentPath);
      if (currentIdx === -1) return; 

      if (deltaX < 0) {
        // Swipe left -> next tab
        if (currentIdx < routes.length - 1) {
          navigate(routes[currentIdx + 1]);
        }
      } else {
        // Swipe right -> prev tab
        if (currentIdx > 0) {
          navigate(routes[currentIdx - 1]);
        }
      }
    }
  });
}
