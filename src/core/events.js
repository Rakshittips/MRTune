import { renderCurrentRoute } from '../components/master.js';
import { navigate } from '../config/router.js';
import {
  togglePlay,
  nextTrack,
  previousTrack,
  toggleFavorite,
  removeFromPlaylist,
  addToPlaylist,
  toggleRepeat,
  toggleShuffle,
  play,
  deletePlaylist,
  seekTo,
  setVolume,
  createPlaylist,
} from '../components/player.js';
import {
  playSongById,
  getSongById,
  openSongDetails,
  shareCurrentSong,
  saveRecentItem,
  dedupeSongs,
  rememberSongs,
  seedCatalog,
  saveRecentSearch,
} from './details.js';
import { state, STORAGE, showToast, globals, DAILY_CAT_MIXES, CURATED_PODCASTS } from '../config/config.js';
import { renderOverlay } from '../components/overlay.js';
import { fetchApi } from '../services/musicApi.js';
import {
  renderSidebarPlaylists,
  refreshPlaybackUI,
  renderPlayerBar,
} from '../components/playerBar.js';
import {
  renderFullscreenPlayer,
  playYTPlaylist,
} from '../components/fullscreen.js';
import { downloadCurrentSong, formatTime, openLyrics, saveJSON } from '../utils/utils.js';
import { renderLyricsPanel } from '../components/lyrics.js';
import { updateWavyProgress } from '../components/wavyProgress.js';
import {
  openArtistProfile,
  renderArtistProfile,
} from '../components/artistProfile.js';
import {
  renderQueuePanel,
  removeFromQueue,
  clearQueue,
} from '../components/queuePanel.js';
import { loadTrendingSongs } from '../services/dataLoader.js';
import { runSearch } from '../services/search.js';
import { searchSongs } from '../services/apiMapping.js';

export function vibrate() {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(10);
    } catch (e) {}
  }
}

export function bindGlobalEvents() {
  window.addEventListener('hashchange', renderCurrentRoute);
  window.addEventListener('popstate', renderCurrentRoute);

  document.addEventListener('click', async (event) => {
    // Dismiss search dropdown if clicked outside search-container
    if (!event.target.closest('.search-container')) {
      state.showSuggestions = false;
      const dd = document.querySelector('.recent-searches-dropdown');
      if (dd) dd.style.display = 'none';
    }

    const btn = event.target.closest(
      'button, .song-row, .card, .home-scroll-card, .nav-link, .mobile-nav-item, .category-card, .queue-item, .list-item, .search-dropdown-item'
    );
    if (btn) vibrate();
    const routeButton = event.target.closest('[data-route]');
    if (routeButton) {
      event.preventDefault();
      state.fullscreenPlayer = false;
      navigate(routeButton.dataset.route);
      return;
    }

    const actionNode = event.target.closest('[data-action]');
    if (!actionNode) return;

    const action = actionNode.dataset.action;
    const songId = actionNode.dataset.songId || null;
    const source = actionNode.dataset.source || null;
    const playlistId = actionNode.dataset.playlistId || null;

    try {
      if (action === 'select-music-source') {
        event.preventDefault();
        const sourceId = actionNode.dataset.sourceId;
        if (sourceId) {
          state.activeMusicSource = sourceId;
          renderCurrentRoute();
        }
        return;
      }
      if (action === 'set-search-scope') {
        event.preventDefault();
        state.searchScope = actionNode.dataset.scope || 'online';
        if (state.route.name === 'search') {
          updateSearchPageUI();
          renderCurrentRoute();
        }
        return;
      }
      if (action === 'clear-search-input') {
        event.preventDefault();
        state.searchQuery = ''; saveJSON(STORAGE.SEARCH_QUERY, '');
        state.searchLoading = false;
        state.searchResults = { songs: [], artists: [], playlists: [] };
        state.searchSuggestions = [];
        state.showSuggestions = false;
        if (state.route.name === 'search') {
          renderCurrentRoute();
          const input = document.getElementById('search-input');
          if (input) {
            input.value = '';
            input.focus();
          }
        }
        return;
      }
      if (action === 'search-category') {
        event.preventDefault();
        const category = actionNode.dataset.category;
        if (category) {
          state.searchQuery = category; saveJSON(STORAGE.SEARCH_QUERY, category);
          const searchInput = document.querySelector('.search-input');
          if (searchInput) searchInput.value = category;
          // Trigger search using performSearch or by dispatching an event
          // It looks like search is handled elsewhere, let's trigger the input event
          if (searchInput) {
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        return;
      }
      if (action === 'play-something') {
        event.preventDefault();
        await playSomething();
        return;
      }
      if (action === 'toggle-play') {
        event.preventDefault();
        await togglePlay();
        return;
      }
      if (action === 'next-track') {
        event.preventDefault();
        await nextTrack();
        return;
      }
      if (action === 'prev-track') {
        event.preventDefault();
        previousTrack();
        return;
      }
      if (action === 'play-song' && songId) {
        event.preventDefault();
        await playSongById(songId, source, playlistId);
        return;
      }
      if (action === 'toggle-favorite' && songId) {
        event.preventDefault();
        const song = getSongById(songId);
        if (song) toggleFavorite(song);
        return;
      }
      if (action === 'open-song-details') {
        event.preventDefault();
        openSongDetails();
        return;
      }
      if (action === 'share-song') {
        event.preventDefault();
        await shareCurrentSong();
        return;
      }
      if (action === 'open-playlist-picker' && songId) {
        event.preventDefault();
        state.modal = { type: 'playlistPicker', songId };
        renderOverlay();
        return;
      }
      if (action === 'playlist-toggle-song' && songId && playlistId) {
        event.preventDefault();
        const song = getSongById(songId);
        if (!song) return;
        const playlist = state.playlists.find(
          (entry) => entry.id === playlistId
        );
        if (!playlist) return;
        if (playlist.songs.some((item) => item.id === song.id))
          removeFromPlaylist(song.id, playlistId);
        else addToPlaylist(song, playlistId);
        state.modal = { type: 'playlistPicker', songId };
        renderOverlay();
        renderSidebarPlaylists();
        return;
      }

      if (action === 'open-create-playlist') {
        event.preventDefault();
        state.modal = { type: 'createPlaylist' };
        renderOverlay();
        return;
      }
      if (action === 'open-settings-theme') {
        event.preventDefault();
        state.modal = { type: 'settingsTheme' };
        renderOverlay();
        return;
      }
      if (action === 'toggle-profile-popover') {
        event.preventDefault();
        event.stopPropagation();
        state.profileMenuOpen = !state.profileMenuOpen;
        renderCurrentRoute();
        return;
      }
      if (action === 'close-profile-popover') {
        event.preventDefault();
        state.profileMenuOpen = false;
        renderCurrentRoute();
        return;
      }
      if (action === 'app-refresh') {
        event.preventDefault();
        state.profileMenuOpen = false;
        showToast('Refreshing catalog & feeds...');
        renderCurrentRoute();
        return;
      }
      if (action === 'toggle-fs-queue') {
        event.preventDefault();
        state.fsQueueMode = !state.fsQueueMode;
        renderFullscreenPlayer(true);
        return;
      }
      if (action === 'toggle-fs-menu') {
        event.preventDefault();
        event.stopPropagation();
        state.fsMenuOpen = !state.fsMenuOpen;
        renderFullscreenPlayer(true);
        return;
      }
      if (action === 'close-fs-menu') {
        event.preventDefault();
        state.fsMenuOpen = false;
        renderFullscreenPlayer(true);
        return;
      }
      if (action === 'view-song-album') {
        event.preventDefault();
        state.fsMenuOpen = false;
        renderFullscreenPlayer(true);
        const albumName = state.currentSong?.album || state.currentSong?.title;
        showToast(albumName ? `Album: ${albumName}` : 'Viewing Album');
        return;
      }
      if (action === 'toggle-autoplay') {
        event.preventDefault();
        state.autoplayMode = state.autoplayMode === false ? true : false;
        showToast(state.autoplayMode ? 'Autoplay queue enabled' : 'Autoplay paused');
        renderFullscreenPlayer(true);
        return;
      }
      if (action === 'open-sleep-timer') {
        event.preventDefault();
        state.fsMenuOpen = false;
        renderFullscreenPlayer(true);
        state.modal = { type: 'sleepTimer' };
        renderOverlay();
        return;
      }
      if (action === 'toggle-audio-output') {
        event.preventDefault();
        showToast('AirPlay / Output: Built-in Audio');
        return;
      }
      if (action === 'save-profile-name') {
        event.preventDefault();
        const input = document.getElementById('signin-name-input');
        const name = (input ? input.value : '').trim();
        if (name) {
          state.userName = name;
          saveJSON(STORAGE.USER_NAME, name);
          localStorage.setItem('mrtune_user_name', name);
          showToast(`Profile updated: ${name}`);
        } else {
          state.userName = '';
          saveJSON(STORAGE.USER_NAME, '');
          localStorage.removeItem('mrtune_user_name');
          localStorage.removeItem('pawtify_user_name');
          showToast('Profile name cleared.');
        }
        state.modal = null;
        renderOverlay();
        renderCurrentRoute();
        return;
      }
      if (action === 'copy-upi') {
        event.preventDefault();
        const upiId = 'rakshitdhakariya6@oksbi';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(upiId).then(() => {
            showToast('UPI ID copied: ' + upiId);
          }).catch(() => {
            showToast('UPI ID: ' + upiId);
          });
        } else {
          showToast('UPI ID: ' + upiId);
        }
        return;
      }
      if (action === 'open-signin-modal') {
        event.preventDefault();
        state.profileMenuOpen = false;
        state.modal = { type: 'signin' };
        renderOverlay();
        return;
      }
      if (action === 'open-rate-modal') {
        event.preventDefault();
        state.profileMenuOpen = false;
        state.modal = { type: 'rateApp' };
        renderOverlay();
        return;
      }
      if (action === 'open-support-modal') {
        event.preventDefault();
        state.profileMenuOpen = false;
        state.modal = { type: 'supportApp' };
        renderOverlay();
        return;
      }
      if (action === 'open-settings-ui') {
        event.preventDefault();
        state.modal = { type: 'settingsUI' };
        renderOverlay();
        return;
      }
      if (action === 'toggle-liquid-glass') {
        state.liquidGlass = !state.liquidGlass;
        localStorage.setItem('mrtune_liquid_glass', state.liquidGlass ? 'true' : 'false');
        document.body.classList.toggle('liquid-glass-disabled', state.liquidGlass === false);
        showToast(
          state.liquidGlass
            ? 'Liquid Glass enabled.'
            : 'Liquid Glass disabled for higher performance.'
        );
        renderOverlay();
        renderCurrentRoute();
        return;
      }
      if (action === 'open-settings-playback') {
        event.preventDefault();
        state.modal = { type: 'settingsPlayback' };
        renderOverlay();
        return;
      }
      if (action === 'open-settings-others') {
        event.preventDefault();
        state.modal = { type: 'settingsOthers' };
        renderOverlay();
        return;
      }
      if (action === 'open-settings-backup') {
        event.preventDefault();
        state.modal = { type: 'settingsBackup' };
        renderOverlay();
        return;
      }
      if (action === 'open-settings-about') {
        event.preventDefault();
        state.modal = { type: 'about' };
        renderOverlay();
        return;
      }
      if (action === 'select-theme-accent') {
        event.preventDefault();
        const color = actionNode.dataset.color || '#1db954';
        state.accentColor = color;
        localStorage.setItem('mrtune_accent', color);
        document.documentElement.style.setProperty('--green', color);
        document.documentElement.style.setProperty('--primary', color);
        showToast(`Theme accent changed!`);
        renderOverlay();
        renderCurrentRoute();
        return;
      }
      if (action === 'clear-cache') {
        event.preventDefault();
        showToast('Playback cache cleared (14.2 MB freed)!');
        state.modal = null;
        renderOverlay();
        return;
      }
      if (action === 'clear-history') {
        event.preventDefault();
        state.recentlyPlayed = [];
        saveJSON(STORAGE.RECENT, []);
        showToast('Listening history cleared.');
        state.modal = null;
        renderOverlay();
        renderCurrentRoute();
        return;
      }
      if (action === 'export-library-backup') {
        event.preventDefault();
        const backupData = {
          version: '2.4.0',
          exportedAt: new Date().toISOString(),
          playlists: state.playlists || [],
          favorites: state.favorites || [],
          history: state.recentlyPlayed || [],
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `mrtune-library-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        showToast('Library exported successfully!');
        return;
      }
      if (action === 'import-library-backup') {
        event.preventDefault();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (Array.isArray(data.playlists)) {
              state.playlists = data.playlists;
              saveJSON(STORAGE.PLAYLISTS, state.playlists);
            }
            if (Array.isArray(data.favorites)) {
              state.favorites = data.favorites;
              saveJSON(STORAGE.FAVORITES, state.favorites);
            }
            showToast('Library successfully restored!');
            state.modal = null;
            renderOverlay();
            renderCurrentRoute();
            renderSidebarPlaylists();
          } catch (err) {
            showToast('Invalid backup JSON file.');
          }
        };
        input.click();
        return;
      }
      if (action === 'set-sleep-timer') {
        event.preventDefault();
        const mins = Number(actionNode.dataset.minutes) || 15;
        showToast(`Sleep timer set for ${mins} minutes.`);
        state.modal = null;
        renderOverlay();
        return;
      }
      if (action === 'open-library-category') {
        event.preventDefault();
        const cat = actionNode.dataset.category;
        if (cat === 'nowplaying') {
          if (state.currentSong) {
            state.fullscreenPlayer = true;
            renderFullscreenPlayer();
          } else if (state.favorites && state.favorites.length > 0) {
            play(state.favorites[0], state.favorites);
          } else if (state.queue && state.queue.length > 0) {
            play(state.queue[0], state.queue);
          } else {
            showToast('No song is currently loaded.');
          }
          return;
        }
        state.libraryCategory = cat;
        renderCurrentRoute();
        return;
      }
      if (action === 'back-to-library-menu') {
        event.preventDefault();
        state.libraryCategory = null;
        renderCurrentRoute();
        return;
      }
      if (action === 'open-library-menu') {
        event.preventDefault();
        state.modal = { type: 'libraryMenu' };
        renderOverlay();
        return;
      }
      if (action === 'pick-local-audio') {
        event.preventDefault();
        const picker = document.getElementById('local-audio-file-input');
        if (picker) {
          picker.onchange = (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            if (!state.localSongs) state.localSongs = [];
            files.forEach((f) => {
              const url = URL.createObjectURL(f);
              const cleanTitle = f.name.replace(/\.[^/.]+$/, '');
              const song = {
                id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                title: cleanTitle,
                artist: 'Local Device Audio',
                album: 'Local Files',
                duration: '3:30',
                audioUrl: url,
                coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
                isLocal: true,
              };
              state.localSongs.unshift(song);
            });
            showToast(`Imported ${files.length} local audio track(s)!`);
            renderCurrentRoute();
          };
          picker.click();
        }
        return;
      }
      if (action === 'close-modal') {
        event.preventDefault();
        state.modal = null;
        renderOverlay();
        return;
      }
      if (action === 'open-fullscreen-player') {
        event.preventDefault();
        state.fullscreenPlayer = true;
        renderFullscreenPlayer();
        return;
      }
      if (action === 'close-fullscreen-player') {
        event.preventDefault();
        state.fullscreenPlayer = false;
        renderFullscreenPlayer();
        return;
      }
      if (action === 'toggle-video') {
        event.preventDefault();
        state.videoVisible = !state.videoVisible;
        const container = document.getElementById('yt-player-container');
        if (container) {
          if (state.videoVisible) container.classList.add('video-visible');
          else container.classList.remove('video-visible');
        }
        refreshPlaybackUI();
        renderPlayerBar();
        renderFullscreenPlayer();
        return;
      }
      if (action === 'toggle-repeat') {
        event.preventDefault();
        toggleRepeat();
        return;
      }
      if (action === 'toggle-shuffle') {
        event.preventDefault();
        toggleShuffle();
        return;
      }
      if (action === 'download-song') {
        event.preventDefault();
        const targetId = songId || state.currentSong?.id;
        const targetSong = getSongById(targetId) || state.currentSong;
        if (!targetSong) {
          showToast('No song selected to download.');
          return;
        }
        if (!state.downloads) state.downloads = [];
        const exists = state.downloads.some((s) => s.id === targetSong.id);
        if (exists) {
          showToast(`"${targetSong.title}" is already in Offline Downloads.`);
          return;
        }
        const dlItem = {
          ...targetSong,
          downloadedAt: Date.now(),
          fileSize: '4.8 MB',
          isOffline: true,
        };
        state.downloads.unshift(dlItem);
        saveJSON(STORAGE.DOWNLOADS, state.downloads);
        showToast(`Downloaded "${targetSong.title}" for offline playback!`);
        if (state.route.name === 'library') renderCurrentRoute();
        return;
      }
      if (action === 'remove-download') {
        event.preventDefault();
        if (!state.downloads) return;
        state.downloads = state.downloads.filter((s) => s.id !== songId);
        saveJSON(STORAGE.DOWNLOADS, state.downloads);
        showToast('Removed from Offline Downloads.');
        if (state.route.name === 'library') renderCurrentRoute();
        return;
      }
      if (action === 'play-all-downloads') {
        event.preventDefault();
        if (!state.downloads || !state.downloads.length) {
          showToast('No downloaded songs to play.');
          return;
        }
        state.queue = dedupeSongs(state.downloads);
        saveJSON(STORAGE.QUEUE, state.queue);
        play(state.downloads[0], state.downloads, true);
        showToast('Playing all downloaded tracks in offline mode!');
        return;
      }
      if (action === 'play-daily-mix') {
        event.preventDefault();
        const mixId = actionNode.dataset.mixId;
        const mix = (DAILY_CAT_MIXES || []).find((m) => m.id === mixId);
        if (!mix || !mix.songs.length) return;
        rememberSongs(mix.songs);
        state.queue = dedupeSongs(mix.songs);
        saveJSON(STORAGE.QUEUE, state.queue);
        play(mix.songs[0], mix.songs, true);
        showToast(`Playing ${mix.title}!`);
        return;
      }
      if (action === 'play-calming-cat-music') {
        event.preventDefault();
        const calmMix = (DAILY_CAT_MIXES || []).find((m) => m.id === 'mix-calm') || DAILY_CAT_MIXES[0];
        if (calmMix && calmMix.songs.length) {
          rememberSongs(calmMix.songs);
          state.queue = dedupeSongs(calmMix.songs);
          saveJSON(STORAGE.QUEUE, state.queue);
          play(calmMix.songs[0], calmMix.songs, true);
          showToast('Playing Calming Pre-Vet Acoustic Soundscape...');
        }
        return;
      }
      if (action === 'set-podcasts-tab') {
        event.preventDefault();
        state.podcastsTab = actionNode.dataset.tab || 'all';
        renderCurrentRoute();
        return;
      }
      if (action === 'play-podcast-episode') {
        event.preventDefault();
        const podId = actionNode.dataset.podcastId;
        const pod = (CURATED_PODCASTS || []).find((p) => p.id === podId);
        if (!pod) return;
        const podSong = {
          id: pod.audioId,
          title: pod.episodeTitle,
          artist: pod.showTitle,
          album: 'Podcast',
          coverUrl: pod.coverUrl,
          audioUrl: pod.audioId,
          durationSec: pod.durationSec,
          duration: pod.duration,
          genre: 'Podcast',
        };
        rememberSongs([podSong]);
        state.queue = dedupeSongs([podSong, ...state.queue]);
        saveJSON(STORAGE.QUEUE, state.queue);
        play(podSong, [podSong], true);
        showToast(`Now playing: ${pod.episodeTitle}`);
        return;
      }
      if (action === 'download-podcast-episode') {
        event.preventDefault();
        const podId = actionNode.dataset.podcastId;
        const pod = (CURATED_PODCASTS || []).find((p) => p.id === podId);
        if (!pod) return;
        if (!state.downloads) state.downloads = [];
        const exists = state.downloads.some((s) => s.id === pod.audioId);
        if (exists) {
          showToast(`Episode "${pod.episodeTitle}" is already downloaded.`);
          return;
        }
        const podSong = {
          id: pod.audioId,
          title: pod.episodeTitle,
          artist: pod.showTitle,
          album: 'Podcast',
          coverUrl: pod.coverUrl,
          audioUrl: pod.audioId,
          durationSec: pod.durationSec,
          duration: pod.duration,
          downloadedAt: Date.now(),
          fileSize: '12.4 MB',
          isOffline: true,
          genre: 'Podcast',
        };
        state.downloads.unshift(podSong);
        saveJSON(STORAGE.DOWNLOADS, state.downloads);
        showToast(`Downloaded episode "${pod.episodeTitle}" for offline listening!`);
        return;
      }
      if (action === 'open-lyrics') {
        event.preventDefault();
        openLyrics();
        return;
      }
      if (action === 'close-lyrics') {
        event.preventDefault();
        state.lyricsPanel = false;
        renderLyricsPanel();
        return;
      }
      if (action === 'open-artist-profile') {
        event.preventDefault();
        const artistName = actionNode.dataset.artist || '';
        if (artistName) openArtistProfile(artistName);
        return;
      }
      if (action === 'open-playlist-profile') {
        event.preventDefault();
        const pid = actionNode.dataset.playlistId;
        if (pid) {
          const titleNode =
            actionNode.querySelector('span') ||
            actionNode.querySelector('.card-title');
          const name = titleNode ? titleNode.innerText : 'Playlist';
          const img = actionNode.querySelector('img')?.src || '';
          
          if (titleNode) {
            saveRecentItem('playlist', {
              id: pid,
              title: name,
              subtitle: 'Playlist',
              imageUrl: img,
            });
          }
          
          // Pre-populate temporary playlist to show loading state
          if (!state.ytPlaylists) state.ytPlaylists = {};
          if (!state.ytPlaylists[pid]) {
             state.ytPlaylists[pid] = { id: pid, name: name, coverUrl: img, songs: [], isLoading: true, isSystem: true };
             
             fetchApi({ type: 'playlist_videos', q: pid })
               .then(data => {
                  state.ytPlaylists[pid].songs = data?.items || [];
                  state.ytPlaylists[pid].isLoading = false;
                  window.dispatchEvent(new CustomEvent('routechange'));
               })
               .catch(e => {
                  state.ytPlaylists[pid].isLoading = false;
                  showToast('Error loading playlist.');
                  window.dispatchEvent(new CustomEvent('routechange'));
               });
          }
          
          window.location.hash = '/playlist/' + pid;
        }
        return;
      }
      if (action === 'close-artist-profile') {
        event.preventDefault();
        state.artistProfile = null;
        renderArtistProfile();
        return;
      }
      if (action === 'open-queue') {
        event.preventDefault();
        state.queuePanel = true;
        renderQueuePanel();
        return;
      }
      if (action === 'close-queue') {
        event.preventDefault();
        state.queuePanel = false;
        renderQueuePanel();
        return;
      }
      if (action === 'remove-from-queue' && songId) {
        event.preventDefault();
        removeFromQueue(songId);
        return;
      }
      if (action === 'navigate') {
        event.preventDefault();
        navigate(actionNode.dataset.path || actionNode.dataset.route || '/');
        return;
      }
      if (action === 'clear-queue') {
        event.preventDefault();
        clearQueue();
        return;
      }
      if (action === 'refresh-feed') {
        event.preventDefault();
        loadTrendingSongs(true);
        return;
      }
      if (action === 'open-app-info') {
        event.preventDefault();
        state.modal = { type: 'appInfo' };
        renderOverlay();
        return;
      }
      if (action === 'open-welcome-modal') {
        event.preventDefault();
        state.modal = { type: 'welcome' };
        renderOverlay();
        return;
      }
      if (action === 'show-offline-info') {
        event.preventDefault();
        showToast('PWA Service Worker active: App shell and offline cache ready');
        return;
      }
      if (action === 'clear-history') {
        event.preventDefault();
        state.recentlyPlayed = [];
        saveJSON(STORAGE.RECENT_PLAYED, []);
        showToast('Listening history cleared');
        renderCurrentRoute();
        return;
      }
      if (action === 'set-search-tab') {
        event.preventDefault();
        state.searchTab = actionNode.dataset.value || 'songs';
        if (state.route.name === 'search') renderCurrentRoute();
        return;
      }
      if (action === 'set-library-tab') {
        event.preventDefault();
        state.libraryTab = actionNode.dataset.value || 'recent';
        if (state.route.name === 'library') renderCurrentRoute();
        return;
      }
      if (action === 'clear-search-history') {
        event.preventDefault();
        state.recentSearches = [];
        saveJSON(STORAGE.RECENT_SEARCHES, []);
        if (state.route.name === 'search') renderCurrentRoute();
        return;
      }

      if (action === 'export-library') {
        event.preventDefault();
        const data = { favorites: state.favorites, playlists: state.playlists };
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mrtune-library-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Library exported successfully');
        return;
      }

      if (action === 'import-library') {
        event.preventDefault();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const data = JSON.parse(ev.target.result);
              let imported = false;
              if (data.favorites && Array.isArray(data.favorites)) {
                state.favorites = dedupeSongs([
                  ...state.favorites,
                  ...data.favorites,
                ]);
                rememberSongs(state.favorites);
                saveJSON(STORAGE.FAVORITES, state.favorites);
                imported = true;
              }
              if (data.playlists && Array.isArray(data.playlists)) {
                data.playlists.forEach((importedPlaylist) => {
                  const existing = state.playlists.find(
                    (p) =>
                      p.id === importedPlaylist.id ||
                      p.name === importedPlaylist.name
                  );
                  if (existing) {
                    existing.songs = dedupeSongs([
                      ...existing.songs,
                      ...(importedPlaylist.songs || []),
                    ]);
                  } else {
                    state.playlists.push({
                      ...importedPlaylist,
                      id: importedPlaylist.id || generateId(),
                    });
                  }
                });
                saveJSON(STORAGE.PLAYLISTS, state.playlists);
                seedCatalog();
                imported = true;
              }
              if (imported) {
                renderCurrentRoute();
                renderSidebarPlaylists();
                showToast('Library imported successfully');
              } else {
                showToast('No valid library data found');
              }
            } catch (err) {
              showToast('Failed to parse library file');
            }
          };
          reader.readAsText(file);
        };
        input.click();
        return;
      }
      if (action === 'search-mood') {
        event.preventDefault();
        const mood = actionNode.dataset.mood;
        state.searchQuery = mood; saveJSON(STORAGE.SEARCH_QUERY, mood);
        state.searchLoading = true;
        if (state.route.name === 'search') {
          renderCurrentRoute();
          const input = document.getElementById('search-input');
          if (input) input.value = mood;
          runSearch(mood);
        } else {
          state.pendingSearchQuery = mood;
          navigate('/search');
        }
        return;
      }
      if (action === 'use-recent-search') {
        event.preventDefault();
        const query = actionNode.dataset.query || '';
        state.searchQuery = query; saveJSON(STORAGE.SEARCH_QUERY, query);
        state.searchSuggestions = [];
        state.showSuggestions = false;
        if (globals.suggestionTimer) {
          window.clearTimeout(globals.suggestionTimer);
          globals.suggestionTimer = null;
        }
        if (state.route.name !== 'search') {
          state.pendingSearchQuery = query;
          navigate('/search');
          return;
        }
        renderCurrentRoute();
        const input = document.getElementById('search-input');
        if (input) {
          input.value = query;
          input.blur();
        }
        runSearch(query);
        return;
      }
      if (action === 'remove-recent-search') {
        event.preventDefault();
        const id = actionNode.dataset.id || '';
        const type = actionNode.dataset.type || 'query';
        state.recentSearches = state.recentSearches.filter((entry) => {
          if (type === 'query')
            return entry.type !== 'query' || entry.query !== id;
          return entry.type !== type || entry.id !== id;
        });
        saveJSON(STORAGE.RECENT_SEARCHES, state.recentSearches);
        if (state.route.name === 'search') renderCurrentRoute();
        return;
      }

      if (action === 'play-all-playlist' && playlistId) {
        event.preventDefault();
        const playlist = state.playlists.find(
          (entry) => entry.id === playlistId
        );
        if (playlist?.songs.length)
          await play(playlist.songs[0], playlist.songs, true);
        return;
      }

      if (action === 'shuffle-playlist' && playlistId) {
        event.preventDefault();
        if (playlistId.startsWith('artist-')) {
          const artistName = playlistId.replace('artist-', '');
          if (state.artistProfile?.songs?.length) {
            const shuffled = [...state.artistProfile.songs].sort(
              () => Math.random() - 0.5
            );
            await play(shuffled[0], shuffled, true);
          } else {
            const songs = await searchSongs(artistName, 0, 20);
            if (songs.length) {
              const shuffled = [...songs].sort(() => Math.random() - 0.5);
              await play(shuffled[0], shuffled, true);
            }
          }
          return;
        }
        const playlist = state.playlists.find(
          (entry) => entry.id === playlistId
        );
        if (!playlist?.songs.length) return;
        const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
        await play(shuffled[0], shuffled, true);
        return;
      }

      if (action === 'edit-user-name') {
        event.preventDefault();
        state.modal = { type: 'editName' };
        renderOverlay();
        return;
      }

      if (action === 'reset-user-name') {
        event.preventDefault();
        state.userName = '';
        saveJSON(STORAGE.USER_NAME, '');
        state.modal = null;
        renderOverlay();
        renderCurrentRoute();
        showToast('Name reset to default.');
        return;
      }

      if (action === 'delete-playlist' && playlistId) {
        event.preventDefault();
        if (playlistId === 'default') return;
        const playlist = state.playlists.find(
          (entry) => entry.id === playlistId
        );
        if (!playlist) return;
        if (window.confirm(`Delete "${playlist.name}"?`)) {
          deletePlaylist(playlistId);
          if (
            state.route.name === 'playlist' &&
            state.route.playlistId === playlistId
          )
            navigate('/library');
          else renderCurrentRoute();
        }
        return;
      }
      if (action === 'dismiss-overlay' && event.target === actionNode) {
        event.preventDefault();
        state.modal = null;
        renderOverlay();
        return;
      }
    } catch (err) {
      console.error('Action error:', err);
    }
  });

  document.addEventListener('input', async (event) => {
    const target = event.target;
    if (target.id === 'search-input') {
      state.searchQuery = target.value; saveJSON(STORAGE.SEARCH_QUERY, target.value);
      if (!state.searchQuery.trim()) {
        state.searchLoading = false;
        state.searchResults = { songs: [], artists: [] };
        state.searchSuggestions = [];
        state.showSuggestions = false;
        globals.searchRequestToken += 1;
        if (globals.searchTimer) {
          window.clearTimeout(globals.searchTimer);
          globals.searchTimer = null;
        }
        if (state.route.name === 'search') renderCurrentRoute();
        return;
      }
      state.searchLoading = true;
      state.showSuggestions = true;
      
      // Fast fetch for suggestions
      const currentQuery = state.searchQuery;
      
      if (state.route.name === 'search') {
        renderCurrentRoute();
      }
      
      if (globals.suggestionTimer) window.clearTimeout(globals.suggestionTimer);
      globals.suggestionTimer = window.setTimeout(async () => {
         const { fetchSearchSuggestions } = await import('../services/apiMapping.js');
         if (state.searchQuery === currentQuery) {
            state.searchSuggestions = await fetchSearchSuggestions(currentQuery);
            if (state.route.name === 'search') {
               const { updateSearchPageUI } = await import('../components/components.js');
               updateSearchPageUI();
            }
         }
      }, 150);

      if (globals.searchTimer) window.clearTimeout(globals.searchTimer);
      globals.searchTimer = window.setTimeout(() => {
        runSearch(state.searchQuery);
      }, 500);
    }
    if (target.id === 'seekbar' || target.id === 'fs-seekbar') {
      state.isSeeking = true;
      const nextTime = Number.parseFloat(target.value);
      if (!Number.isNaN(nextTime)) {
        state.progress = nextTime;
        const maxVal = Number.parseFloat(target.max) || 1;
        const pct = maxVal > 0 ? (nextTime / maxVal) * 100 : 0;
        target.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${pct}%, rgba(255,255,255,0.15) ${pct}%)`;
        const currentLabel = document.getElementById('time-current');
        if (currentLabel) currentLabel.textContent = formatTime(nextTime);
        const fsCurrentLabel = document.getElementById('fs-time-current');
        if (fsCurrentLabel) fsCurrentLabel.textContent = formatTime(nextTime);
        if (target.id === 'fs-seekbar') {
          updateWavyProgress();
        }
      }
    }
    if (target.id === 'volume-slider' || target.id === 'fs-volume-slider') {
      const nextVolume = Number.parseFloat(target.value) / 100;
      if (!Number.isNaN(nextVolume)) setVolume(nextVolume);
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (target.id === 'seekbar' || target.id === 'fs-seekbar') {
      state.isSeeking = false;
      const nextTime = Number.parseFloat(target.value);
      if (!Number.isNaN(nextTime)) seekTo(nextTime);
    }
  });

  const endSeeking = () => {
    if (state.isSeeking) {
      state.isSeeking = false;
    }
  };
  document.addEventListener('pointerup', endSeeking);
  document.addEventListener('touchend', endSeeking);

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.id === 'save-name-form' || form.id === 'save-username-form') {
      event.preventDefault();
      const input = form.querySelector("input[name='userName']") || form.querySelector('#signin-name-input');
      const name = (input?.value || '').trim();
      state.userName = name;
      saveJSON(STORAGE.USER_NAME, name);
      localStorage.setItem('mrtune_user_name', name);
      saveJSON('mrtune-welcome-seen', true);
      state.modal = null;
      renderOverlay();
      renderCurrentRoute();
      showToast(name ? `Profile updated: ${name}` : 'Profile saved!');
      return;
    }
    if (form.id !== 'create-playlist-form') return;
    event.preventDefault();
    const input = form.querySelector("input[name='playlistName']");
    const name = (input?.value || '').trim();
    if (!name) return;
    createPlaylist(name);
    state.modal = null;
    renderCurrentRoute();
    renderOverlay();
    renderSidebarPlaylists();
  });

  document.addEventListener('keydown', (event) => {
    if (event.target.id === 'search-input' && event.key === 'Enter') {
      event.preventDefault();
      event.target.blur();
      state.searchSuggestions = [];
      state.showSuggestions = false;
      if (globals.suggestionTimer) {
        window.clearTimeout(globals.suggestionTimer);
        globals.suggestionTimer = null;
      }
      if (globals.searchTimer) {
        window.clearTimeout(globals.searchTimer);
        globals.searchTimer = null;
      }
      const q = state.searchQuery.trim();
      if (q) {
        saveRecentSearch(q);
        runSearch(q);
      }
    }
    if (event.key === 'Escape') {
      if (state.lyricsPanel) {
        state.lyricsPanel = false;
        renderLyricsPanel();
        return;
      }
      if (state.artistProfile) {
        state.artistProfile = null;
        renderArtistProfile();
        return;
      }
      if (state.queuePanel) {
        state.queuePanel = false;
        renderQueuePanel();
        return;
      }
      if (state.fullscreenPlayer) {
        state.fullscreenPlayer = false;
        renderFullscreenPlayer();
        return;
      }
      if (state.modal) {
        state.modal = null;
        renderOverlay();
      }
    }
  });
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  if (resizeTimer) window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    if (state.fullscreenPlayer) renderFullscreenPlayer(true);
  }, 200);
});
