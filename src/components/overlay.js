import { state, LOGO_URL } from '../config/config.js';
import { overlayRoot } from '../config/dom.js';
import { escapeHTML } from '../utils/utils.js';
import { getSongById } from '../core/details.js';
import { getScrobblerConfig, getScrobbleLogs } from '../services/scrobbler.js';

export function renderOverlay() {
  if (!overlayRoot) return;
  if (!state.modal) {
    overlayRoot.innerHTML = '';
    return;
  }

  if (state.modal.type === 'libraryMenu') {
    overlayRoot.innerHTML = `
      <section class="overlay" data-action="dismiss-overlay">
        <article class="modal" style="max-width: 380px;">
          <header class="modal-head">
            <h2 class="modal-title"><i class="fa-solid fa-layer-group" style="margin-right:8px; color:var(--green);"></i>Library Options</h2>
            <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:8px;">
            <button class="btn btn-soft" data-action="open-create-playlist" type="button" style="justify-content:flex-start; padding:12px 16px; border-radius:12px;">
              <i class="fa-solid fa-plus" style="margin-right:12px; color:var(--green);"></i> New Playlist
            </button>
            <button class="btn btn-soft" data-action="scan-local-library" type="button" style="justify-content:flex-start; padding:12px 16px; border-radius:12px;">
              <i class="fa-solid fa-folder-tree" style="margin-right:12px; color:#30d158;"></i> Scan Local Music Library
            </button>
            <button class="btn btn-soft" data-action="pick-local-audio" type="button" style="justify-content:flex-start; padding:12px 16px; border-radius:12px;">
              <i class="fa-solid fa-folder-open" style="margin-right:12px; color:#ff9f0a;"></i> Import Audio Files
            </button>
            <button class="btn btn-soft" data-action="open-settings-backup" type="button" style="justify-content:flex-start; padding:12px 16px; border-radius:12px;">
              <i class="fa-solid fa-rotate" style="margin-right:12px; color:#34c759;"></i> Backup &amp; Restore Library
            </button>
            <button class="btn btn-soft" data-action="clear-history" type="button" style="justify-content:flex-start; padding:12px 16px; border-radius:12px; color:#ff453a;">
              <i class="fa-solid fa-trash-can" style="margin-right:12px;"></i> Clear History
            </button>
          </div>
        </article>
      </section>
    `;
    return;
  }

  if (state.modal.type === 'signin') {
    overlayRoot.innerHTML = `
      <section class="overlay" data-action="dismiss-overlay">
        <article class="modal" style="max-width: 400px;">
          <header class="modal-head">
            <h2 class="modal-title"><i class="fa-solid fa-circle-user" style="margin-right:8px; color:var(--green);"></i>Account &amp; Profile</h2>
            <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="modal-body">
            <div style="text-align:center; margin-bottom:18px;">
              <div style="width:72px; height:72px; border-radius:50%; background:#2c2c2e; margin:0 auto 12px; display:grid; place-items:center; color:#fff; font-size:2rem; box-shadow:0 6px 20px rgba(0,0,0,0.4);">
                <i class="fa-solid fa-user"></i>
              </div>
              <h3 style="font-size:1.15rem; font-weight:700; color:#fff;">${state.userName ? escapeHTML(state.userName) : 'Guest User'}</h3>
              <p style="font-size:0.8rem; color:var(--muted); margin-top:2px;">Local account · All your data stays private on this device</p>
            </div>
            <form id="save-username-form">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--muted); margin-bottom:6px;">Your Name / Handle</label>
              <input type="text" id="signin-name-input" name="userName" class="input" value="${escapeHTML(state.userName || '')}" placeholder="Enter your name..." style="width:100%; padding:12px 14px; background:#18181b; border:1px solid rgba(255,255,255,0.15); border-radius:10px; color:#fff; margin-bottom:16px; font-size:1rem;" required />
              <button class="btn btn-primary" data-action="save-profile-name" type="submit" style="width:100%; padding:14px; font-size:1rem; font-weight:700;">Save Profile</button>
            </form>
          </div>
        </article>
      </section>
    `;
    return;
  }

  if (state.modal.type === 'supportApp') {
    overlayRoot.innerHTML = `
      <section class="overlay" data-action="dismiss-overlay">
        <article class="modal" style="max-width: 440px; padding: 20px 22px; max-height: 90vh; overflow-y: auto;">
          <header class="modal-head" style="margin-bottom: 14px;">
            <h2 class="modal-title"><i class="fa-solid fa-heart" style="margin-right:8px; color:#ff2d55;"></i>Support MRTune</h2>
            <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="modal-body" style="text-align:center;">
            <div style="width:60px; height:60px; border-radius:20px; background:rgba(255,45,85,0.15); display:grid; place-items:center; margin:0 auto 12px; color:#ff2d55; font-size:1.75rem;">
              <i class="fa-solid fa-circle-dollar-to-slot"></i>
            </div>
            <h3 style="font-size:1.25rem; font-weight:800; color:#fff; margin-bottom:4px;">Keep MRTune 100% Free</h3>
            <p style="font-size:0.82rem; color:var(--muted); line-height:1.4; margin-bottom:18px;">
              MRTune is free of advertisements &amp; trackers. Your support helps keep servers and audio proxies running smoothly!
            </p>

            <!-- Direct Support via UPI Card -->
            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 16px; text-align: left; margin-bottom: 0;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:8px; background:#10b981; color:#fff; font-size:0.75rem; font-weight:800;">UPI</span>
                  <strong style="color:#fff; font-size:0.95rem;">Direct Support via UPI</strong>
                </div>
                <div style="display:flex; gap:6px;">
                  <span style="font-size:0.7rem; background:rgba(16,185,129,0.18); color:#10b981; border-radius:6px; padding:2px 6px; font-weight:600;">Instant Transfer</span>
                  <span style="font-size:0.7rem; background:rgba(16,185,129,0.18); color:#10b981; border-radius:6px; padding:2px 6px; font-weight:600;">Zero Fees</span>
                </div>
              </div>

              <div style="background:#141416; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
                <span style="display:block; font-size:0.72rem; text-transform:uppercase; color:var(--muted); font-weight:700; margin-bottom:4px; letter-spacing:0.04em;">UPI ID / VPA</span>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                  <code style="font-size:0.95rem; font-weight:700; color:#fff; font-family:monospace; word-break:break-all;">rakshitdhakariya6@oksbi</code>
                  <button class="btn btn-soft" data-action="copy-upi" type="button" style="padding:6px 12px; font-size:0.78rem; flex-shrink:0; border-radius:8px;">
                    <i class="fa-regular fa-copy" style="margin-right:4px;"></i>Copy
                  </button>
                </div>
              </div>

              <!-- Action buttons -->
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:14px;">
                <button class="btn btn-soft" data-action="copy-upi" type="button" style="padding:10px 12px; font-size:0.85rem; font-weight:600; justify-content:center;">
                  <i class="fa-regular fa-copy" style="margin-right:6px;"></i>Copy UPI
                </button>
                <a href="upi://pay?pa=rakshitdhakariya6@oksbi&pn=MRTune&cu=INR" class="btn btn-primary" style="padding:10px 12px; font-size:0.85rem; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; justify-content:center;">
                  <i class="fa-solid fa-arrow-up-right-from-square" style="margin-right:6px;"></i>Pay via UPI App
                </a>
              </div>

              <!-- Supported Apps & Payment Methods -->
              <div style="border-top:1px solid rgba(255,255,255,0.08); padding-top:12px;">
                <span style="display:block; font-size:0.72rem; color:var(--muted); font-weight:700; text-transform:uppercase; margin-bottom:8px; letter-spacing:0.03em;">Supported Apps &amp; Payment Methods:</span>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                  <span style="font-size:0.75rem; padding:4px 9px; border-radius:8px; background:rgba(255,255,255,0.08); color:#e4e4e7;"><i class="fa-brands fa-google-pay" style="margin-right:4px; color:#4285F4;"></i>Google Pay</span>
                  <span style="font-size:0.75rem; padding:4px 9px; border-radius:8px; background:rgba(255,255,255,0.08); color:#e4e4e7;"><i class="fa-solid fa-mobile-screen" style="margin-right:4px; color:#5f259f;"></i>PhonePe</span>
                  <span style="font-size:0.75rem; padding:4px 9px; border-radius:8px; background:rgba(255,255,255,0.08); color:#e4e4e7;"><i class="fa-solid fa-wallet" style="margin-right:4px; color:#00baf2;"></i>Paytm</span>
                  <span style="font-size:0.75rem; padding:4px 9px; border-radius:8px; background:rgba(255,255,255,0.08); color:#e4e4e7;"><i class="fa-solid fa-building-columns" style="margin-right:4px; color:#f97316;"></i>BHIM UPI</span>
                  <span style="font-size:0.75rem; padding:4px 9px; border-radius:8px; background:rgba(255,255,255,0.08); color:#e4e4e7;"><i class="fa-solid fa-credit-card" style="margin-right:4px; color:#e2e8f0;"></i>Cred</span>
                  <span style="font-size:0.75rem; padding:4px 9px; border-radius:8px; background:rgba(255,255,255,0.08); color:#e4e4e7;"><i class="fa-solid fa-landmark" style="margin-right:4px; color:#10b981;"></i>Any Bank App</span>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
    `;
    return;
  }

  if (state.modal.type === 'songDetails') {
    const song = state.currentSong;
    if (!song) {
      overlayRoot.innerHTML = '';
      return;
    }
    overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal">
           <header class="modal-head">
             <h2 class="modal-title">Song Details</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </header>
           <div class="modal-body">
             <div style="display:flex; gap:16px; align-items:center;">
               <img src="${escapeHTML(song.coverUrl)}" style="width:80px; height:80px; border-radius:var(--radius-sm); object-fit:cover;" alt="" />
               <div>
                 <h3 style="font-size:1.25rem; font-weight:700;">${escapeHTML(song.title)}</h3>
                 <p style="color:var(--muted); margin-top:4px;">${escapeHTML(song.artist)}</p>
               </div>
             </div>
             <div class="meta-list">
               <p class="meta-item"><b>Quality:</b> HQ Audio Stream</p>
               <p class="meta-item"><b>Duration:</b> ${escapeHTML(song.duration || '0:00')}</p>
             </div>
             <div style="display:flex; gap:10px; margin-top:16px;">
               <button class="btn btn-primary" data-action="download-song" type="button" style="flex:1;">
                 <i class="fa-solid fa-download"></i> Download
               </button>
               <button class="btn btn-soft" data-action="share-song" type="button" style="flex:1;">
                 <i class="fa-solid fa-share-nodes"></i> Share
               </button>
             </div>
           </div>
         </article>
       </section>
     `;
    return;
  }

  if (state.modal.type === 'playlistPicker') {
    const song = getSongById(state.modal.songId);
    if (!song) {
      overlayRoot.innerHTML = '';
      return;
    }
    overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal" style="max-width: 440px; max-height: 85vh; display: flex; flex-direction: column;">
           <header class="modal-head">
             <h2 class="modal-title"><i class="fa-solid fa-list-check" style="margin-right:8px; color:var(--green);"></i>Add to Playlist</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </header>
           <div class="modal-body" style="overflow-y: auto; padding-top: 4px;">
             <!-- Track Mini Banner -->
             <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.05); padding: 10px 12px; border-radius: 12px; margin-bottom: 14px; border: 1px solid rgba(255,255,255,0.08);">
               <img src="${escapeHTML(song.coverUrl)}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover;" alt="" />
               <div style="flex: 1; min-width: 0;">
                 <h4 style="font-size: 0.9rem; font-weight: 700; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(song.title)}</h4>
                 <p style="color: var(--muted); font-size: 0.75rem; margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(song.artist)}</p>
               </div>
             </div>

             <!-- Quick New Playlist Input -->
             <div style="display: flex; gap: 8px; margin-bottom: 14px;">
               <input class="text-input" id="quick-playlist-input" placeholder="New playlist name..." maxlength="35" style="flex: 1; padding: 10px 14px; font-size: 0.85rem; border-radius: 10px;" />
               <button class="btn btn-primary" data-action="quick-create-playlist" data-song-id="${escapeHTML(song.id)}" type="button" style="padding: 10px 16px; font-size: 0.85rem; border-radius: 10px; flex-shrink: 0;">
                 <i class="fa-solid fa-plus" style="margin-right: 4px;"></i> Create
               </button>
             </div>

             <!-- Playlist Rows List -->
             <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;">
               ${(state.playlists || []).map((playlist) => {
                 const exists = (playlist.songs || []).some((item) => item.id === song.id);
                 const count = playlist.songs ? playlist.songs.length : 0;
                 return `
                 <button class="btn btn-soft" style="justify-content: space-between; padding: 10px 14px; border-radius: 12px; border: 1px solid ${exists ? 'rgba(29,185,84,0.3)' : 'rgba(255,255,255,0.06)'}; background: ${exists ? 'rgba(29,185,84,0.1)' : 'rgba(255,255,255,0.03)'};" data-action="playlist-toggle-song" data-song-id="${escapeHTML(song.id)}" data-playlist-id="${escapeHTML(playlist.id)}" type="button">
                   <div style="display: flex; align-items: center; gap: 10px; text-align: left;">
                     <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.08); display: grid; place-items: center; color: ${exists ? 'var(--green)' : 'var(--muted)'};">
                       <i class="fa-solid fa-list-ul" style="font-size: 0.85rem;"></i>
                     </div>
                     <div>
                       <div style="font-weight: 600; font-size: 0.88rem; color: #fff;">${escapeHTML(playlist.name)}</div>
                       <div style="font-size: 0.72rem; color: var(--muted);">${count} song${count === 1 ? '' : 's'}</div>
                     </div>
                   </div>
                   <div style="display: flex; align-items: center; gap: 6px;">
                     <span style="font-size: 0.75rem; font-weight: 600; color: ${exists ? 'var(--green)' : 'var(--muted)'};">${exists ? 'Added' : 'Add'}</span>
                     <i class="${exists ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}" style="font-size: 1.1rem; color: ${exists ? 'var(--green)' : 'rgba(255,255,255,0.3)'};"></i>
                   </div>
                 </button>
               `;
               }).join('')}
             </div>

             <button class="btn btn-soft" data-action="close-modal" type="button" style="width: 100%; border-radius: 10px; padding: 11px;">Done</button>
           </div>
         </article>
       </section>
     `;
    return;
  }

  if (state.modal.type === 'createPlaylist') {
    overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal">
           <header class="modal-head">
             <h2 class="modal-title">Create Playlist</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </header>
           <form id="create-playlist-form" class="modal-body">
             <div class="form-row">
               <label class="form-label" for="playlist-name">Playlist Name</label>
               <input class="text-input" id="playlist-name" name="playlistName" required placeholder="My Awesome Playlist" maxlength="40" />
             </div>
             <button class="btn btn-primary" type="submit">Create Playlist</button>
           </form>
         </article>
       </section>
     `;
    return;
  }

  if (state.modal.type === 'welcome' || state.modal.type === 'editName') {
    const isEdit = state.modal.type === 'editName';
    overlayRoot.innerHTML = `
       <section class="overlay welcome-overlay" data-action="dismiss-overlay">
         <article class="modal welcome-modal personalized-welcome-card" style="max-width: 400px;">
           <header class="modal-head">
             <h2 class="modal-title">${isEdit ? 'Edit Name' : 'Welcome'}</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </header>
           <form id="save-name-form" class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
             <div>
               <label class="form-label" for="welcome-user-name" style="font-size: 1.05rem; font-weight: 600; margin-bottom: 4px; display: block; color: var(--text);">What should we call you?</label>
               <p style="font-size: 0.8125rem; color: var(--muted); margin: 0;">
                 Stored locally on this device.
               </p>
             </div>
             <div>
               <input 
                 type="text" 
                 id="welcome-user-name" 
                 name="userName" 
                 class="text-input" 
                 placeholder="Your name" 
                 value="${escapeHTML(state.userName || '')}" 
                 maxlength="28" 
                 autocomplete="name" 
                 required
                 autofocus
                 style="width: 100%;" 
               />
             </div>
             <div style="display: flex; gap: 10px; margin-top: 4px;">
               <button class="btn btn-primary" type="submit" style="flex: 1;">
                 ${isEdit ? 'Save' : 'Continue'}
               </button>
               ${isEdit && state.userName ? `
                 <button class="btn btn-soft" data-action="reset-user-name" type="button" style="color: var(--danger, #f43f5e);" title="Clear saved name">
                   Reset
                 </button>
               ` : ''}
             </div>
           </form>
         </article>
       </section>
     `;
    return;
  }

  if (state.modal.type === 'appInfo' || state.modal.type === 'about') {
    overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal" style="max-width: 440px;">
           <header class="modal-head">
             <h2 class="modal-title"><i class="fa-solid fa-circle-info" style="margin-right:8px; color:#636366;"></i>About MRTune</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </header>
           <div class="modal-body">
             <div style="display:flex; align-items:center; gap:16px; margin-bottom:14px;">
               <img src="${LOGO_URL}" style="width:64px; height:64px; border-radius:18px; object-fit:cover; box-shadow:0 8px 24px rgba(0,0,0,0.5);" alt="MRTune" />
               <div>
                 <h3 style="font-size:1.25rem; font-weight:700; font-family:var(--font-display);">MRTune</h3>
                 <p style="color:var(--muted); font-size:0.8125rem; margin-top:2px;">Version 2.4.0 (Pure Music Edition)</p>
                 <span style="display:inline-block; font-size:0.7rem; background:rgba(29,185,84,0.15); color:var(--green); border-radius:999px; padding:2px 8px; margin-top:4px; font-weight:600;">iOS Glass Engine</span>
               </div>
             </div>
             <div class="meta-list" style="margin-top:12px;">
               <p class="meta-item"><i class="fa-solid fa-code" style="margin-right:8px; color:#a855f7;"></i><b>Developer:</b> Rakshittips</p>
               <p class="meta-item"><i class="fa-brands fa-instagram" style="margin-right:8px; color:#e1306c;"></i><b>Instagram:</b> <a href="https://www.instagram.com/mr._rakshit_2.0" target="_blank" rel="noopener noreferrer" style="color:#e1306c; text-decoration:underline;">@mr._rakshit_2.0</a></p>
               <p class="meta-item"><i class="fa-brands fa-github" style="margin-right:8px; color:var(--green);"></i><b>Open Source:</b> <a href="https://github.com/Rakshittips/MRTune" target="_blank" rel="noopener" style="color:var(--green); text-decoration:underline;">github.com/Rakshittips/MRTune</a></p>
               <p class="meta-item"><i class="fa-solid fa-bolt" style="margin-right:8px; color:#ff9f0a;"></i><b>Audio Stream:</b> YouTube High-Fidelity Audio Proxy</p>
               <p class="meta-item"><i class="fa-solid fa-shield-halved" style="margin-right:8px; color:#0a84ff;"></i><b>Privacy:</b> 100% Client-Side &amp; Local Storage Only</p>
               <p class="meta-item" style="cursor:pointer;" data-action="open-support-modal"><i class="fa-solid fa-hand-holding-heart" style="margin-right:8px; color:#ff2d55;"></i><b>Support:</b> <span style="color:#ff2d55; text-decoration:underline; font-weight:600;">Support to keep the app free forever</span></p>
               <p class="meta-item"><i class="fa-solid fa-heart" style="margin-right:8px; color:#ff2d55;"></i><b>Made with love</b> by Rakshittips for distraction-free music streaming.</p>
             </div>
             <div style="margin-top:16px; margin-bottom:12px;">
               <button class="btn" data-action="open-support-modal" type="button" style="width:100%; padding:13px 16px; background:linear-gradient(135deg, rgba(255,45,85,0.18), rgba(168,85,247,0.18)); border:1px solid rgba(255,45,85,0.35); border-radius:14px; color:#fff; display:flex; align-items:center; gap:12px; cursor:pointer; text-align:left; box-shadow:0 6px 20px rgba(255,45,85,0.15); transition:all 0.2s ease;">
                 <div style="width:36px; height:36px; border-radius:10px; background:rgba(255,45,85,0.22); display:grid; place-items:center; flex-shrink:0; color:#ff2d55; font-size:1.15rem;">
                   <i class="fa-solid fa-heart"></i>
                 </div>
                 <div style="flex:1;">
                   <strong style="display:block; font-size:0.9rem; color:#fff; font-weight:700;">Support MRTune</strong>
                   <span style="display:block; font-size:0.75rem; color:#ff7597; font-weight:500;">Support to keep the app free forever</span>
                 </div>
                 <i class="fa-solid fa-chevron-right" style="color:rgba(255,255,255,0.4); font-size:0.75rem;"></i>
               </button>
             </div>
             <div style="margin-top:8px; display:flex; flex-direction:column; gap:8px;">
               <button class="btn btn-soft" data-action="open-patch-notes" type="button" style="width:100%; justify-content:center; border:1px solid rgba(255,255,255,0.1);">
                 <i class="fa-solid fa-bolt" style="color:#ff9f0a; margin-right:8px;"></i> View Latest Patch Notes
               </button>
               <button class="btn btn-soft" data-action="close-modal" type="button" style="width:100%;">Done</button>
             </div>
           </div>
         </article>
       </section>
     `;
    return;
  }

  if (state.modal.type === 'patchNotes') {
    overlayRoot.innerHTML = `
      <section class="overlay" data-action="dismiss-overlay">
        <article class="modal" style="max-width: 480px; max-height: 88vh; display:flex; flex-direction:column;">
          <header class="modal-head">
            <div>
              <h2 class="modal-title"><i class="fa-solid fa-bolt" style="margin-right:8px; color:#ff9f0a;"></i>MRTune Patch Notes</h2>
              <span style="font-size:0.75rem; color:var(--green); font-weight:700; background:rgba(29,185,84,0.15); padding:2px 8px; border-radius:999px; margin-top:4px; display:inline-block;">v2.4.2 — Latest Release</span>
            </div>
            <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="modal-body" style="overflow-y:auto; padding-top:6px;">
            <div style="display:flex; flex-direction:column; gap:10px;">

              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px;">
                <div style="font-weight:700; color:#fff; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-download" style="color:var(--green);"></i> Offline Downloads
                </div>
                <p style="font-size:0.8rem; color:var(--muted); margin-top:4px; line-height:1.4;">
                  Save tracks to device with embedded metadata + cover art. 100% offline playback via IndexedDB.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px;">
                <div style="font-weight:700; color:#fff; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-folder-tree" style="color:#0a84ff;"></i> Local Music Library Scanning
                </div>
                <p style="font-size:0.8rem; color:var(--muted); margin-top:4px; line-height:1.4;">
                  Device storage + downloaded tracks combined in unified local library with metadata tags.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px;">
                <div style="font-weight:700; color:#fff; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-headphones" style="color:#ff2d55;"></i> Last.fm + ListenBrainz Scrobbling
                </div>
                <p style="font-size:0.8rem; color:var(--muted); margin-top:4px; line-height:1.4;">
                  Real-time scrobbling and playback tracking to Last.fm and ListenBrainz.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px;">
                <div style="font-weight:700; color:#fff; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-list-check" style="color:#a855f7;"></i> Add-to-Playlist Picker
                </div>
                <p style="font-size:0.8rem; color:var(--muted); margin-top:4px; line-height:1.4;">
                  Upgraded picker with song info, quick playlist creation, and multi-playlist toggling.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px;">
                <div style="font-weight:700; color:#fff; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-palette" style="color:#ff9f0a;"></i> Dynamic Artwork-Driven Theming
                </div>
                <p style="font-size:0.8rem; color:var(--muted); margin-top:4px; line-height:1.4;">
                  Adaptive hues and glowing liquid glass backgrounds extracted from album cover art.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px;">
                <div style="font-weight:700; color:#fff; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-arrows-up-down-left-right" style="color:#30d158;"></i> Draggable Bottom Nav Bar
                </div>
                <p style="font-size:0.8rem; color:var(--muted); margin-top:4px; line-height:1.4;">
                  Draggable dock with elastic spring physics, liquid capsule stretch, and snap-back.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px;">
                <div style="font-weight:700; color:#fff; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-arrow-left" style="color:#64d2ff;"></i> Back Gesture to Dismiss Lyrics
                </div>
                <p style="font-size:0.8rem; color:var(--muted); margin-top:4px; line-height:1.4;">
                  Swipe right from lyrics screen to instantly return to music view.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px;">
                <div style="font-weight:700; color:#fff; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-shield-virus" style="color:#ff453a;"></i> 403 &amp; Stream Stalls Fixed
                </div>
                <p style="font-size:0.8rem; color:var(--muted); margin-top:4px; line-height:1.4;">
                  Updated YouTube Music client versions, shared HTTP headers, and 30-min resolution cache.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px;">
                <div style="font-weight:700; color:#fff; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-check-double" style="color:#ffd60a;"></i> ListenBrainz Finished Track Logging
                </div>
                <p style="font-size:0.8rem; color:var(--muted); margin-top:4px; line-height:1.4;">
                  Finished tracks accurately recorded with listen_type "single" and precise timestamps.
                </p>
              </div>

              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px 14px;">
                <div style="font-weight:700; color:#fff; font-size:0.92rem; display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-hand-pointer" style="color:#bf5af2;"></i> Accidental Drag Protection on Queue
                </div>
                <p style="font-size:0.8rem; color:var(--muted); margin-top:4px; line-height:1.4;">
                  Vertical scrolling no longer triggers accidental queue adds on song rows.
                </p>
              </div>

            </div>

            <button class="btn btn-primary" data-action="close-modal" type="button" style="width:100%; margin-top:16px; border-radius:10px; padding:12px;">Got it</button>
          </div>
        </article>
      </section>
    `;
    return;
  }

  if (state.modal.type === 'scrobblerSettings') {
    const config = getScrobblerConfig();
    const logs = getScrobbleLogs();
    overlayRoot.innerHTML = `
      <section class="overlay" data-action="dismiss-overlay">
        <article class="modal" style="max-width: 460px; max-height: 88vh; display:flex; flex-direction:column;">
          <header class="modal-head">
            <h2 class="modal-title"><i class="fa-solid fa-headphones" style="margin-right:8px; color:#ff2d55;"></i>Scrobbling Settings</h2>
            <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="modal-body" style="overflow-y:auto; padding-top:6px;">
            <!-- ListenBrainz Config -->
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="background:#ff2d55; color:#fff; border-radius:6px; font-weight:800; font-size:0.7rem; padding:2px 6px;">LB</span>
                  <strong style="color:#fff; font-size:0.95rem;">ListenBrainz</strong>
                </div>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="lb-enable-toggle" ${config.listenbrainzEnabled ? 'checked' : ''} style="accent-color:var(--green); width:18px; height:18px;" />
                  <span style="font-size:0.8rem; color:${config.listenbrainzEnabled ? 'var(--green)' : 'var(--muted)'}; font-weight:600;">${config.listenbrainzEnabled ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
              <p style="font-size:0.78rem; color:var(--muted); margin-bottom:10px;">
                Enter your User Token from <a href="https://listenbrainz.org/profile/" target="_blank" rel="noopener noreferrer" style="color:var(--green); text-decoration:underline;">listenbrainz.org</a>
              </p>
              <input class="text-input" id="lb-token-input" type="password" placeholder="ListenBrainz User Token" value="${escapeHTML(config.listenbrainzToken || '')}" style="width:100%; padding:10px 12px; font-size:0.85rem; border-radius:10px;" />
            </div>

            <!-- Last.fm Config -->
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="background:#d51007; color:#fff; border-radius:6px; font-weight:800; font-size:0.7rem; padding:2px 6px;">LFM</span>
                  <strong style="color:#fff; font-size:0.95rem;">Last.fm</strong>
                </div>
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="lfm-enable-toggle" ${config.lastfmEnabled ? 'checked' : ''} style="accent-color:var(--green); width:18px; height:18px;" />
                  <span style="font-size:0.8rem; color:${config.lastfmEnabled ? 'var(--green)' : 'var(--muted)'}; font-weight:600;">${config.lastfmEnabled ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
              <p style="font-size:0.78rem; color:var(--muted); margin-bottom:10px;">
                Connect your Last.fm account for scrobbles.
              </p>
              <input class="text-input" id="lfm-user-input" placeholder="Last.fm Username" value="${escapeHTML(config.lastfmUsername || '')}" style="width:100%; padding:10px 12px; font-size:0.85rem; border-radius:10px; margin-bottom:8px;" />
              <input class="text-input" id="lfm-session-input" type="password" placeholder="Session Key (Optional)" value="${escapeHTML(config.lastfmSessionKey || '')}" style="width:100%; padding:10px 12px; font-size:0.85rem; border-radius:10px;" />
            </div>

            <!-- Recent Scrobble History Logs -->
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-bottom:14px;">
              <h4 style="font-size:0.85rem; font-weight:700; color:#fff; margin-bottom:8px;">Recent Scrobble Activity</h4>
              ${logs.length ? `
                <div style="display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto;">
                  ${logs.slice(0, 8).map(l => `
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                      <span style="color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:260px;">${escapeHTML(l.title)} — ${escapeHTML(l.artist)}</span>
                      <span style="color:${l.status === 'Logged' ? 'var(--green)' : '#ff9f0a'}; font-weight:600;">${escapeHTML(l.status)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : `<p style="font-size:0.78rem; color:var(--muted);">No scrobbles logged yet. Start playing a track!</p>`}
            </div>

            <button class="btn btn-primary" data-action="save-scrobbler-config" type="button" style="width:100%; border-radius:10px; padding:12px;">Save Settings</button>
          </div>
        </article>
      </section>
    `;
    return;
  }

  if (state.modal.type === 'settingsTheme') {
    const currentMode = state.themeMode || 'dark';
    const currentAccent = state.accentColor || '#1db954';
    const isDynamic = state.dynamicArtworkTheme !== false;
    const themes = [
      { id: 'emerald', name: 'Spotify Emerald', color: '#1db954' },
      { id: 'blue', name: 'iOS Royal Blue', color: '#0a84ff' },
      { id: 'pink', name: 'Apple Music Rose', color: '#ff2d55' },
      { id: 'cyan', name: 'Cyber Neon Cyan', color: '#00f2fe' },
      { id: 'purple', name: 'Deep Purple Aura', color: '#a855f7' },
      { id: 'amber', name: 'Sunset Amber Gold', color: '#ff9f0a' },
    ];
    overlayRoot.innerHTML = `
      <section class="overlay" data-action="dismiss-overlay">
        <article class="modal" style="max-width: 440px;">
          <header class="modal-head">
            <h2 class="modal-title"><i class="fa-solid fa-palette" style="margin-right:8px; color:#0a84ff;"></i>Theme &amp; Appearance</h2>
            <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:16px;">
            <!-- Material 3 Light / Dark / System Segmented Control -->
            <div>
              <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); display:block; margin-bottom:8px;">Material 3 Theme Mode</span>
              <div class="m3-theme-segmented-group" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; background:rgba(255,255,255,0.06); padding:4px; border-radius:14px; border:1px solid rgba(255,255,255,0.08);">
                <button class="m3-theme-segment-btn ${currentMode === 'light' ? 'active' : ''}" data-action="select-theme-mode" data-mode="light" type="button" style="display:flex; flex-direction:column; align-items:center; gap:4px; padding:10px 6px; border-radius:10px; border:none; background:${currentMode === 'light' ? 'rgba(255,255,255,0.22)' : 'transparent'}; color:#fff; cursor:pointer; transition:all 0.2s ease;">
                  <i class="fa-solid fa-sun" style="font-size:1rem; color:${currentMode === 'light' ? '#ff9f0a' : 'inherit'};"></i>
                  <span style="font-size:0.78rem; font-weight:600;">Light</span>
                </button>
                <button class="m3-theme-segment-btn ${currentMode === 'dark' ? 'active' : ''}" data-action="select-theme-mode" data-mode="dark" type="button" style="display:flex; flex-direction:column; align-items:center; gap:4px; padding:10px 6px; border-radius:10px; border:none; background:${currentMode === 'dark' ? 'rgba(255,255,255,0.22)' : 'transparent'}; color:#fff; cursor:pointer; transition:all 0.2s ease;">
                  <i class="fa-solid fa-moon" style="font-size:1rem; color:${currentMode === 'dark' ? '#0a84ff' : 'inherit'};"></i>
                  <span style="font-size:0.78rem; font-weight:600;">AMOLED Dark</span>
                </button>
                <button class="m3-theme-segment-btn ${currentMode === 'system' ? 'active' : ''}" data-action="select-theme-mode" data-mode="system" type="button" style="display:flex; flex-direction:column; align-items:center; gap:4px; padding:10px 6px; border-radius:10px; border:none; background:${currentMode === 'system' ? 'rgba(255,255,255,0.22)' : 'transparent'}; color:#fff; cursor:pointer; transition:all 0.2s ease;">
                  <i class="fa-solid fa-circle-half-stroke" style="font-size:1rem; color:${currentMode === 'system' ? '#a855f7' : 'inherit'};"></i>
                  <span style="font-size:0.78rem; font-weight:600;">System Auto</span>
                </button>
              </div>
            </div>

            <!-- Dynamic Artwork-Driven Theming Toggle -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:rgba(255,255,255,0.04); border-radius:12px; border:1px solid rgba(255,255,255,0.08); gap:12px;">
              <div style="flex:1;">
                <strong style="display:block; font-size:0.9rem; color:#fff; font-weight:700;">Artwork-Driven Theming</strong>
                <span style="font-size:0.76rem; color:var(--muted); line-height:1.4; display:block;">Dynamically tints player surfaces, waveforms, and glowing highlights using album artwork</span>
              </div>
              <label class="liquid-switch">
                <input type="checkbox" ${isDynamic ? 'checked' : ''} data-action="toggle-artwork-theming" />
                <span class="liquid-switch-slider"></span>
              </label>
            </div>

            <!-- Accent Palette Selection -->
            <div>
              <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); display:block; margin-bottom:8px;">Base Accent Tint</span>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                ${themes.map((t) => `
                  <button class="theme-choice-card ${currentAccent.toLowerCase() === t.color.toLowerCase() ? 'active' : ''}" data-action="select-theme-accent" data-color="${t.color}" type="button" style="display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid ${currentAccent.toLowerCase() === t.color.toLowerCase() ? t.color : 'rgba(255,255,255,0.1)'}; color:#fff; cursor:pointer; text-align:left; transition:all 0.15s ease;">
                    <span style="width:18px; height:18px; border-radius:50%; background:${t.color}; box-shadow:0 0 8px ${t.color}88; flex-shrink:0;"></span>
                    <span style="font-size:0.82rem; font-weight:600;">${t.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <div style="margin-top:6px; display:flex; justify-content:flex-end;">
              <button class="btn btn-primary" data-action="close-modal" type="button" style="min-width:90px;">Done</button>
            </div>
          </div>
        </article>
      </section>
    `;
    return;
  }

  if (state.modal.type === 'settingsUI') {
    overlayRoot.innerHTML = `
      <section class="overlay" data-action="dismiss-overlay">
        <article class="modal" style="max-width: 440px;">
          <header class="modal-head">
            <h2 class="modal-title"><i class="fa-solid fa-mobile-screen" style="margin-right:8px; color:#ff9f0a;"></i>App UI Preferences</h2>
            <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:16px;">
            <!-- Liquid Glass Primary Option -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 16px; background:rgba(255,255,255,0.04); border-radius:14px; border:1px solid rgba(255,255,255,0.08); gap:14px;">
              <div style="flex:1;">
                <strong style="display:block; font-size:1rem; color:#fff; font-weight:700; margin-bottom:3px;">Liquid Glass</strong>
                <span style="font-size:0.8rem; color:var(--muted); line-height:1.4; display:block;">It might have performance impact on lower end phones, use it based on your preference.</span>
              </div>
              <label class="ios-switch">
                <input type="checkbox" id="liquid-glass-toggle" ${state.liquidGlass !== false ? 'checked' : ''} data-action="toggle-liquid-glass" />
                <span class="ios-switch-slider"></span>
              </label>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(255,255,255,0.04); border-radius:12px; border:1px solid rgba(255,255,255,0.08);">
              <div>
                <strong style="display:block; font-size:0.95rem; color:#fff;">Dynamic Ambient Glow</strong>
                <span style="font-size:0.75rem; color:var(--muted);">Atmospheric blurred lighting around player</span>
              </div>
              <input type="checkbox" checked style="accent-color:var(--green); transform:scale(1.25); cursor:pointer;" />
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(255,255,255,0.04); border-radius:12px; border:1px solid rgba(255,255,255,0.08);">
              <div>
                <strong style="display:block; font-size:0.95rem; color:#fff;">Wavy Animated Progress Bar</strong>
                <span style="font-size:0.75rem; color:var(--muted);">Fluid audio wave playback track</span>
              </div>
              <input type="checkbox" checked style="accent-color:var(--green); transform:scale(1.25); cursor:pointer;" />
            </div>

            <div style="margin-top:6px;">
              <button class="btn btn-primary" data-action="close-modal" type="button" style="width:100%;">Done</button>
            </div>
          </div>
        </article>
      </section>
    `;
    return;
  }

  if (state.modal.type === 'settingsPlayback') {
    overlayRoot.innerHTML = `
      <section class="overlay" data-action="dismiss-overlay">
        <article class="modal" style="max-width: 460px;">
          <header class="modal-head">
            <h2 class="modal-title"><i class="fa-solid fa-music" style="margin-right:8px; color:#ff2d55;"></i>Music &amp; Playback</h2>
            <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:16px;">
            <div>
              <label style="display:block; font-size:0.75rem; text-transform:uppercase; color:var(--muted); font-weight:700; margin-bottom:8px;">Audio Streaming Quality</label>
              <select class="input" style="width:100%; padding:10px 14px; background:#18181b; border:1px solid rgba(255,255,255,0.15); border-radius:10px; color:#fff;">
                <option value="320" selected>Very High (320 kbps HQ - Studio Audio)</option>
                <option value="256">High (256 kbps - Balanced)</option>
                <option value="160">Normal (160 kbps)</option>
                <option value="96">Data Saver (96 kbps - Mobile Data)</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; text-transform:uppercase; color:var(--muted); font-weight:700; margin-bottom:8px;">Crossfade Between Tracks</label>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-primary small" type="button" style="flex:1;">Off</button>
                <button class="btn btn-soft small" type="button" style="flex:1;">2s</button>
                <button class="btn btn-soft small" type="button" style="flex:1;">4s</button>
                <button class="btn btn-soft small" type="button" style="flex:1;">8s</button>
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; text-transform:uppercase; color:var(--muted); font-weight:700; margin-bottom:8px;">Sleep Timer</label>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn btn-soft small" data-action="set-sleep-timer" data-minutes="15" type="button" style="flex:1;">15 min</button>
                <button class="btn btn-soft small" data-action="set-sleep-timer" data-minutes="30" type="button" style="flex:1;">30 min</button>
                <button class="btn btn-soft small" data-action="set-sleep-timer" data-minutes="45" type="button" style="flex:1;">45 min</button>
                <button class="btn btn-soft small" data-action="set-sleep-timer" data-minutes="60" type="button" style="flex:1;">1 hour</button>
              </div>
            </div>

            <div style="margin-top:8px;">
              <button class="btn btn-primary" data-action="close-modal" type="button" style="width:100%;">Done</button>
            </div>
          </div>
        </article>
      </section>
    `;
    return;
  }

  if (state.modal.type === 'settingsOthers') {
    overlayRoot.innerHTML = `
      <section class="overlay" data-action="dismiss-overlay">
        <article class="modal" style="max-width: 440px;">
          <header class="modal-head">
            <h2 class="modal-title"><i class="fa-solid fa-gear" style="margin-right:8px; color:#8e8e93;"></i>Preferences &amp; Cache</h2>
            <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:16px;">
            <div style="padding:14px; background:rgba(255,255,255,0.04); border-radius:12px; border:1px solid rgba(255,255,255,0.08);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="color:#fff; font-size:0.95rem;">Storage &amp; Audio Cache</strong>
                <span style="font-size:0.8rem; color:var(--green); font-weight:700;">14.2 MB used</span>
              </div>
              <p style="font-size:0.75rem; color:var(--muted); margin-bottom:12px;">Temporary audio chunks and album thumbnails saved for faster loading.</p>
              <button class="btn btn-soft small" data-action="clear-cache" type="button" style="width:100%;">
                <i class="fa-solid fa-trash-can" style="margin-right:6px;"></i> Clear Playback Cache
              </button>
            </div>

            <div style="padding:14px; background:rgba(255,255,255,0.04); border-radius:12px; border:1px solid rgba(255,255,255,0.08);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="color:#fff; font-size:0.95rem;">Listening History</strong>
                <span style="font-size:0.8rem; color:var(--muted);">${state.recentlyPlayed?.length || 0} tracks</span>
              </div>
              <button class="btn btn-soft small" data-action="clear-history" type="button" style="width:100%;">
                <i class="fa-solid fa-clock-rotate-left" style="margin-right:6px;"></i> Clear Listening History
              </button>
            </div>

            <div style="margin-top:6px;">
              <button class="btn btn-primary" data-action="close-modal" type="button" style="width:100%;">Done</button>
            </div>
          </div>
        </article>
      </section>
    `;
    return;
  }

  if (state.modal.type === 'settingsBackup') {
    overlayRoot.innerHTML = `
      <section class="overlay" data-action="dismiss-overlay">
        <article class="modal" style="max-width: 440px;">
          <header class="modal-head">
            <h2 class="modal-title"><i class="fa-solid fa-rotate" style="margin-right:8px; color:#34c759;"></i>Backup &amp; Restore</h2>
            <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
            <p style="font-size:0.85rem; color:var(--muted); line-height:1.45;">Save a complete backup of all your custom playlists, favorite tracks, and settings to an offline JSON file, or restore an existing backup on any device.</p>

            <button class="btn btn-primary" data-action="export-library-backup" type="button" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px;">
              <i class="fa-solid fa-file-arrow-down"></i> Export Library Backup (JSON)
            </button>

            <button class="btn btn-soft" data-action="import-library-backup" type="button" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px;">
              <i class="fa-solid fa-file-arrow-up"></i> Import &amp; Restore Library (JSON)
            </button>

            <div style="margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:14px; text-align:center;">
              <button class="btn btn-soft" data-action="close-modal" type="button" style="min-width:90px;">Done</button>
            </div>
          </div>
        </article>
      </section>
    `;
    return;
  }
}
