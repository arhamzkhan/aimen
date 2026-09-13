# AIMEN — Agent Handoff Document

This document tells every agent or collaborator exactly what they can and cannot touch.
Read this before modifying any file.

---

## Ownership Map

### 🔒 DO NOT MODIFY (Architectural Files)

These files are owned by the lead architecture agent (Antigravity).
Changes here can break the entire experience.
If you need to change behavior covered by these files, discuss first.

| File | Why Protected |
|------|---------------|
| `js/sceneManager.js` | Scene lifecycle, transition guard, cleanup |
| `js/audioManager.js` | Audio unlock, fade system, named IDs |
| `js/inputManager.js` | Listener tracking, leak prevention |
| `js/transitionManager.js` | Fade overlay, crossfade API |
| `js/state.js` | Global state object + setState() |
| `js/debug.js` | Logging API |
| `js/app.js` | Initialization order |
| `index.html` | Script load order (changing this breaks everything) |
| `css/main.css` | Base variables + reset (all scenes depend on it) |

---

### ✅ Cline — Safe to Modify

Cline can work on individual scene files and their CSS without affecting architecture.

**Scene visuals and interactions:**
- `js/scenes/terminalScene.js` — Terminal typewriter, password behavior
- `js/scenes/butterflyScene.js` — Butterfly movement, organic feel, particle system
- `js/scenes/archiveScene.js` — Photo reveal timing, layout
- `js/scenes/letterScene.js` — Letter unfold, reading experience
- `js/scenes/releaseScene.js` — Release sequence timing, glow phases
- `js/scenes/epilogueScene.js` — Line reveal pacing

**Scene-specific styling:**
- `css/terminal.css`
- `css/butterfly.css`
- `css/archive.css`
- `css/letter.css`
- `css/release.css`
- `css/epilogue.css`

**Components:**
- `js/components/photoFrame.js` — Photo frame visual component

**Rules for Cline:**
1. Never call `SceneManager.goTo()` — use `SceneManager.next()` instead
2. Never create `new Audio()` directly — use `AudioManager.play()`
3. Never add `addEventListener` without using `InputManager.on()` — or clean up in `exit()`
4. Never add configurable values (text, timing, paths) to scene files — add to `config.js`
5. Never add `setTimeout` without storing the id so it can be cleared in `exit()`

---

### ✅ Claude / ChatGPT — Safe to Assist With

- Narrative review (CONFIG.NARRATION values)
- Scene pacing suggestions (CONFIG.TIMING values)
- Bug diagnosis (read-only analysis, then suggest targeted file edits)
- Code review of individual scene files
- Asset integration instructions
- CSS polish for individual scenes

**Claude/ChatGPT should NOT:**
- Rewrite `sceneManager.js`, `audioManager.js`, `inputManager.js`
- Rewrite `app.js` or `index.html` script order
- Invent letter content, photographs, or personal history

---

## Configuration Protocol

**All content and configuration changes go into `js/config.js` only.**

| What you want to change | Where |
|------------------------|-------|
| Password | `CONFIG.TERMINAL_PASSWORD` |
| Terminal text | `CONFIG.TERMINAL.*` |
| Narration lines | `CONFIG.NARRATION.*` |
| Letter content | `CONFIG.LETTER_CONTENT` |
| Archive photos | `CONFIG.ARCHIVE_PHOTOS` |
| Audio filenames | `CONFIG.AUDIO.*` |
| Timing | `CONFIG.TIMING.*` |
| Asset paths | `CONFIG.ASSETS.*` |

---

## Asset Integration Protocol

When a new asset arrives (photo, audio, butterfly animation):

1. Place file in the correct `assets/` subfolder
2. Update the relevant path in `js/config.js`
3. Do NOT change scene files unless the asset type itself changes (e.g., switching from img to video)

---

## Debug Protocol

Before filing a bug or asking for a fix, always:

1. Open browser console
2. Run `__AIMEN_STATE()` — check AppState
3. Use `__AIMEN_JUMP("sceneName")` to isolate the problem scene
4. Note which file the error originates in
5. Report: scene name + file + behavior + console output

---

## Scene API Contract

Every scene must expose exactly this interface:

```javascript
var MyScene = (function() {

    function enter() {
        // 1. Get DOM refs
        // 2. Reset state
        // 3. Show container
        // 4. Start sequence
    }

    function exit(done) {
        // 1. Clear all timers
        // 2. Hide container
        // 3. Call done() — REQUIRED
    }

    return {
        name:  "scenename",  // must match CONFIG.SCENE_ORDER entry
        enter: enter,
        exit:  exit,
        // update: update,  // optional — only if rAF loop needed
    };

})();
```

**If `done()` is never called from `exit()`, the experience will freeze.**

---

## Audio Integration Protocol

When audio assets are ready:

1. Place files in `assets/audio/`
2. Update `CONFIG.AUDIO` map:
   ```javascript
   keystroke: "assets/audio/keystroke.mp3",
   ```
3. AudioManager will pick them up automatically
4. Missing files fail silently — the experience continues

Narrator audio for Release scene:
- File: `assets/audio/narrator_release.mp3`
- Content: Female voice saying "It's finally free."
- Synced in `releaseScene.js` at the `narratorRelease` audio play call

---

## Known Current State

### What Works (Skeleton)
- ✅ Full scene flow: BOOT → TERMINAL → BUTTERFLY → ARCHIVE → LETTER → RELEASE → EPILOGUE
- ✅ Password authentication with retry
- ✅ Typewriter terminal output
- ✅ Organic butterfly movement
- ✅ Archive photo frame system (placeholder images)
- ✅ Letter unfold animation with paper styling
- ✅ Automatic release sequence with glow phases
- ✅ Epilogue line-by-line reveal with "Not yet." echo
- ✅ Scene jump debug commands
- ✅ Audio manager (plays when assets present)
- ✅ Transition fades

### Placeholder / Not Final
- ⬜ Butterfly: CSS/SVG placeholder → replace with real asset
- ⬜ Archive photos: grey frames → drop in real webp files
- ⬜ Letter content: PLACEHOLDER text → provide real letter
- ⬜ Audio: all silent → drop in audio files
- ⬜ Fonts: falling back to Georgia → provide handwriting.woff2
- ⬜ Narrator audio: silent → provide narrator_release.mp3
- ⬜ Letter texture: flat gradient → provide parchment texture image
- ⬜ Particle system: minimal → can be enhanced in butterfly/release CSS
- ⬜ Chain: CSS line → replace with SVG necklace asset

### Next Priorities (Suggested Order)
1. Add handwriting font (`assets/fonts/handwriting.woff2`)
2. Add letter content (`CONFIG.LETTER_CONTENT`)
3. Add real photos (`assets/images/` + `CONFIG.ARCHIVE_PHOTOS`)
4. Add audio files (`assets/audio/`)
5. Add butterfly asset
6. Visual polish per scene (safe for Cline)
7. Narrator audio sync
8. Final end-to-end test on target hardware
