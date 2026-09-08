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

const presets = [
  ...document.querySelectorAll(".preset:not(.disabled)")
];

const playlist =
  window.KR95_STATION?.tracks || [];

let trackIndex = 0;

let vol = 0.8;

let vAngle = 35;

let tAngle = -28;

let tuningMoved = false;
let tuningStartY = 0;
let tuningStartAngle = tAngle;


/* -------------------------
   TIME FORMAT
------------------------- */

function fmt(seconds) {

  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);

  const secs = String(
    Math.floor(seconds % 60)
  ).padStart(2, "0");

  return `${minutes}:${secs}`;
}


/* -------------------------
   FREQUENCY NEEDLE
------------------------- */

function updateNeedle(freq) {

  const min = 88;
  const max = 108;

  const pct = Math.max(
    0,
    Math.min(
      100,
      ((Number(freq) - min) / (max - min)) * 100
    )
  );

  const needle =
    document.querySelector(".needle");

  if (needle) {
    needle.style.left = `${pct}%`;
  }
}


/* -------------------------
   TUNING VISUAL
------------------------- */

function updateTuningVisual() {

  if (!tuningKnob) return;

  tuningKnob.style.transform =
    `rotate(${tAngle / 2}deg)`;
}


/* -------------------------
   UPDATE PRESETS
------------------------- */

function updatePresets() {

  presets.forEach((button, index) => {

    button.classList.toggle(
      "active",
      index === trackIndex
    );

  });
}


/* -------------------------
   LOAD TRACK
------------------------- */

function loadTrack(
  index,
  autoplay = false
) {

  if (!playlist.length) {
    console.warn(
      "Kolkata 1995 Radio: No tracks found."
    );
    return;
  }


  trackIndex =
    (index + playlist.length) %
    playlist.length;


  const track =
    playlist[trackIndex];


  /* AUDIO */

  audio.src = track.file;

  audio.load();


  /* DISPLAY */

  title.textContent =
    track.title || "Unknown Track";

  artist.textContent =
    track.artist || "Unknown Artist";


  /* PAGE TITLE */

  document.title =
    `${track.title} — Kolkata 1995 Radio`;


  /* FREQUENCY */

  const frequency =
    String(track.freq || "98.5");


  const parts =
    frequency.split(".");


  freqMain.textContent =
    parts[0] || "98";


  freqDec.textContent =
    "." + (parts[1] || "5");


  updateNeedle(frequency);


  /* PRESETS */

  updatePresets();


  /* PROGRESS */

  seek.value = 0;

  cur.textContent = "0:00";

  dur.textContent = "0:00";


  /* PLAY */

  if (autoplay) {

    audio.play().catch(error => {
      console.warn(
        "Autoplay was blocked:",
        error
      );
    });

  }

}


/* -------------------------
   PLAY / PAUSE
------------------------- */

play.onclick = async () => {

  try {

    if (audio.paused) {

      await audio.play();

    } else {

      audio.pause();

    }

  } catch (error) {

    console.error(
      "Playback error:",
      error
    );

  }

};


/* -------------------------
   PREVIOUS
------------------------- */

prev.onclick = () => {

  const wasPlaying =
    !audio.paused;

  loadTrack(
    trackIndex - 1,
    wasPlaying
  );

};


/* -------------------------
   NEXT
------------------------- */

next.onclick = () => {

  loadTrack(
    trackIndex + 1,
    true
  );

};


/* -------------------------
   PLAY EVENT
------------------------- */

audio.onplay = () => {

  play.textContent = "❚❚";

  play.setAttribute(
    "aria-label",
    "Pause"
  );

  player.classList.add(
    "playing"
  );

};


/* -------------------------
   PAUSE EVENT
------------------------- */

audio.onpause = () => {

  play.textContent = "▶";

  play.setAttribute(
    "aria-label",
    "Play"
  );

  player.classList.remove(
    "playing"
  );

};


/* -------------------------
   LOADED METADATA
------------------------- */

audio.onloadedmetadata = () => {

  dur.textContent =
    fmt(audio.duration);

};


/* -------------------------
   TIME UPDATE
------------------------- */

audio.ontimeupdate = () => {

  cur.textContent =
    fmt(audio.currentTime);


  seek.value =
    audio.duration
      ? (audio.currentTime /
          audio.duration) * 100
      : 0;

};


/* -------------------------
   SEEK
------------------------- */

seek.oninput = () => {

  if (!audio.duration) return;

  audio.currentTime =
    (seek.value / 100) *
    audio.duration;

};


/* -------------------------
   AUTO NEXT
------------------------- */

audio.onended = () => {

  loadTrack(
    trackIndex + 1,
    true
  );

};


/* -------------------------
   VOLUME
------------------------- */

volumeKnob.onclick = () => {

  vol =
    vol > 0.05
      ? Math.max(
          0,
          vol - 0.1
        )
      : 1;


  audio.volume = vol;


  vAngle =
    -55 + vol * 110;


  volumeKnob.style.setProperty(
    "--angle",
    `${vAngle}deg`
  );


  volumeKnob.style.transform =
    `rotate(${vAngle / 2}deg)`;

};


/* -------------------------
   TUNING
------------------------- */

function getTuningAngle(index) {

  const total =
    playlist.length;

  if (total <= 1) {
    return 0;
  }


  /*
    Spread stations across
    the tuning dial automatically.
  */

  const minAngle = -30;
  const maxAngle = 30;


  return (
    minAngle +
    (
      (index /
        (total - 1))
      *
      (maxAngle - minAngle)
    )
  );

}


function tuneTo(index) {

  const safeIndex =
    (
      (index % playlist.length)
      + playlist.length
    )
    % playlist.length;


  const wasPlaying =
    !audio.paused;


  tAngle =
    getTuningAngle(
      safeIndex
    );


  updateTuningVisual();


  loadTrack(
    safeIndex,
    wasPlaying
  );

}


/* -------------------------
   TUNING POINTER DOWN
------------------------- */

tuningKnob.addEventListener(
  "pointerdown",
  event => {

    tuningMoved = false;

    tuningStartY =
      event.clientY;

    tuningStartAngle =
      tAngle;


    tuningKnob.setPointerCapture?.(
      event.pointerId
    );

  }
);


/* -------------------------
   TUNING POINTER MOVE
------------------------- */

tuningKnob.addEventListener(
  "pointermove",
  event => {

    if (
      !tuningKnob.hasPointerCapture?.(
        event.pointerId
      )
    ) {
      return;
    }


    const delta =
      tuningStartY -
      event.clientY;


    if (
      Math.abs(delta) < 8
    ) {
      return;
    }


    tuningMoved = true;


    const nextAngle =
      Math.max(
        -32,
        Math.min(
          32,
          tuningStartAngle +
          delta * 0.45
        )
      );


    tAngle =
      nextAngle;


    updateTuningVisual();

  }
);


/* -------------------------
   TUNING POINTER UP
------------------------- */

tuningKnob.addEventListener(
  "pointerup",
  event => {

    tuningKnob.releasePointerCapture?.(
      event.pointerId
    );


    if (tuningMoved) {

      /*
        Convert dial position
        to nearest track.
      */

      const total =
        playlist.length;


      let nearestIndex = 0;

      let nearestDistance =
        Infinity;


      for (
        let i = 0;
        i < total;
        i++
      ) {

        const angle =
          getTuningAngle(i);


        const distance =
          Math.abs(
            angle - tAngle
          );


        if (
          distance <
          nearestDistance
        ) {

          nearestDistance =
            distance;

          nearestIndex =
            i;

        }

      }


      tuneTo(
        nearestIndex
      );

    } else {

      /*
        Simple click =
        next station.
      */

      tuneTo(
        trackIndex + 1
      );

    }

  }
);


tuningKnob.addEventListener(
  "pointercancel",
  () => {

    tuningMoved = false;

  }
);


/* -------------------------
   PRESET BUTTONS
------------------------- */

presets.forEach(
  button => {

    button.onclick = () => {

      const wasPlaying =
        !audio.paused;


      const index =
        Number(
          button.dataset.track
        );


      loadTrack(
        index,
        wasPlaying
      );

    };

  }
);


/* -------------------------
   KEYBOARD CONTROLS
------------------------- */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.target.matches(
        "input, textarea, button, a"
      )
    ) {
      return;
    }


    if (
      event.code === "Space"
    ) {

      event.preventDefault();

      play.click();

    }


    if (
      event.key === "ArrowRight"
    ) {

      next.click();

    }


    if (
      event.key === "ArrowLeft"
    ) {

      prev.click();

    }


    /*
      Keyboard 1–6
    */

    if (
      /^[1-6]$/.test(
        event.key
      )
    ) {

      const index =
        Number(event.key) - 1;


      if (presets[index]) {

        presets[index].click();

      }

    }

  }
);


/* -------------------------
   STATION INFO
------------------------- */

const brandButton =
  document.getElementById(
    "brandButton"
  );

const stationOverlay =
  document.getElementById(
    "stationOverlay"
  );

const stationClose =
  document.getElementById(
    "stationClose"
  );


function closeStationInfo() {

  stationOverlay.classList.remove(
    "open"
  );

  stationOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

}


function openStationInfo() {

  stationOverlay.classList.add(
    "open"
  );

  stationOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

}


brandButton?.addEventListener(
  "click",
  openStationInfo
);


stationClose?.addEventListener(
  "click",
  closeStationInfo
);


stationOverlay?.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      stationOverlay
    ) {

      closeStationInfo();

    }

  }
);


/* -------------------------
   MENU / ARCHIVE
------------------------- */

const menuButton =
  document.getElementById(
    "menuButton"
  );

const menuOverlay =
  document.getElementById(
    "menuOverlay"
  );

const menuClose =
  document.getElementById(
    "menuClose"
  );

const menuContent =
  document.getElementById(
    "menuContent"
  );

const navItems = [
  ...document.querySelectorAll(
    ".nav-item"
  )
];


function renderMenuSection(
  section
) {

  navItems.forEach(
    button => {

      button.classList.toggle(
        "active",
        button.dataset.section ===
        section
      );

    }
  );


  /* RADIO */

  if (
    section === "radio"
  ) {

    menuContent.innerHTML = `
      <div class="about-copy">
        <strong>YOU ARE ON AIR.</strong>
        Choose a preset on the radio,
        turn the tuning dial,
        and let the evening play.
      </div>
    `;

  }


  /* ARCHIVE */

  else if (
    section === "archive"
  ) {

    menuContent.innerHTML = `
      <div class="archive-list">

        ${playlist.map(
          (track, index) => `
            <button
              class="archive-track"
              data-track="${index}"
              type="button"
            >

              <em>
                ${String(index + 1).padStart(2, "0")}
              </em>

              <strong>
                ${track.title}
              </strong>

              <span>
                ${track.freq} FM
              </span>

            </button>
          `
        ).join("")}

      </div>
    `;


    menuContent
      .querySelectorAll(
        ".archive-track"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const wasPlaying =
                !audio.paused;


              loadTrack(
                Number(
                  button.dataset.track
                ),
                wasPlaying
              );


              closeMenu();

            }
          );

        }
      );

  }


  /* ABOUT */

  else if (
    section === "about"
  ) {

    menuContent.innerHTML = `
      <div class="about-copy">

        <strong>
          CALCUTTA • 1995
        </strong>

        A small digital radio memory
        of para adda, tram bells,
        cassette shops and evening streets.

        This station is being developed
        as a nostalgic digital radio
        experience.

      </div>
    `;

  }


  /* DEVELOPER */

  else if (
    section === "developer"
  ) {

    menuContent.innerHTML = `
      <div class="developer-card">

        <strong>
          DEVELOPED BY
        </strong>

        <h3>
          Rasel Islam
        </h3>

        <a href="mailto:realraselcyber@gmail.com">
          realraselcyber@gmail.com
        </a>

        <p>
          For feedback, collaboration
          or enquiries about
          Kolkata 1995 Radio.
        </p>

      </div>
    `;

  }


  /* SHARE */

  else if (
    section === "share"
  ) {

    menuContent.innerHTML = `
      <div class="share-card">

        <strong>
          TAKE THE STATION WITH YOU
        </strong>

        <p>
          Share this little corner
          of Calcutta, 1995 with
          someone who remembers the
          sound of an evening radio.
        </p>

        <button
          class="share-action"
          id="shareAction"
          type="button"
        >
          SHARE KOLKATA 1995 RADIO
        </button>

        <span
          class="share-status"
          id="shareStatus"
          aria-live="polite"
        ></span>

      </div>
    `;


    document
      .getElementById(
        "shareAction"
      )
      ?.addEventListener(
        "click",
        async () => {

          const shareData = {

            title:
              "Kolkata 1995 Radio",

            text:
              "A little digital radio memory of Calcutta, 1995.",

            url:
              location.href

          };


          try {

            if (
              navigator.share
            ) {

              await navigator.share(
                shareData
              );

            }

            else {

              await navigator.clipboard.writeText(
                location.href
              );

              document.getElementById(
                "shareStatus"
              ).textContent =
                "LINK COPIED";

            }

          }

          catch (error) {

            if (
              error.name !==
              "AbortError"
            ) {

              document.getElementById(
                "shareStatus"
              ).textContent =
                "COPY THE LINK FROM YOUR BROWSER";

            }

          }

        }
      );

  }

}


/* -------------------------
   MENU OPEN / CLOSE
------------------------- */

function closeMenu() {

  menuOverlay.classList.remove(
    "open"
  );

  menuOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

  menuButton?.setAttribute(
    "aria-expanded",
    "false"
  );

}


function openMenu() {

  menuOverlay.classList.add(
    "open"
  );

  menuOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  menuButton?.setAttribute(
    "aria-expanded",
    "true"
  );


  renderMenuSection(
    "radio"
  );

}


menuButton?.addEventListener(
  "click",
  openMenu
);


menuClose?.addEventListener(
  "click",
  closeMenu
);


menuOverlay?.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      menuOverlay
    ) {

      closeMenu();

    }

  }
);


navItems.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        renderMenuSection(
          button.dataset.section
        );

      }
    );

  }
);


/* -------------------------
   ESCAPE
------------------------- */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeMenu();
      closeStationInfo();

    }

  }
);


/* -------------------------
   INSTALL PROMPT
------------------------- */

const installToast =
  document.getElementById(
    "installToast"
  );

const installButton =
  document.getElementById(
    "installButton"
  );

const installDismiss =
  document.getElementById(
    "installDismiss"
  );


let deferredInstallPrompt =
  null;


window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    deferredInstallPrompt =
      event;


    if (
      !sessionStorage.getItem(
        "kr95-install-dismissed"
      )
    ) {

      installToast?.classList.add(
        "show"
      );

    }

  }
);


installButton?.addEventListener(
  "click",
  async () => {

    if (
      !deferredInstallPrompt
    ) {
      return;
    }


    deferredInstallPrompt.prompt();


    await deferredInstallPrompt.userChoice;


    deferredInstallPrompt =
      null;


    installToast?.classList.remove(
      "show"
    );

  }
);


installDismiss?.addEventListener(
  "click",
  () => {

    sessionStorage.setItem(
      "kr95-install-dismissed",
      "1"
    );


    installToast?.classList.remove(
      "show"
    );

  }
);


window.addEventListener(
  "appinstalled",
  () => {

    installToast?.classList.remove(
      "show"
    );

  }
);


/* -------------------------
   LOADING SCREEN
------------------------- */

const loadingScreen =
  document.getElementById(
    "loadingScreen"
  );

const bgImage =
  document.querySelector(
    ".bg img"
  );


function finishLoading() {

  loadingScreen?.classList.add(
    "loaded"
  );


  setTimeout(
    () => {

      loadingScreen?.remove();

    },
    450
  );

}


if (
  bgImage?.complete
) {

  finishLoading();

}

else {

  bgImage?.addEventListener(
    "load",
    finishLoading,
    {
      once: true
    }
  );

}


setTimeout(
  finishLoading,
  1800
);


/* -------------------------
   MEDIA SESSION
------------------------- */

if (
  "mediaSession" in navigator
) {

  const setMedia =
    () => {

      const track =
        playlist[trackIndex];


      if (!track) {
        return;
      }


      navigator.mediaSession.metadata =
        new MediaMetadata({

          title:
            track.title,

          artist:
            track.artist,

          album:
            "Kolkata 1995 Radio"

        });

    };


  audio.addEventListener(
    "loadedmetadata",
    setMedia
  );


  navigator.mediaSession
    .setActionHandler?.(
      "play",
      () => audio.play()
    );


  navigator.mediaSession
    .setActionHandler?.(
      "pause",
      () => audio.pause()
    );


  navigator.mediaSession
    .setActionHandler?.(
      "previoustrack",
      () => prev.click()
    );


  navigator.mediaSession
    .setActionHandler?.(
      "nexttrack",
      () => next.click()
    );

}


/* -------------------------
   INITIALIZE
------------------------- */

audio.volume = vol;

updateTuningVisual();

loadTrack(0);