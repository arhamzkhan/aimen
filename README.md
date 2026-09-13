# AIMEN — Offline Interactive Birthday Experience

## How to Run

1. Copy the entire `aimen-experience/` folder to an SD card or local drive.
2. Open `index.html` directly in a browser (Chrome or Edge recommended).
3. No installation, no server, no internet required.

```
E:\AIMEN\aimen-experience\index.html   ← double-click or drag to browser
```

---

## Project Structure

```
aimen-experience/
│
├── index.html              ← Entry point. Structure only. No logic here.
├── README.md               ← This file
├── HANDOFF.md              ← Agent/collaborator handoff documentation
│
├── assets/
│   ├── images/             ← Butterfly, archive bg, letter texture, photos
│   ├── video/              ← Pre-rendered video assets (future)
│   ├── audio/              ← Sound effects + narrator audio
│   ├── fonts/              ← Local handwriting font (woff2/woff)
│   └── ui/                 ← Any UI icons or overlays
│
├── css/
│   ├── main.css            ← Global variables, resets, scene base styles
│   ├── terminal.css        ← Terminal scene only
│   ├── butterfly.css       ← Butterfly scene only
│   ├── archive.css         ← Archive scene + PhotoFrame component
│   ├── letter.css          ← Letter scene only
│   ├── release.css         ← Release scene only
│   └── epilogue.css        ← Epilogue scene only
│
└── js/
    ├── config.js           ← ALL configurable values live here
    ├── state.js            ← Global AppState
    ├── debug.js            ← Debug logging and scene jump helpers
    ├── audioManager.js     ← Audio system
    ├── inputManager.js     ← Event listener tracking
    ├── transitionManager.js← Fade transitions
    ├── sceneManager.js     ← Scene lifecycle controller
    ├── app.js              ← Entry point — wires everything
    │
    ├── scenes/
    │   ├── bootScene.js
    │   ├── terminalScene.js
    │   ├── butterflyScene.js
    │   ├── archiveScene.js
    │   ├── letterScene.js
    │   ├── releaseScene.js
    │   └── epilogueScene.js
    │
    └── components/
        └── photoFrame.js
```

---

## Scene Flow

```
BOOT → TERMINAL → BUTTERFLY → ARCHIVE → LETTER → RELEASE → EPILOGUE
```

Each scene:
- Enters via `enter()`
- Cleans up via `exit(done)` — done() must be called to unblock transitions
- Reads all content from `js/config.js`

---

## Debug Mode

In `js/config.js`, set `DEBUG: true` (already on during development).

### Scene Jump (URL param)
```
index.html?scene=terminal
index.html?scene=butterfly
index.html?scene=archive
index.html?scene=letter
index.html?scene=release
index.html?scene=epilogue
```

### Browser Console Commands
```javascript
__AIMEN_JUMP("butterfly")   // jump to any scene
__AIMEN_STATE()             // print current AppState table
__AIMEN_SCENES()            // list all registered scenes
```

> **Note:** If `?scene=` doesn't work under `file://` in your browser, use `__AIMEN_JUMP()` from the console instead.

---

## Asset Locations

| Asset | Location | Notes |
|-------|----------|-------|
| Butterfly image/video | `assets/images/` | Update `CONFIG.ASSETS.butterfly` |
| Letter texture | `assets/images/` | Update `CONFIG.ASSETS.letterTexture` |
| Archive background | `assets/images/` | Update `CONFIG.ASSETS.archiveBg` |
| Archive photos | `assets/images/` | Update `CONFIG.ARCHIVE_PHOTOS` array |
| Handwriting font | `assets/fonts/` | Files: `handwriting.woff2`, `handwriting.woff` |
| All audio | `assets/audio/` | Update `CONFIG.AUDIO` map |

---

## Changing the Password

Open `js/config.js`. Change line:

```javascript
TERMINAL_PASSWORD: "Not Yet",
```

That's it. Do not search/replace through scene files.

---

## Changing Letter Content

Open `js/config.js`. Replace:

```javascript
LETTER_CONTENT: `PLACEHOLDER...`,
```

with the real letter text. Newlines (`\n`) create new paragraphs.

---

## Adding/Replacing Photos

Open `js/config.js`. Edit `ARCHIVE_PHOTOS`:

```javascript
ARCHIVE_PHOTOS: [
    { src: "assets/images/photo1.webp", caption: "" },
    { src: "assets/images/photo2.webp", caption: "" },
],
```

Then place the image files in `assets/images/`. The archive scene reads this automatically.

---

## Replacing Placeholder Butterfly

In `index.html`, find `#butterfly-element` and replace the `<svg>` child with:

```html
<img src="assets/images/butterfly.webp" alt="">
```

or:

```html
<video autoplay loop muted playsinline>
    <source src="assets/video/butterfly.webm" type="video/webm">
</video>
```

Then update `CONFIG.ASSETS.butterfly` to point to the new file.
The movement system in `butterflyScene.js` drives the `transform` on the parent element — it will work with any child asset.

---

## Browser Compatibility

- **Chrome 90+** ✓ (recommended)
- **Edge 90+** ✓
- **Firefox 88+** ✓ (some audio autoplay restrictions may vary)
- **Safari** — test separately; `file://` + audio policies vary
- **Mobile** — not primary target, but responsive layout considered

---

## Performance Notes

- All transitions use CSS `opacity` + `transform` (GPU-accelerated)
- No heavy 3D, no WebGL
- Particle count intentionally minimal
- Audio files should be MP3, compressed, < 2MB each where possible
- Photos should be WebP, max 800×800px for archive frames
