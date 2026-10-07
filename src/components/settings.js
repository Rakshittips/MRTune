import { state, LOGO_URL } from '../config/config.js';
import { escapeHTML } from '../utils/utils.js';

export function renderSettingsPage() {
  return `
    <section class="page settings-page">
      <!-- Top Title -->
      <div class="settings-header">
        <h1 class="settings-title">Settings</h1>
      </div>

      <!-- Hero Icon + General Info -->
      <div class="settings-hero">
        <div class="settings-hero-icon-box">
          <i class="fa-solid fa-gear"></i>
        </div>
        <h2 class="settings-hero-heading">General</h2>
        <p class="settings-hero-description">
          Manage your overall setup and preferences for iMusic, such as Themes, Color modes, Music playback settings etc.
        </p>
      </div>

      <!-- Grouped Settings List -->
      <div class="settings-group-list">
        <!-- 1. Theme -->
        <button class="settings-item-row" data-action="open-settings-theme" type="button">
          <div class="settings-item-icon" style="background: #0a84ff;">
            <i class="fa-solid fa-sun"></i>
          </div>
          <div class="settings-item-content">
            <span class="settings-item-title">Theme</span>
            <span class="settings-item-subtitle">${state.themeMode === 'light' ? 'Material 3 Light (Frosted)' : state.themeMode === 'system' ? 'System Theme (Auto)' : 'Material 3 AMOLED Dark'}</span>
          </div>
          <i class="fa-solid fa-chevron-right settings-item-chevron"></i>
        </button>

        <!-- 2. App UI -->
        <button class="settings-item-row" data-action="open-settings-ui" type="button">
          <div class="settings-item-icon" style="background: #ff9f0a;">
            <i class="fa-solid fa-mobile-screen"></i>
          </div>
          <div class="settings-item-content">
            <span class="settings-item-title">App UI</span>
            <span class="settings-item-subtitle">${state.liquidGlass !== false ? 'Liquid Glass (ON)' : 'Liquid Glass (High Performance)'}</span>
          </div>
          <i class="fa-solid fa-chevron-right settings-item-chevron"></i>
        </button>

        <!-- 3. Music & Playback -->
        <button class="settings-item-row" data-action="open-settings-playback" type="button">
          <div class="settings-item-icon" style="background: #ff2d55;">
            <i class="fa-solid fa-music"></i>
          </div>
          <div class="settings-item-content">
            <span class="settings-item-title">Music &amp; Playback</span>
            <span class="settings-item-subtitle">Quality, Gapless, Sleep Timer</span>
          </div>
          <i class="fa-solid fa-chevron-right settings-item-chevron"></i>
        </button>

        <!-- 4. Others -->
        <button class="settings-item-row" data-action="open-settings-others" type="button">
          <div class="settings-item-icon" style="background: #8e8e93;">
            <i class="fa-solid fa-gear"></i>
          </div>
          <div class="settings-item-content">
            <span class="settings-item-title">Others</span>
            <span class="settings-item-subtitle">Cache, Storage, Data Saver</span>
          </div>
          <i class="fa-solid fa-chevron-right settings-item-chevron"></i>
        </button>

        <!-- 5. Backup & Restore -->
        <button class="settings-item-row" data-action="open-settings-backup" type="button">
          <div class="settings-item-icon" style="background: #34c759;">
            <i class="fa-solid fa-rotate"></i>
          </div>
          <div class="settings-item-content">
            <span class="settings-item-title">Backup &amp; Restore</span>
            <span class="settings-item-subtitle">Export/Import Playlists &amp; Library</span>
          </div>
          <i class="fa-solid fa-chevron-right settings-item-chevron"></i>
        </button>

        <!-- 6. Scrobbling -->
        <button class="settings-item-row" data-action="open-scrobbler-settings" type="button">
          <div class="settings-item-icon" style="background: #ff2d55;">
            <i class="fa-solid fa-headphones"></i>
          </div>
          <div class="settings-item-content">
            <span class="settings-item-title">Scrobbling</span>
            <span class="settings-item-subtitle">Last.fm &amp; ListenBrainz</span>
          </div>
          <i class="fa-solid fa-chevron-right settings-item-chevron"></i>
        </button>

        <!-- 7. Patch Notes -->
        <button class="settings-item-row" data-action="open-patch-notes" type="button">
          <div class="settings-item-icon" style="background: #ff9f0a;">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div class="settings-item-content">
            <span class="settings-item-title">Patch Notes</span>
            <span class="settings-item-subtitle">v2.4.2 • Offline downloads, Scrobbling, Theming</span>
          </div>
          <i class="fa-solid fa-chevron-right settings-item-chevron"></i>
        </button>

        <!-- 8. About -->
        <button class="settings-item-row" data-action="open-settings-about" type="button">
          <div class="settings-item-icon" style="background: #636366;">
            <i class="fa-solid fa-circle-info"></i>
          </div>
          <div class="settings-item-content">
            <span class="settings-item-title">About</span>
            <span class="settings-item-subtitle">Version, Credits, Shortcuts</span>
          </div>
          <i class="fa-solid fa-chevron-right settings-item-chevron"></i>
        </button>

        <!-- 9. Instagram -->
        <a class="settings-item-row" href="https://www.instagram.com/mr._rakshit_2.0" target="_blank" rel="noopener noreferrer" style="border: 1px solid rgba(225,48,108,0.25); background: rgba(225,48,108,0.06);">
          <div class="settings-item-icon" style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);">
            <i class="fa-brands fa-instagram" style="color: #fff;"></i>
          </div>
          <div class="settings-item-content">
            <span class="settings-item-title" style="color: #fff;">Instagram</span>
            <span class="settings-item-subtitle" style="color: #ff85a2;">@mr._rakshit_2.0</span>
          </div>
          <i class="fa-solid fa-arrow-up-right-from-square settings-item-chevron" style="color: rgba(255,255,255,0.4);"></i>
        </a>

        <!-- 10. Support & Donate -->
        <button class="settings-item-row" data-action="open-support-modal" type="button" style="border: 1px solid rgba(255,45,85,0.25); background: rgba(255,45,85,0.06);">
          <div class="settings-item-icon" style="background: #ff2d55;">
            <i class="fa-solid fa-heart"></i>
          </div>
          <div class="settings-item-content">
            <span class="settings-item-title" style="color: #fff;">Support MRTune</span>
            <span class="settings-item-subtitle" style="color: #ff7597;">Support to keep the app free forever</span>
          </div>
          <i class="fa-solid fa-chevron-right settings-item-chevron"></i>
        </button>
      </div>
    </section>
  `;
}
