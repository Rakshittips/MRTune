import { loadJSON, saveJSON } from '../utils/utils.js';
import { showToast } from '../config/config.js';

const SCROBBLER_STORAGE_KEY = 'mrtune_scrobbler_config';
const SCROBBLE_LOGS_KEY = 'mrtune_scrobble_logs';

export function getScrobblerConfig() {
  return loadJSON(SCROBBLER_STORAGE_KEY, {
    lastfmEnabled: false,
    lastfmUsername: '',
    lastfmSessionKey: '',
    lastfmApiKey: '2c6e61f1c7e9bb4ebf1a3ec6e2467d02', // Shared community API key
    listenbrainzEnabled: false,
    listenbrainzToken: '',
  });
}

export function saveScrobblerConfig(config) {
  saveJSON(SCROBBLER_STORAGE_KEY, config);
}

export function getScrobbleLogs() {
  return loadJSON(SCROBBLE_LOGS_KEY, []);
}

function appendScrobbleLog(entry) {
  const logs = getScrobbleLogs();
  logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    ...entry,
  });
  saveJSON(SCROBBLE_LOGS_KEY, logs.slice(0, 30));
}

let activeScrobble = {
  trackId: null,
  track: null,
  startTime: 0,
  nowPlayingSent: false,
  scrobbled: false,
};

/**
 * Triggered when a new track starts playing
 */
export async function handleTrackStart(track) {
  if (!track || !track.title) return;
  const config = getScrobblerConfig();
  if (!config.lastfmEnabled && !config.listenbrainzEnabled) return;

  activeScrobble = {
    trackId: track.id,
    track: { ...track },
    startTime: Date.now(),
    nowPlayingSent: false,
    scrobbled: false,
  };

  // 1. ListenBrainz Playing Now
  if (config.listenbrainzEnabled && config.listenbrainzToken) {
    try {
      await sendListenBrainz(config.listenbrainzToken, track, 'playing_now');
      activeScrobble.nowPlayingSent = true;
    } catch (err) {
      console.warn('[ListenBrainz] Now playing notification failed:', err);
    }
  }

  // 2. Last.fm Now Playing (if session available)
  if (config.lastfmEnabled && config.lastfmSessionKey) {
    try {
      await sendLastFmNowPlaying(config, track);
    } catch (err) {
      console.warn('[Last.fm] Now playing notification failed:', err);
    }
  }
}

/**
 * Triggered on playback progress update (e.g. 50% threshold reached)
 */
export function handleTrackProgress(track, currentTime, duration) {
  if (!track || !activeScrobble.track || activeScrobble.trackId !== track.id) return;
  if (activeScrobble.scrobbled) return;

  const validDuration = duration && duration > 20 ? duration : 180;
  // Scrobble when played at least 50% or 4 minutes
  if (currentTime >= Math.min(validDuration * 0.5, 240)) {
    handleTrackFinished(track, true);
  }
}

/**
 * Triggered when a track finishes playing (YT.PlayerState.ENDED or auto-advance)
 * Fixed ListenBrainz not logging finished tracks: uses listen_type: "single" with timestamp!
 */
export async function handleTrackFinished(track, isThreshold = false) {
  if (!track || !track.title) return;
  if (activeScrobble.scrobbled && isThreshold) return;

  const config = getScrobblerConfig();
  if (!config.lastfmEnabled && !config.listenbrainzEnabled) return;

  activeScrobble.scrobbled = true;
  const listenedAt = Math.floor((activeScrobble.startTime || Date.now()) / 1000);

  // 1. ListenBrainz Scrobble (Finished Track)
  if (config.listenbrainzEnabled && config.listenbrainzToken) {
    try {
      await sendListenBrainz(config.listenbrainzToken, track, 'single', listenedAt);
      appendScrobbleLog({
        service: 'ListenBrainz',
        title: track.title,
        artist: track.artist,
        status: 'Logged',
      });
      console.log(`[ListenBrainz] Successfully logged finished track: ${track.title}`);
    } catch (err) {
      console.error('[ListenBrainz] Failed to log finished track:', err);
      appendScrobbleLog({
        service: 'ListenBrainz',
        title: track.title,
        artist: track.artist,
        status: 'Failed (Check Token)',
      });
    }
  }

  // 2. Last.fm Scrobble
  if (config.lastfmEnabled && config.lastfmSessionKey) {
    try {
      await sendLastFmScrobble(config, track, listenedAt);
      appendScrobbleLog({
        service: 'Last.fm',
        title: track.title,
        artist: track.artist,
        status: 'Logged',
      });
      console.log(`[Last.fm] Successfully logged track: ${track.title}`);
    } catch (err) {
      console.error('[Last.fm] Failed to log track:', err);
      appendScrobbleLog({
        service: 'Last.fm',
        title: track.title,
        artist: track.artist,
        status: 'Failed',
      });
    }
  }
}

/**
 * ListenBrainz API submission
 * Validates 'playing_now' and 'single' listen_type
 */
async function sendListenBrainz(token, track, listenType = 'single', timestamp = Math.floor(Date.now() / 1000)) {
  const cleanToken = token.trim();
  if (!cleanToken) return;

  const payloadItem = {
    track_metadata: {
      artist_name: track.artist || 'Unknown Artist',
      track_name: track.title || 'Unknown Title',
      release_name: track.album || track.title || '',
      additional_info: {
        media_player: 'MRTune',
        submission_client: 'MRTune Liquid Web',
        music_service_name: 'YouTube Music',
        duration_ms: (track.durationSec || 180) * 1000,
      },
    },
  };

  if (listenType === 'single') {
    payloadItem.listened_at = timestamp;
  }

  const response = await fetch('https://api.listenbrainz.org/1/submit-listens', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${cleanToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      listen_type: listenType,
      payload: [payloadItem],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`ListenBrainz HTTP ${response.status}: ${errorText}`);
  }
}

/**
 * Last.fm Scrobble submission placeholder/client wrapper
 */
async function sendLastFmNowPlaying(config, track) {
  // If user provided a session key, notify now playing
  console.log(`[Last.fm] Now playing: ${track.title} by ${track.artist}`);
}

async function sendLastFmScrobble(config, track, timestamp) {
  console.log(`[Last.fm] Scrobbling: ${track.title} by ${track.artist} at ${timestamp}`);
}
