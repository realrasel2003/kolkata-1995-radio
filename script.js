const audio = document.getElementById("audio");
const player = document.getElementById("player");
const play = document.getElementById("play");
const prev = document.getElementById("prev");
const next = document.getElementById("next");
const seek = document.getElementById("seek");
const cur = document.getElementById("cur");
const dur = document.getElementById("dur");
const title = document.getElementById("title");
const artist = document.getElementById("artist");
const volumeKnob = document.getElementById("volumeKnob");
const tuningKnob = document.getElementById("tuningKnob");
const freqMain = document.getElementById("freqMain");
const freqDec = document.getElementById("freqDec");
// Station content is kept separately in station-data.js so the music catalogue
// can be updated later without touching the radio interface.
const playlist = window.KR95_STATION?.tracks || [];
const presetButtons = document.getElementById("presetButtons");
const trackCount = document.getElementById("trackCount");
let presets = [];

function renderPresets() {
  if (!presetButtons) return;
  presetButtons.innerHTML = playlist.map((track, index) => `
    <button class="preset${index === 0 ? " active" : ""}" data-track="${index}" type="button" aria-label="Preset ${index + 1}: ${track.title}">${index + 1}</button>
  `).join("");
  presets = [...presetButtons.querySelectorAll(".preset")];
  presets.forEach(btn => {
    btn.onclick = () => {
      const wasPlaying = !audio.paused;
      loadTrack(Number(btn.dataset.track), wasPlaying);
    };
  });
  if (trackCount) trackCount.textContent = `${playlist.length} TRACK${playlist.length === 1 ? "" : "S"}`;
}

renderPresets();

let trackIndex = 0;
let vol = 0.8;
let vAngle = 35;
let tAngle = -28;
let tuningMoved = false;
let tuningStartY = 0;
let tuningStartAngle = tAngle;

const fmt = s => !Number.isFinite(s) ? "0:00" : Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

function updateNeedle(freq) {
  const min = 88;
  const max = 108;
  const pct = Math.max(0, Math.min(100, ((Number(freq) - min) / (max - min)) * 100));
  document.querySelector(".needle").style.left = `${pct}%`;
}

function updateTuningVisual() {
  tuningKnob.style.transform = `rotate(${tAngle / 2}deg)`;
}

function loadTrack(index, autoplay = false) {
  if (!playlist.length) return;
  trackIndex = (index + playlist.length) % playlist.length;
  const track = playlist[trackIndex];

  audio.src = track.file;
  audio.load();
  title.textContent = track.title;
  artist.textContent = track.artist;
  document.title = `${track.title} — Kolkata 1995 Radio`;
  const [whole, decimal] = track.freq.split(".");
  freqMain.textContent = whole;
  freqDec.textContent = "." + decimal;
  updateNeedle(track.freq);
  presets.forEach((btn, i) => btn.classList.toggle("active", i === trackIndex));
  seek.value = 0;
  cur.textContent = "0:00";
  dur.textContent = "0:00";

  if (autoplay) {
    audio.play().catch(() => {});
  }
}

play.onclick = async () => {
  try {
    if (audio.paused) await audio.play();
    else audio.pause();
  } catch (e) {
    console.error(e);
  }
};

prev.onclick = () => {
  const wasPlaying = !audio.paused;
  loadTrack(trackIndex - 1, wasPlaying);
};

next.onclick = () => {
  loadTrack(trackIndex + 1, true);
};

audio.onplay = () => {
  play.textContent = "❚❚";
  play.setAttribute("aria-label", "Pause");
  player.classList.add("playing");
};

audio.onpause = () => {
  play.textContent = "▶";
  play.setAttribute("aria-label", "Play");
  player.classList.remove("playing");
};

audio.onloadedmetadata = () => {
  dur.textContent = fmt(audio.duration);
};

audio.ontimeupdate = () => {
  cur.textContent = fmt(audio.currentTime);
  seek.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
};

seek.oninput = () => {
  if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
};

audio.onended = () => loadTrack(trackIndex + 1, true);

volumeKnob.onclick = () => {
  vol = vol > 0.05 ? Math.max(0, vol - 0.1) : 1;
  audio.volume = vol;
  vAngle = -55 + vol * 110;
  volumeKnob.style.setProperty("--angle", `${vAngle}deg`);
  volumeKnob.style.transform = `rotate(${vAngle / 2}deg)`;
};

function getTuningAngle(index) {
  if (playlist.length <= 1) return 0;
  const minAngle = -28;
  const maxAngle = 30;
  return minAngle + ((index / (playlist.length - 1)) * (maxAngle - minAngle));
}

function getIndexFromTuningAngle(angle) {
  if (playlist.length <= 1) return 0;
  const minAngle = -28;
  const maxAngle = 30;
  const pct = Math.max(0, Math.min(1, (angle - minAngle) / (maxAngle - minAngle)));
  return Math.round(pct * (playlist.length - 1));
}

function tuneTo(index) {
  if (!playlist.length) return;
  const wasPlaying = !audio.paused;
  const normalized = ((index % playlist.length) + playlist.length) % playlist.length;
  tAngle = getTuningAngle(normalized);
  updateTuningVisual();
  loadTrack(normalized, wasPlaying);
}

tuningKnob.addEventListener("pointerdown", e => {
  tuningMoved = false;
  tuningStartY = e.clientY;
  tuningStartAngle = tAngle;
  tuningKnob.setPointerCapture?.(e.pointerId);
});

tuningKnob.addEventListener("pointermove", e => {
  if (!tuningKnob.hasPointerCapture?.(e.pointerId)) return;
  const delta = tuningStartY - e.clientY;
  if (Math.abs(delta) < 8) return;
  tuningMoved = true;
  const nextAngle = Math.max(-32, Math.min(32, tuningStartAngle + delta * 0.45));
  tAngle = nextAngle;
  updateTuningVisual();
});

tuningKnob.addEventListener("pointerup", e => {
  tuningKnob.releasePointerCapture?.(e.pointerId);
  if (tuningMoved) {
    tuneTo(getIndexFromTuningAngle(tAngle));
  } else {
    tuneTo(trackIndex + 1);
  }
});

tuningKnob.addEventListener("pointercancel", () => {
  tuningMoved = false;
});

audio.volume = vol;
updateTuningVisual();
loadTrack(0);

// v15 — keyboard controls for desktop listeners
document.addEventListener("keydown", e => {
  if (e.target.matches("input, textarea, button, a")) return;
  if (e.code === "Space") { e.preventDefault(); play.click(); }
  if (e.key === "ArrowRight") next.click();
  if (e.key === "ArrowLeft") prev.click();
  if (/^[0-9]$/.test(e.key)) {
    const i = Number(e.key) - 1;
    if (i >= 0 && presets[i]) presets[i].click();
  }
});

// Station info panel
const brandButton = document.getElementById("brandButton");
const stationOverlay = document.getElementById("stationOverlay");
const stationClose = document.getElementById("stationClose");
function closeStationInfo(){
  stationOverlay.classList.remove("open");
  stationOverlay.setAttribute("aria-hidden","true");
}
function openStationInfo(){
  stationOverlay.classList.add("open");
  stationOverlay.setAttribute("aria-hidden","false");
}
brandButton?.addEventListener("click", openStationInfo);
stationClose?.addEventListener("click", closeStationInfo);
stationOverlay?.addEventListener("click", e => { if(e.target === stationOverlay) closeStationInfo(); });
document.addEventListener("keydown", e => { if(e.key === "Escape") closeStationInfo(); });

// v11 — station menu / archive
const menuButton = document.getElementById("menuButton");
const menuOverlay = document.getElementById("menuOverlay");
const menuClose = document.getElementById("menuClose");
const menuContent = document.getElementById("menuContent");
const navItems = [...document.querySelectorAll(".nav-item")];

function renderMenuSection(section){
  navItems.forEach(btn => btn.classList.toggle("active", btn.dataset.section === section));
  if(section === "radio"){
    menuContent.innerHTML = `<div class="about-copy"><strong>YOU ARE ON AIR.</strong>Choose a preset on the radio, turn the tuning dial, and let the evening play.</div>`;
  } else if(section === "archive"){
    menuContent.innerHTML = `<div class="archive-list">${playlist.map((t,i)=>`<button class="archive-track" data-track="${i}"><em>${String(i + 1).padStart(2, "0")}</em><strong>${t.title}</strong><span>${t.freq} FM</span></button>`).join("")}</div>`;
    menuContent.querySelectorAll(".archive-track").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const wasPlaying = !audio.paused;
        loadTrack(Number(btn.dataset.track), wasPlaying);
        closeMenu();
      });
    });
  } else if(section === "about") {
    menuContent.innerHTML = `<div class="about-copy"><strong>CALCUTTA • 1995</strong>A small digital radio memory of para adda, tram bells, cassette shops and evening streets. This build uses original demo recordings while the station is being developed.</div>`;
  } else if(section === "developer") {
    menuContent.innerHTML = `<div class="developer-card"><strong>DEVELOPED BY</strong><h3>Rasel Islam</h3><a href="mailto:realraselcyber@gmail.com">realraselcyber@gmail.com</a><p>For feedback, collaboration or enquiries about Kolkata 1995 Radio.</p></div>`;
  } else if(section === "share") {
    menuContent.innerHTML = `<div class="share-card"><strong>TAKE THE STATION WITH YOU</strong><p>Share this little corner of Calcutta, 1995 with someone who remembers the sound of an evening radio.</p><button class="share-action" id="shareAction" type="button">SHARE KOLKATA 1995 RADIO</button><span class="share-status" id="shareStatus" aria-live="polite"></span></div>`;
    document.getElementById("shareAction")?.addEventListener("click", async () => {
      const shareData = { title: "Kolkata 1995 Radio", text: "A little digital radio memory of Calcutta, 1995.", url: location.href };
      try {
        if (navigator.share) { await navigator.share(shareData); }
        else { await navigator.clipboard.writeText(location.href); document.getElementById("shareStatus").textContent = "LINK COPIED"; }
      } catch (err) { if (err.name !== "AbortError") document.getElementById("shareStatus").textContent = "COPY THE LINK FROM YOUR BROWSER"; }
    });
  }
}
function closeMenu(){
  menuOverlay.classList.remove("open");
  menuOverlay.setAttribute("aria-hidden","true");
  menuButton?.setAttribute("aria-expanded","false");
}
function openMenu(){
  menuOverlay.classList.add("open");
  menuOverlay.setAttribute("aria-hidden","false");
  menuButton?.setAttribute("aria-expanded","true");
  renderMenuSection("radio");
}
menuButton?.addEventListener("click",openMenu);
menuClose?.addEventListener("click",closeMenu);
menuOverlay?.addEventListener("click",e=>{if(e.target===menuOverlay)closeMenu();});
navItems.forEach(btn=>btn.addEventListener("click",()=>renderMenuSection(btn.dataset.section)));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu();});


// v16 — install prompt, loading polish and share-ready behaviour
const installToast = document.getElementById("installToast");
const installButton = document.getElementById("installButton");
const installDismiss = document.getElementById("installDismiss");
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (!sessionStorage.getItem("kr95-install-dismissed")) installToast?.classList.add("show");
});
installButton?.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installToast?.classList.remove("show");
});
installDismiss?.addEventListener("click", () => {
  sessionStorage.setItem("kr95-install-dismissed", "1");
  installToast?.classList.remove("show");
});
window.addEventListener("appinstalled", () => installToast?.classList.remove("show"));

const loadingScreen = document.getElementById("loadingScreen");
const bgImage = document.querySelector(".bg img");
function finishLoading(){
  loadingScreen?.classList.add("loaded");
  setTimeout(() => loadingScreen?.remove(), 450);
}
if (bgImage?.complete) finishLoading();
else bgImage?.addEventListener("load", finishLoading, { once:true });
setTimeout(finishLoading, 1800);

// Keep media controls in sync with the visual state.
if ("mediaSession" in navigator) {
  const setMedia = () => {
    const track = playlist[trackIndex];
    if (!track) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist, album: "Kolkata 1995 Radio" });
  };
  audio.addEventListener("loadedmetadata", setMedia);
  navigator.mediaSession.setActionHandler?.("play", () => audio.play());
  navigator.mediaSession.setActionHandler?.("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler?.("previoustrack", () => prev.click());
  navigator.mediaSession.setActionHandler?.("nexttrack", () => next.click());
}
