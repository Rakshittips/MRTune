import { state, DAILY_CAT_MIXES } from '../config/config.js';
import { escapeHTML } from '../utils/utils.js';

export function renderDailyRecommendations() {
  const mixes = DAILY_CAT_MIXES || [];

  return `
    <div class="home-section" style="margin-bottom: 36px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; padding: 0 16px;">
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--green); font-weight: 700; margin-bottom: 4px;">
            <i class="fa-solid fa-sparkles" style="margin-right: 6px;"></i> Daily Personalized Mixes
          </div>
          <h2 class="home-section-title" style="margin-bottom: 2px;">
            Personalized Daily Music Recommendations
          </h2>
          <p style="font-size: 0.85rem; color: var(--muted); margin: 0;">
            Curated daily acoustic, purr, and ambient soundscapes tuned for your cat's mood and calm.
          </p>
        </div>
      </div>

      <div class="home-scroll" style="padding: 0 16px; gap: 18px;">
        ${mixes
          .map(
            (mix, idx) => `
          <div class="card home-scroll-card daily-mix-card" style="width: 220px; flex-shrink: 0; background: var(--liquid-card); border: 1px solid var(--liquid-border); border-radius: var(--radius-md); padding: 14px; position: relative;" data-action="play-daily-mix" data-mix-id="${escapeHTML(mix.id)}">
            <div class="card-cover-wrap" style="position: relative; width: 100%; aspect-ratio: 1/1; border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
              <img src="${escapeHTML(mix.coverUrl)}" alt="${escapeHTML(mix.title)}" class="card-cover" style="width: 100%; height: 100%; object-fit: cover;" />
              <div style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); border-radius: 4px; padding: 3px 8px; font-size: 0.7rem; font-weight: 700; color: #fff; border: 1px solid rgba(255,255,255,0.1);">
                Mix #${idx + 1}
              </div>
              <button class="card-play-btn" data-action="play-daily-mix" data-mix-id="${escapeHTML(mix.id)}" type="button" aria-label="Play ${escapeHTML(mix.title)}">
                <i class="fa-solid fa-play"></i>
              </button>
            </div>
            <h3 class="card-title" style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 4px; line-height: 1.2;">
              ${escapeHTML(mix.title)}
            </h3>
            <p class="card-meta" style="font-size: 0.775rem; color: var(--muted); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${escapeHTML(mix.subtitle)}
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.75rem; color: var(--muted);">
              <span>${mix.songs.length} Tracks</span>
              <span style="color: var(--green); font-weight: 600;"><i class="fa-solid fa-bolt" style="margin-right: 4px;"></i>Ready to play</span>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}
