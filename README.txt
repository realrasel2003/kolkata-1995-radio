KOLKATA 1995 RADIO — v16

Final website build before real music licensing/content replacement.

Open index.html with VS Code Live Server for local testing.

Main files:
- index.html — page structure
- style.css — visual design + responsive layout
- script.js — radio controls, menu, install/share behaviour
- station-data.js — playlist/station catalogue
- sw.js + manifest.webmanifest — PWA/offline support
- assets/ — desktop/mobile artwork + icons
- music/ — original demo recordings

When licensed Bengali recordings are ready, update station-data.js and the audio files only.

SONG ADDITION WORKFLOW
======================
1. Put the audio file in songs/
2. Add one track object in station-data.js with title, artist, file and freq.
3. git add .
4. git commit -m "Add new track"
5. git push

Do not edit index.html, script.js or sw.js for ordinary song additions.
