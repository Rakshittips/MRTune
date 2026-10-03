import { state, globals } from '../config/config.js';
import { searchSongs, searchArtists, searchPlaylists } from './apiMapping.js';
import { rememberSongs } from '../core/details.js';
import { updateSearchPageUI } from '../components/components.js';

export async function runSearch(query) {
  const q = (query || '').trim();
  if (!q) return;
  const token = ++globals.searchRequestToken;

  state.searchLoading = true;
  state.searchSuggestions = [];
  state.showSuggestions = false;
  if (globals.suggestionTimer) {
    window.clearTimeout(globals.suggestionTimer);
    globals.suggestionTimer = null;
  }
  if (state.route.name === 'search') {
    updateSearchPageUI();
  }

  try {
    const [songs, artists, playlists] = await Promise.all([
      searchSongs(q, 0, 15),
      searchArtists(q, 0, 10),
      searchPlaylists(q, 10),
    ]);
    if (token !== globals.searchRequestToken) return;

    state.searchResults = { songs, artists, playlists };
    state.searchLoading = false;
    state.searchSuggestions = [];
    state.showSuggestions = false;
    rememberSongs(songs);

    if (state.route.name === 'search') updateSearchPageUI();
  } catch (error) {
    if (token !== globals.searchRequestToken) return;
    state.searchLoading = false;
    state.searchSuggestions = [];
    state.showSuggestions = false;
    if (state.route.name === 'search') updateSearchPageUI();
  }
}
