import { loadJSON, saveJSON } from '../utils/utils.js';
import { state, showToast } from '../config/config.js';

export const THEME_MODE_STORAGE_KEY = 'mrtune_theme_mode';

/**
 * Initializes and binds Material 3 Theme Manager
 * Supports 'light', 'dark', 'system' with frosted glass surfaces
 */
export function initThemeManager() {
  const savedMode = loadJSON(THEME_MODE_STORAGE_KEY, 'dark'); // default dark/AMOLED
  state.themeMode = savedMode;
  applyThemeMode(savedMode, false);

  // Listen to system changes when in 'system' mode
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (state.themeMode === 'system') {
      applyThemeMode('system', false);
    }
  });
}

/**
 * Applies the selected theme mode ('light', 'dark', 'system')
 */
export function applyThemeMode(mode, showNotice = true) {
  state.themeMode = mode;
  saveJSON(THEME_MODE_STORAGE_KEY, mode);

  const root = document.documentElement;
  const isDark =
    mode === 'dark'
      ? true
      : mode === 'light'
      ? false
      : window.matchMedia('(prefers-color-scheme: dark)').matches;

  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  root.setAttribute('data-theme-mode', mode);

  document.body.classList.toggle('theme-light', !isDark);
  document.body.classList.toggle('theme-dark', isDark);

  if (showNotice) {
    const label = mode === 'system' ? 'System Theme (Auto)' : mode === 'light' ? 'Material 3 Light (Frosted)' : 'Material 3 AMOLED Dark';
    showToast(`Switched to ${label}`);
  }
}
