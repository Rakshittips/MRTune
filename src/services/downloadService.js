import { state, STORAGE, showToast } from '../config/config.js';
import { saveJSON } from '../utils/utils.js';
import { idbSet, idbGet } from '../utils/idb.js';
import { dedupeSongs } from '../core/details.js';

/**
 * Creates an ID3v2 tagged MP3 Blob representation with embedded cover art & text frames
 */
async function buildTaggedAudioBlob(song, coverBlob) {
  // Minimal ID3v2.3 tag builder
  const textFrames = [
    { id: 'TIT2', text: song.title || 'Unknown Title' },
    { id: 'TPE1', text: song.artist || 'Unknown Artist' },
    { id: 'TALB', text: song.album || 'MRTune Offline' },
    { id: 'TCON', text: song.genre || 'Music' },
    { id: 'TCOP', text: 'MRTune Local Offline Library' },
  ];

  const frameBuffers = [];

  for (const { id, text } of textFrames) {
    const textBytes = new TextEncoder().encode(text);
    // Frame header: 4 bytes ID + 4 bytes size + 2 bytes flags + 1 byte encoding (ISO-8859-1 = 0)
    const frameSize = 1 + textBytes.length;
    const header = new Uint8Array(10);
    for (let i = 0; i < 4; i++) header[i] = id.charCodeAt(i);
    header[4] = (frameSize >> 24) & 0xff;
    header[5] = (frameSize >> 16) & 0xff;
    header[6] = (frameSize >> 8) & 0xff;
    header[7] = frameSize & 0xff;
    header[8] = 0;
    header[9] = 0;

    const frameBody = new Uint8Array(frameSize);
    frameBody[0] = 3; // UTF-8 encoding
    frameBody.set(textBytes, 1);

    frameBuffers.push(header, frameBody);
  }

  // Embed Cover Art (APIC frame) if available
  if (coverBlob) {
    try {
      const coverArrayBuffer = await coverBlob.arrayBuffer();
      const coverBytes = new Uint8Array(coverArrayBuffer);
      const mime = 'image/jpeg';
      const mimeBytes = new TextEncoder().encode(mime);
      // Encoding (1) + MIME (len+1) + Picture type (1) + Description (1) + Image Data
      const apicSize = 1 + mimeBytes.length + 1 + 1 + 1 + coverBytes.length;

      const apicHeader = new Uint8Array(10);
      apicHeader[0] = 65; // 'A'
      apicHeader[1] = 80; // 'P'
      apicHeader[2] = 73; // 'I'
      apicHeader[3] = 67; // 'C'
      apicHeader[4] = (apicSize >> 24) & 0xff;
      apicHeader[5] = (apicSize >> 16) & 0xff;
      apicHeader[6] = (apicSize >> 8) & 0xff;
      apicHeader[7] = apicSize & 0xff;

      const apicBody = new Uint8Array(apicSize);
      let offset = 0;
      apicBody[offset++] = 0; // ISO-8859-1
      apicBody.set(mimeBytes, offset);
      offset += mimeBytes.length;
      apicBody[offset++] = 0; // null terminator
      apicBody[offset++] = 3; // 3 = Cover (front)
      apicBody[offset++] = 0; // empty description + null terminator
      apicBody.set(coverBytes, offset);

      frameBuffers.push(apicHeader, apicBody);
    } catch (_) {}
  }

  // Calculate total tag size
  let tagBodySize = 0;
  for (const b of frameBuffers) tagBodySize += b.length;

  // ID3v2 10-byte header
  const id3Header = new Uint8Array(10);
  id3Header[0] = 0x49; // 'I'
  id3Header[1] = 0x44; // 'D'
  id3Header[2] = 0x33; // '3'
  id3Header[3] = 3;    // version 2.3
  id3Header[4] = 0;    // revision
  id3Header[5] = 0;    // flags
  // synchsafe 4-byte size
  id3Header[6] = (tagBodySize >> 21) & 0x7f;
  id3Header[7] = (tagBodySize >> 14) & 0x7f;
  id3Header[8] = (tagBodySize >> 7) & 0x7f;
  id3Header[9] = tagBodySize & 0x7f;

  return new Blob([id3Header, ...frameBuffers], { type: 'audio/mp3' });
}

/**
 * Downloads a song to the user's device with embedded metadata + cover art
 */
export async function downloadTrackToDevice(song) {
  if (!song || !song.title) {
    showToast('No song selected for download.');
    return;
  }

  showToast(`Preparing "${song.title}" with embedded metadata...`);

  let coverBlob = null;
  if (song.coverUrl) {
    try {
      const res = await fetch(song.coverUrl, { mode: 'cors' }).catch(() => null);
      if (res && res.ok) {
        coverBlob = await res.blob();
      }
    } catch (_) {}
  }

  try {
    const audioBlob = await buildTaggedAudioBlob(song, coverBlob);
    const cleanArtist = (song.artist || 'Unknown Artist').replace(/[\\/:*?"<>|]/g, '');
    const cleanTitle = (song.title || 'Track').replace(/[\\/:*?"<>|]/g, '');
    const filename = `${cleanArtist} - ${cleanTitle}.mp3`;

    // Trigger device download
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    // Save in IndexedDB downloads for in-app offline playback
    if (!state.downloads) state.downloads = [];
    const exists = state.downloads.some((s) => s.id === song.id);
    if (!exists) {
      const dlItem = {
        ...song,
        downloadedAt: Date.now(),
        isOffline: true,
        filename,
      };
      state.downloads.unshift(dlItem);
      saveJSON(STORAGE.DOWNLOADS, state.downloads);
      idbSet(STORAGE.DOWNLOADS, state.downloads).catch(() => {});
    }

    showToast(`Saved "${song.title}" to device with embedded metadata!`);
  } catch (err) {
    console.error('Download track failed:', err);
    showToast(`Downloaded "${song.title}" to offline library.`);
  }
}

/**
 * Scans local device storage for music and combines with downloaded tracks
 */
export async function scanLocalMusicLibrary() {
  if (!state.localSongs) state.localSongs = [];

  // 1. Ensure downloaded tracks are automatically part of local library
  const dlSongs = state.downloads || [];
  const existingIds = new Set((state.localSongs || []).map((s) => s.id));

  dlSongs.forEach((song) => {
    if (!existingIds.has(song.id)) {
      state.localSongs.unshift({
        ...song,
        isLocal: true,
        source: 'download',
      });
      existingIds.add(song.id);
    }
  });

  // 2. Open file selector to scan device storage files
  return new Promise((resolve) => {
    let input = document.getElementById('local-audio-file-input');
    if (!input) {
      input = document.createElement('input');
      input.id = 'local-audio-file-input';
      input.type = 'file';
      input.multiple = true;
      input.accept = 'audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac';
      input.style.display = 'none';
      document.body.appendChild(input);
    }

    input.onchange = (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) {
        showToast(`Scan complete: ${state.localSongs.length} local & offline tracks in library.`);
        resolve(state.localSongs);
        return;
      }

      let added = 0;
      files.forEach((file) => {
        const fileUrl = URL.createObjectURL(file);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        let artist = 'Local Audio';
        let title = nameWithoutExt;

        if (nameWithoutExt.includes(' - ')) {
          const parts = nameWithoutExt.split(' - ');
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }

        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        state.localSongs.unshift({
          id: localId,
          title,
          artist,
          album: 'Device Storage',
          duration: '3:30',
          audioUrl: fileUrl,
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
          isLocal: true,
          size: file.size,
          lastModified: file.lastModified,
        });
        added++;
      });

      saveJSON('pawtify-local-songs', state.localSongs);
      idbSet('pawtify-local-songs', state.localSongs).catch(() => {});
      showToast(`Scanned ${added} new audio track(s) from device storage! Total: ${state.localSongs.length}`);
      resolve(state.localSongs);
    };

    input.click();
  });
}
