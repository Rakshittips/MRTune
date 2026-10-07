# MRTune 🎵

> A privacy-friendly, browser-based music streaming player featuring local playlists, Liquid Glass UI, full-screen Spotify Canvas, and distraction-free audio.

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-black?logo=express&logoColor=white)](https://expressjs.com/)
[![Node](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)

---

## ✨ Features

### 💎 Liquid Glass UI & Floating Nav Bar (Android 12+)
* **Refracting Glass Dock**: Android 12+ style real refracting glass with double-specular inner rim highlights, caustic light diffusion, and dynamic chromatic aberration edges that shift with touch and motion.
* **Spring Animation Physics**: Draggable floating navigation island with Hooke's Law elastic stretch resistance, velocity dampening, and spring overshoot return animation.
* **Frosted-Glass Material 3 Theming**: Seamless switching between **Material 3 Light (Frosted Crystal)**, **Material 3 AMOLED Dark**, and **System Auto**, featuring frosted-glass segmented controls.
* **Dynamic Artwork-Driven Theming**: Automatic color extraction from album artwork in real time to tint player surfaces, waveforms, seekbars, and glowing ambient halos.

### 🎬 Full-Screen Spotify Canvas
* **9:16 Portrait Canvas Visualizer**: Dedicated high-definition portrait card mode mimicking Spotify Canvas with audio-reactive organic chromatic particles and fluid light ribbons.
* **Instant Toggle**: Switch between Canvas video loop mode and standard album artwork with a single tap.
* **Artwork Color Matching**: Canvas particle hues automatically adapt to the currently playing track's color palette.

### 📋 Redesigned Liquid Glass Player Queue
* **Slide-Up Glass Drawer**: Frosted glass drawer with grabber drag-to-dismiss gesture, track count, and dynamic total queue duration calculation.
* **Now Playing Card**: Real-time bouncing EQ visualizer bars, source tags (*Local Audio* vs *YouTube Stream*), and quick full-screen launcher.
* **Next Up & History**: Track reordering, swipe gestures, clear upcoming tracks, and quick replay from listening history.
* **Infinite Autoplay**: One-tap toggle to automatically queue similar tracks when the current playback reaches the end.
* **Save Queue as Playlist**: Persist your current session queue into a named local playlist.

### 🎧 Playback & Audio Engine
* **High-Fidelity Audio Streaming**: Powered by a robust YouTube Music backend resolver with automatic retry, 403 error bypass, and stream stall recovery.
* **Offline Downloads**: Download tracks directly to device storage with embedded metadata and artwork via IndexedDB.
* **Local Music Library Scanner**: Scan local audio files on your device and merge them seamlessly with your online library.
* **Last.fm & ListenBrainz Scrobbling**: Automatic scrobbling upon reaching 50% track duration, with playing-now presence updates and finished track logging.
* **Synchronized Lyrics**: Clean lyrics view with intuitive swipe-down / swipe-right back gesture dismiss.
* **Mobile Mini-Player**: Responsive bottom mini-player with horizontal swipe-to-skip and swipe-up to expand full-screen.

---

## 🛠️ Tech Stack

* **Frontend**: Vanilla JavaScript (ESModules), HTML5, CSS3 with Tailwind CSS, FontAwesome 6, D3.js.
* **Backend**: Node.js 22, Express 4.x, `ytmusic-api` search & stream resolution.
* **Bundler & Tooling**: Vite 8.x (configured in middleware mode for full-stack integration), `tsx` TypeScript runner.
* **Storage**: Browser IndexedDB (`idb`) and LocalStorage for offline audio tracks, playlists, favorites, and settings.
* **PWA**: Service Worker with offline asset caching and home screen install banner.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v20.x` or `v22.x`
* **npm**: `v9.x` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rakshittips/mrtune.git
   cd mrtune
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at [http://localhost:3000](http://localhost:3000).

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Run production server**:
   ```bash
   npm start
   ```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns server status, uptime, and API key availability. |
| `GET` | `/api/search?q=<query>&type=songs` | Searches YouTube Music for songs, artists, albums, or videos. |

---

## ⌨️ Gestures & Controls

| Action | Gesture / Shortcut |
| :--- | :--- |
| **Skip Track** | Swipe left / right on the Mobile Mini-Player |
| **Open Fullscreen Player** | Swipe up on the Mobile Mini-Player or tap track cover |
| **Dismiss Lyrics** | Swipe down or swipe right on the Lyrics panel |
| **Quick Add to Queue** | Swipe right (> 95px) on any song row |
| **Drag Nav Bar** | Drag the floating island horizontally or vertically for spring bounce |
| **Toggle Spotify Canvas** | Tap Canvas pill on fullscreen player or via the `···` menu |

---

## 👨‍💻 Developer & Community

* **Developer**: Rakshittips
* **Instagram**: [@mr._rakshit_2.0](https://www.instagram.com/mr._rakshit_2.0)
* **Application Name**: MRTune (Pawtify)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
