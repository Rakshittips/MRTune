import { appMain } from './dom.js';
import { parseRoute } from './router.js';
import { refreshPlaybackUI } from '../components/playerBar.js';
import {
  rememberSongs,
  persistPlayer,
  normalizeRecentSearches,
  dedupeSongs,
  normalizePlaylists,
  seedCatalog,
  restoreCurrentSongIndex,
} from '../core/details.js';
import { nextTrack } from '../components/player.js';
import { loadJSON, saveJSON } from '../utils/utils.js';
import { idbGet } from '../utils/idb.js';
import {
  loadYTApi,
  updateMediaSession,
} from '../services/youtube.js';
import { bindGlobalEvents } from '../core/events.js';
import { renderCurrentRoute } from '../components/master.js';
import {
  loadTrendingSongs,
  loadRecommendations,
} from '../services/dataLoader.js';

export const LOGO_URL =
  '/assets/pawtify.png';

export const STORAGE = {
  THEME: 'pawtify-theme',
  REPEAT: 'pawtify-repeat',
  SHUFFLE: 'pawtify-shuffle',
  FAVORITES: 'pawtify-favorites',
  PLAYLISTS: 'pawtify-playlists',
  QUEUE: 'pawtify-queue',
  CURRENT_SONG: 'pawtify-current-song',
  CURRENT_TIME: 'pawtify-current-time',
  VOLUME: 'pawtify-volume',
  RECENT_SEARCHES: 'pawtify-recent-searches',
  SEARCH_QUERY: 'pawtify-search-query',
  RECENT_PLAYED: 'pawtify-recently-played',
  USER_NAME: 'pawtify-user-name',
  DOWNLOADS: 'pawtify-downloads',
  CAT_PROFILE: 'pawtify-cat-profile',
  CAT_MEALS: 'pawtify-cat-meals',
  CAT_VETS: 'pawtify-cat-vets',
  CAT_WEIGHTS: 'pawtify-cat-weights',
  CAT_HYDRATION: 'pawtify-cat-hydration',
};

export const DEFAULT_CAT_PROFILE = {
  name: 'Luna',
  breed: 'Scottish Fold',
  age: '2.5 Years',
  birthDate: '2024-03-15',
  weight: 4.2,
  weightUnit: 'kg',
  gender: 'Female (Spayed)',
  microchip: '985-1410-0293-4812',
  avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300&h=300',
  vetClinic: 'Happy Paws Feline Medical Center',
  primaryVet: 'Dr. Sarah Adams, DVM',
  vetPhone: '+1 (555) 234-PAWS',
};

export const DEFAULT_CAT_VETS = [
  {
    id: 'vet-1',
    date: '2026-10-18',
    time: '10:30 AM',
    clinic: 'Happy Paws Feline Medical Center',
    doctor: 'Dr. Sarah Adams, DVM',
    reason: 'Bi-annual Dental Check & Routine Wellness Exam',
    status: 'Upcoming',
    notes: 'Bring vaccination records. Play calm acoustic music 30 mins before travel.',
    prepTips: ['Use carrier with familiar blanket', 'Spray Feliway calming pheromone', 'Fast from food 2 hours prior'],
  },
  {
    id: 'vet-2',
    date: '2026-04-10',
    time: '02:00 PM',
    clinic: 'Happy Paws Feline Medical Center',
    doctor: 'Dr. Sarah Adams, DVM',
    reason: 'Rabies Booster & Physical Exam',
    status: 'Completed',
    notes: 'Weight optimal at 4.15kg. Clear lungs, heart rate normal. Next booster in 1 year.',
    prepTips: [],
  },
];

export const DEFAULT_CAT_MEALS = [
  {
    id: 'meal-1',
    time: '08:00 AM',
    type: 'Wet Food',
    brand: 'Royal Canin Indoor Adult Morsels',
    portion: '85g pouch',
    calories: 72,
    finished: true,
    notes: 'Ate immediately, great appetite.',
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'meal-2',
    time: '01:30 PM',
    type: 'Dry Food',
    brand: 'Purina Pro Plan LiveClear Salmon',
    portion: '30g',
    calories: 115,
    finished: true,
    notes: 'Finished bowl cleanly.',
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'meal-3',
    time: '07:00 PM',
    type: 'Wet Food',
    brand: 'Tiki Cat Velvet Mousse Tuna & Mackerel',
    portion: '70g pouch',
    calories: 65,
    finished: false,
    notes: 'Scheduled evening dinner.',
    date: new Date().toISOString().slice(0, 10),
  },
  {
    id: 'meal-4',
    time: '09:30 PM',
    type: 'Treat',
    brand: 'Inaba Churu Chicken Puree',
    portion: '1 tube (14g)',
    calories: 6,
    finished: false,
    notes: 'Bedtime comfort treat.',
    date: new Date().toISOString().slice(0, 10),
  },
];

export const DEFAULT_CAT_WEIGHTS = [
  { id: 'w-1', date: '2026-06-01', weight: 4.1, notes: 'Early summer weigh-in' },
  { id: 'w-2', date: '2026-08-15', weight: 4.15, notes: 'Mid-summer check' },
  { id: 'w-3', date: '2026-10-01', weight: 4.2, notes: 'Current healthy target' },
];

export const DEFAULT_CAT_HYDRATION = {
  date: new Date().toISOString().slice(0, 10),
  consumedMl: 160,
  targetMl: 220,
};

export const CURATED_PODCASTS = [
  {
    id: 'pod-1',
    showTitle: 'The Feline Mind & Behavior',
    episodeTitle: 'Why Does Your Cat Stare Into Empty Space & The 3 AM Zoomies',
    host: 'Dr. Jackson Mews & Jackson Galaxy',
    category: 'behavior',
    categoryLabel: 'Behavior & Psychology',
    duration: '28:15',
    durationSec: 1695,
    date: 'Oct 2026',
    description: 'Explore the fascinating predatory instinct, nocturnal activity cycles, and sensory perception that drive midnight cat zoomies and wall-staring behavior.',
    coverUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: '1JaQyE26p4k',
  },
  {
    id: 'pod-2',
    showTitle: 'Feline Health & Vet Advice',
    episodeTitle: 'Spotting Early Signs of Illness: Subtle Symptoms Every Cat Owner Misses',
    host: 'Dr. Sarah Adams, DVM',
    category: 'wellness',
    categoryLabel: 'Health & Vet',
    duration: '34:40',
    durationSec: 2080,
    date: 'Sep 2026',
    description: 'Cats are masters at hiding pain. Dr. Adams breaks down changes in grooming, litter box habits, posture, and third eyelid visibility.',
    coverUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: 'tYqZK7bq5Bs',
  },
  {
    id: 'pod-3',
    showTitle: 'Purr Therapy & Sleep Sanctuary',
    episodeTitle: '432Hz Continuous Healing Cat Purr & Delta Sleep Waves for Anxiety',
    host: 'MRTune Sleep Labs',
    category: 'calming',
    categoryLabel: 'Relaxation & Sleep',
    duration: '45:00',
    durationSec: 2700,
    date: 'Oct 2026',
    description: 'Scientifically calibrated purr frequency (20-140Hz) embedded in warm 432Hz ambient soundscape for thunderstorm relief and bedtime calm.',
    coverUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: '_deqdZmKzyg',
  },
  {
    id: 'pod-4',
    showTitle: 'Cat Nutrition & Meal Prepping',
    episodeTitle: 'Wet Food vs. Kibble vs. Raw: What Board-Certified Vets Feed Their Cats',
    host: 'Nutritionist Chloe Paws',
    category: 'nutrition',
    categoryLabel: 'Diet & Nutrition',
    duration: '24:10',
    durationSec: 1450,
    date: 'Sep 2026',
    description: 'Learn moisture requirements, carbohydrate thresholds for feline kidneys, and how to balance protein sources safely.',
    coverUrl: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: 'usvVGXFIpTM',
  },
  {
    id: 'pod-5',
    showTitle: 'Fear-Free Vet Visits',
    episodeTitle: 'Carrier Training & Desensitization: Zero-Stress Vet Trips',
    host: 'Fear-Free Vet Alliance',
    category: 'wellness',
    categoryLabel: 'Health & Vet',
    duration: '19:45',
    durationSec: 1185,
    date: 'Aug 2026',
    description: 'Practical steps to transform the dreaded cat carrier into a cozy safe space, combined with auditory soothing techniques.',
    coverUrl: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: 'Kh49Zqa84IE',
  },
  {
    id: 'pod-6',
    showTitle: 'The Secret Lives of Senior Cats',
    episodeTitle: 'Helping Aging Cats Flourish: Mobility, Water Fountains & Gentle Play',
    host: 'Dr. Clara Paws, Senior Specialist',
    category: 'wellness',
    categoryLabel: 'Health & Vet',
    duration: '31:20',
    durationSec: 1880,
    date: 'Oct 2026',
    description: 'Essential adaptations for cats aged 10+: ramp access, raised food bowls, arthritis care, and cognitive enrichment.',
    coverUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: 'Hu5l420BreY',
  },
];

export const DAILY_CAT_MIXES = [
  {
    id: 'mix-calm',
    title: 'Daily Mix 1: Calm Vet Visit',
    subtitle: 'Anti-anxiety acoustic piano & warm frequencies for vet appointments',
    coverUrl: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=300&h=300',
    mood: 'calm',
    color: '#10b981',
    songs: [
      { id: 'i1IDh_ZoJgI', title: 'Alag Aasmaan (Mellow Acoustic)', artist: 'Anuv Jain', duration: '3:33', durationSec: 213, coverUrl: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=300&h=300' },
      { id: 'tYqZK7bq5Bs', title: 'Baarishein (Gentle Rain Melodies)', artist: 'Anuv Jain', duration: '3:28', durationSec: 208, coverUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300&h=300' },
      { id: 'Kh49Zqa84IE', title: 'Gul (Soft Strings)', artist: 'Anuv Jain', duration: '3:38', durationSec: 218, coverUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=300&h=300' },
    ]
  },
  {
    id: 'mix-zoomies',
    title: 'Daily Mix 2: Catnip & Zoomies',
    subtitle: 'Rhythmic, playful melodies for afternoon wand-chasing and playtime',
    coverUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=300&h=300',
    mood: 'play',
    color: '#f59e0b',
    songs: [
      { id: 'usvVGXFIpTM', title: 'Jo Tum Mere Ho (Playful Strum)', artist: 'Anuv Jain', duration: '4:12', durationSec: 252, coverUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=300&h=300' },
      { id: '-BJt4fCAtZE', title: 'Arz Kiya Hai (Upbeat Rhythm)', artist: 'Anuv Jain', duration: '4:55', durationSec: 295, coverUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=300&h=300' },
    ]
  },
  {
    id: 'mix-sleep',
    title: 'Daily Mix 3: Deep Purr & Sleep',
    subtitle: 'Warm 432Hz sleep drones and calming purr frequencies',
    coverUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=300&h=300',
    mood: 'sleep',
    color: '#8b5cf6',
    songs: [
      { id: '_deqdZmKzyg', title: 'Husn (Ambient Dreamscape)', artist: 'Anuv Jain', duration: '3:38', durationSec: 218, coverUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=300&h=300' },
      { id: '-3KT1f7WZIo', title: 'Afsos (Lullaby Edition)', artist: 'Anuv Jain', duration: '3:12', durationSec: 192, coverUrl: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&q=80&w=300&h=300' },
    ]
  },
  {
    id: 'mix-sunbeam',
    title: 'Daily Mix 4: Sunbeam Napping',
    subtitle: 'Light acoustic fingerpicking for lazy sunny window afternoons',
    coverUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=300&h=300',
    mood: 'chill',
    color: '#06b6d4',
    songs: [
      { id: 'Hu5l420BreY', title: 'Meri Baaton Mein Tu (Sunbeam Acoustic)', artist: 'Anuv Jain', duration: '3:34', durationSec: 214, coverUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=300&h=300' },
      { id: 'R38Er0St2as', title: 'Inaam (Acoustic Calm)', artist: 'Anuv Jain', duration: '4:18', durationSec: 258, coverUrl: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=300&h=300' },
    ]
  },
];

export const CURATED_IOS_TRACKS = [
  {
    id: 'tYqZK7bq5Bs',
    title: 'Ku Ku',
    artist: 'Bilal Saeed',
    plays: '134M',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: 'tYqZK7bq5Bs',
    duration: '3:28',
    durationSec: 208,
  },
  {
    id: 'dZ0fwJojhrs',
    title: 'Lahore',
    artist: 'Guru Randhawa',
    plays: '1.2B',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: 'dZ0fwJojhrs',
    duration: '3:15',
    durationSec: 195,
  },
  {
    id: 'f02mOEt11OQ',
    title: 'Ishq Tera',
    artist: 'Guru Randhawa',
    plays: '560M',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: 'f02mOEt11OQ',
    duration: '3:32',
    durationSec: 212,
  },
  {
    id: 'usvVGXFIpTM',
    title: 'Casa Tupka Anthemo (feat. Prince)',
    artist: 'Yo Yo Honey Singh',
    plays: '82M',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: 'usvVGXFIpTM',
    duration: '3:45',
    durationSec: 225,
  },
  {
    id: 'Kh49Zqa84IE',
    title: 'Pata Chalgea',
    artist: 'Imran Khan',
    plays: '335M',
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: 'Kh49Zqa84IE',
    duration: '3:20',
    durationSec: 200,
  },
  {
    id: '_deqdZmKzyg',
    title: 'Zaalima',
    artist: 'Arijit Singh & Harshdeep Kaur',
    plays: '1.1B',
    coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=400&h=400',
    audioId: '_deqdZmKzyg',
    duration: '4:59',
    durationSec: 299,
  },
];

export const songCatalog = new Map();
// YouTube Audio Engine State

export function showToast(msg) {
  let toast = document.getElementById('toast-container');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-container';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

export function clearYtLoadTimeout() {
  if (globals.ytLoadTimeout) {
    clearTimeout(globals.ytLoadTimeout);
    globals.ytLoadTimeout = null;
  }
}

export function startYtLoadTimeout() {
  clearYtLoadTimeout();
  state.isLoading = true;
  refreshPlaybackUI();
  globals.ytLoadTimeout = setTimeout(() => {
    console.warn('YouTube Player timed out loading video');
    handlePlaybackError('TIMEOUT');
  }, 20000);
}

export async function handlePlaybackError(errorCode) {
  clearYtLoadTimeout();
  console.warn(
    'handlePlaybackError triggered. Code:',
    errorCode,
    'Song:',
    state.currentSong?.title
  );

  if (globals.isFallingBack) return;

  const current = state.currentSong;
  if (current && !current._triedFallback) {
    current._triedFallback = true;
    globals.isFallingBack = true;
    showToast(`Finding alternative stream for "${current.title}"...`);
    try {
      const cleanTitle = (current.title || '')
        .replace(/\s*\(.*?\)\s*/g, '')
        .replace(/\s*\[.*?\]\s*/g, '')
        .trim();
      const cleanArtist = (current.artist || '').trim();
      const query = `${cleanTitle} ${cleanArtist} official`;
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const alternatives = (data?.items || []).filter(
        (item) =>
          item.id && item.id !== current.id && item.resultType !== 'artist'
      );

      if (alternatives.length > 0) {
        const altSong = alternatives[0];
        console.log(
          `Switching to alternative playable stream: ${altSong.id} (${altSong.title})`
        );
        current.id = altSong.id;
        if (altSong.thumbnail) current.coverUrl = altSong.thumbnail;
        rememberSongs([current]);
        persistPlayer();

        if (
          globals.ytPlayerReady &&
          globals.ytPlayer &&
          typeof globals.ytPlayer.loadVideoById === 'function'
        ) {
          startYtLoadTimeout();
          globals.ytPlayer.loadVideoById(current.id);
          globals.isFallingBack = false;
          refreshPlaybackUI();
          return;
        }
      }
    } catch (err) {
      console.error('Alternative stream search failed:', err);
    }
    globals.isFallingBack = false;
  }

  state.isLoading = false;
  state.isPlaying = false;
  refreshPlaybackUI();
  showToast('Track unavailable on embed. Skipping to next song...');
  setTimeout(() => {
    if (state.queue.length > 1) {
      nextTrack();
    }
  }, 1500);
}

// Audio Engine State Removed

export const storedVol = loadJSON(STORAGE.VOLUME, 0.7);
export const initialVol =
  typeof storedVol === 'number' && !isNaN(storedVol) ? storedVol : 0.7;

export const DISCOVERY_CATEGORIES = [
  { title: 'Late Night Indie', query: 'Indian indie late night vibes The Local Train official' },
  { title: 'Acoustic Love', query: 'Anuv Jain acoustic romantic indie songs official' },
  { title: 'Soothing Hindi', query: 'Prateek Kuhad soothing Hindi mellow official' },
  { title: 'Melancholic Moods', query: 'Indian indie sad melancholic songs official' },
  { title: 'Dreamy Pop', query: 'Mitraz dreamy lo-fi pop aesthetic official' },
  { title: 'Lo-Fi Chill', query: 'Hindi lo-fi chill romantic aesthetic vibes official' },
  { title: 'Aesthetic Indie', query: 'Indian aesthetic indie pop love songs official' },
  { title: 'Late Night Drives', query: 'Hindi indie late night drive soothing official' },
  { title: 'Midnight Acoustic', query: 'Acoustic indie Hindi midnight calm official' },
  { title: 'Indie Rock Vibes', query: 'The Local Train Indian indie rock official' },
];

export const globals = {
  ytPlayer: null,
  ytPlayerReady: null,
  ytPollInterval: null,
  ytLoadTimeout: null,
  isFallingBack: null,
  pendingVideoId: null,
  pendingAutoplay: null,
  searchTimer: null,
  searchRequestToken: null,
  lyricsScrollTimeout: null,
};
export const state = {};
Object.assign(state, {
  feedCategories: [],
  userName: loadJSON(STORAGE.USER_NAME, '') || '',
  route: { name: 'home', playlistId: null },
  theme: loadJSON(STORAGE.THEME, 'dark'),
  repeatMode: loadJSON(STORAGE.REPEAT, 'none'),
  shuffleMode: loadJSON(STORAGE.SHUFFLE, false),
  searchQuery: loadJSON(STORAGE.SEARCH_QUERY, ''),
  searchSuggestions: [],
  searchTab: 'songs',
  libraryTab: 'recent',
  activeMusicSource: 'all',
  streamEngine: 'auto',
  liquidGlass: localStorage.getItem('pawtify_liquid_glass') !== 'false',
  searchLoading: false,
  searchResults: { songs: [], artists: [] },
  recentSearches: normalizeRecentSearches(
    loadJSON(STORAGE.RECENT_SEARCHES, [])
  ),
  currentSong: loadJSON(STORAGE.CURRENT_SONG, null),
  queue: dedupeSongs(loadJSON(STORAGE.QUEUE, [])),
  currentSongIndex: 0,
  isPlaying: false,
  isLoading: true,
  progress: 0,
  duration: 0,
  volume: Math.max(0, Math.min(1, initialVol)),
  favorites: dedupeSongs(loadJSON(STORAGE.FAVORITES, [])),
  playlists: normalizePlaylists(
    loadJSON(STORAGE.PLAYLISTS, [
      { id: 'default', name: 'My Playlist', songs: [] },
    ])
  ),
  trendingSongs: [],
  indieBandsSongs: [],
  acousticSongs: [],
  melodicIndieSongs: [],
  lofiSongs: [],
  classicalSongs: [],
  anuvSongs: [],
  prateekSongs: [],
  indieSongs: [],
  englishSongs: [],
  recommendedSongs: [],
  recentlyPlayed: loadJSON(STORAGE.RECENT_PLAYED, []),
  downloads: dedupeSongs(loadJSON(STORAGE.DOWNLOADS, [])),
  catProfile: loadJSON(STORAGE.CAT_PROFILE, DEFAULT_CAT_PROFILE),
  catMeals: loadJSON(STORAGE.CAT_MEALS, DEFAULT_CAT_MEALS),
  catVets: loadJSON(STORAGE.CAT_VETS, DEFAULT_CAT_VETS),
  catWeights: loadJSON(STORAGE.CAT_WEIGHTS, DEFAULT_CAT_WEIGHTS),
  catHydration: loadJSON(STORAGE.CAT_HYDRATION, DEFAULT_CAT_HYDRATION),
  podcastsTab: 'all',
  catCareTab: 'overview',
  pendingSearchQuery: '',
  modal: null,
  fullscreenPlayer: false,
  lyricsPanel: false,
  lyricsData: null,
  lyricsLoading: false,
  artistProfile: null,
  queuePanel: false,
  videoVisible: false,
});

export async function initApp() {
  try {
    // Restore from IndexedDB
    const idbPlaylists = await idbGet(STORAGE.PLAYLISTS);
    if (idbPlaylists) state.playlists = normalizePlaylists(idbPlaylists);

    const idbFavorites = await idbGet(STORAGE.FAVORITES);
    if (idbFavorites) state.favorites = dedupeSongs(idbFavorites);

    const idbDownloads = await idbGet(STORAGE.DOWNLOADS);
    if (idbDownloads) state.downloads = dedupeSongs(idbDownloads);

    const idbCatProfile = await idbGet(STORAGE.CAT_PROFILE);
    if (idbCatProfile) state.catProfile = idbCatProfile;

    const idbCatMeals = await idbGet(STORAGE.CAT_MEALS);
    if (idbCatMeals) state.catMeals = idbCatMeals;

    const idbCatVets = await idbGet(STORAGE.CAT_VETS);
    if (idbCatVets) state.catVets = idbCatVets;

    const idbQueue = await idbGet(STORAGE.QUEUE);
    if (idbQueue) state.queue = dedupeSongs(idbQueue);

    const idbRecent = await idbGet(STORAGE.RECENT_PLAYED);
    if (idbRecent) state.recentlyPlayed = idbRecent;

    const idbSong = await idbGet(STORAGE.CURRENT_SONG);
    if (idbSong !== undefined) state.currentSong = idbSong;
    
    const idbTime = await idbGet(STORAGE.CURRENT_TIME);
    if (idbTime !== undefined) state.progress = Number(idbTime) || 0;

    seedCatalog();
    restoreCurrentSongIndex();
    loadYTApi();

    if (state.currentSong) updateMediaSession(state.currentSong);
    document.body.classList.toggle('has-active-track', !!state.currentSong);
    document.body.classList.toggle('liquid-glass-disabled', state.liquidGlass === false);

    bindGlobalEvents();

    const initialRoute = parseRoute();
    if (initialRoute.name === 'song' && initialRoute.songId) {
      window.location.hash = `#/song/${encodeURIComponent(initialRoute.songId)}`;
    } else if (initialRoute.name === 'playlist' && initialRoute.playlistId) {
      window.location.hash = `#/playlist/${encodeURIComponent(initialRoute.playlistId)}`;
    } else if (initialRoute.name !== 'home') {
      window.location.hash = `#/${initialRoute.name}`;
    } else if (!window.location.hash) {
      window.location.hash = '#/';
    }

    const savedName = loadJSON(STORAGE.USER_NAME, '');
    state.userName = savedName || '';
    const welcomeSeen = loadJSON('pawtify-welcome-seen', false);
    if (!welcomeSeen && !state.userName && initialRoute.name !== 'song') {
      state.modal = { type: 'welcome' };
    }

    renderCurrentRoute();

    loadTrendingSongs().then(() => {
      if (state.currentSong) {
        loadRecommendations();
      }
    });
  } catch (e) {
    console.error('Critical initialization error:', e);
    if (appMain) {
      appMain.innerHTML = `<div class="empty-state"><h2>App Error</h2><p>Something went wrong loading MRTune. Please refresh the page.</p></div>`;
    }
  }
}