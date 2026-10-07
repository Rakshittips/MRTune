import { state, showToast } from '../config/config.js';
import { lyricsPanel } from '../config/dom.js';
import { escapeHTML } from '../utils/utils.js';

let touchStartY = 0;
let touchStartX = 0;

export function renderLyricsPanel() {
  if (!lyricsPanel) return;
  if (!state.lyricsPanel) {
    lyricsPanel.classList.remove('active');
    lyricsPanel.innerHTML = '';
    return;
  }
  lyricsPanel.classList.add('active');
  const song = state.currentSong;
  lyricsPanel.innerHTML = `
     <div class="lyrics-drag-handle-wrap" data-action="close-lyrics">
       <span class="lyrics-grabber-bar"></span>
     </div>
     <div class="lyrics-header">
       <button class="lyrics-back-gesture-pill" data-action="close-lyrics" type="button" aria-label="Dismiss lyrics">
         <i class="fa-solid fa-chevron-down"></i>
         <span>Swipe down or back</span>
       </button>
       <button class="icon-btn" data-action="close-lyrics" type="button" aria-label="Close">
         <i class="fa-solid fa-xmark"></i>
       </button>
     </div>
     <div class="lyrics-body">
       <div class="lyrics-ambient-glow"></div>
       <div class="empty-state" style="padding: 40px 20px; text-align: center;">
         <i class="fa-solid fa-microphone" style="font-size: 2.5rem; margin-bottom: 16px; color: var(--green);"></i>
         <h2 style="font-size: 1.4rem; margin-bottom: 8px;">${song ? escapeHTML(song.title) : 'Lyrics'}</h2>
         <p style="color: var(--muted); margin-bottom: 16px;">${song ? escapeHTML(song.artist || song.uploaderName || '') : ''}</p>
         <p style="color: var(--text-secondary); font-size: 0.9rem; max-width: 320px; margin: 0 auto; line-height: 1.5;">Live synchronized lyrics are currently not available for this stream.</p>
       </div>
     </div>
   `;

  // Attach touch back gesture listeners to lyricsPanel
  lyricsPanel.ontouchstart = (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  lyricsPanel.ontouchend = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    // Swipe down (> 60px) or swipe right (> 70px) to dismiss lyrics page
    if (deltaY > 60 || (deltaX > 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3)) {
      state.lyricsPanel = false;
      renderLyricsPanel();
      showToast('Lyrics dismissed');
    }
  };
}
