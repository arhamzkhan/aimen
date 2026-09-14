/**
 * AIMEN Experience — Global Configuration
 * =========================================
 * This is the single source of truth for all configurable values.
 * Modify this file to change passwords, text, audio filenames,
 * scene order, and debug settings.
 *
 * DO NOT scatter configurable values across scene files.
 */

const CONFIG = {

    // ── Debug ─────────────────────────────────────────────────────────────
    DEBUG: true,          // Set to FALSE before final delivery
    SCENE_JUMP: true,     // Allow ?scene=X URL param jumps (debug only)

    // ── Password ──────────────────────────────────────────────────────────
    // Change this value ONLY. Do not modify terminalScene.js for password changes.
    TERMINAL_PASSWORD: "Not Yet",

    // ── Scene Order ───────────────────────────────────────────────────────
    // Controls the linear progression. Reorder to rearrange the experience.
    // NOTE: "letter" scene removed — the Dear Aimen letter now lives inside
    //       archive (Scene 2) as its final phase. archive → release directly.
    SCENE_ORDER: [
        "boot",
        "terminal",
        "butterfly",
        "archive",
        "release",
        "epilogue"
    ],

    // ── Timing (ms) ───────────────────────────────────────────────────────
    TIMING: {
        BOOT_DURATION:          0,       // Instant transition to terminal
        TERMINAL_LINE_DELAY:    40,      // ms per character typewriter effect
        TERMINAL_STEP_DELAY:    500,     // ms between output steps
        TRANSITION_FADE:        600,     // default fade duration
        BUTTERFLY_APPROACH:     7500,    // ms before butterfly reaches button
        ARCHIVE_PHOTO_INTERVAL: 4000,    // ms between photo reveals
        LETTER_OPEN_DELAY:      1000,    // ms before letter unfolds
        RELEASE_AUTO_TRIGGER:   1200,    // ms after scene enter before release starts
        EPILOGUE_LINE_DELAY:    2200,    // ms between epilogue lines
    },

    // ── Narration Text ────────────────────────────────────────────────────
    // Modify text here; do not edit inside scene files.
    NARRATION: {
        ARCHIVE_EMPTY:   "There isn't much here.\nAt least, not anymore.",
        ARCHIVE_OUTRO_1: "I tried to find everything...",
        ARCHIVE_OUTRO_2: "Turns out, I didn't need to.",
        ARCHIVE_OUTRO_3: "The best parts were never saved anywhere.",
        LETTER_INTRO:    "Some things are meant to be read slowly.",
        RELEASE_FINAL:   "It's finally free.",
        EPILOGUE: [
            "It's your day.",
            "So I wanted to leave you something.",
            "Something you could keep.",
            "Happy Birthday, Aimen.",
        ],
        EPILOGUE_CODA: [
            "ARCHIVE COMPLETE.",
            "Thank you, Aimen.",
            "There is nothing else here.",
            "Not yet."
        ]
    },

    // ── Terminal Lines ────────────────────────────────────────────────────
    TERMINAL: {
        PROMPT_LABEL:  "ENTER PASSWORD:",
        COMMAND_LINE:  "aimen@archive ~ % establish_session",
        AUTH_TEXT:     "[SYSTEM AUTHENTICATION REQUIRED]",
        GRANTED_TEXT:  "ACCESS GRANTED",
        DENIED_TEXT:   "ACCESS DENIED — INCORRECT PASSWORD",
        INIT_LINES: [
            "aimen@archive ~ % establish_session --secure",
            "[SYS] Initializing core environment...",
            "[SYS] Mounting Virtual Archive [/dev/disk2s1]...",
            "[SYS] Security protocols loaded."
        ],
        BLACK_SEQUENCE: [
            "Getting things ready for you...",
            "Preparing your environment...",
            "Loading core systems...",
            "Establishing secure connection...",
            "Initializing Aimen...",
            "Almost there..."
        ]
    },

    // ── Archive Scene Letter ──────────────────────────────────────────────
    // The final letter shown at the end of Scene 2, before [ NEXT ] to Scene 3.
    ARCHIVE_LETTER: [
        "Dear Aimen,",
        "",
        "Some things are difficult to put into words,",
        "so I decided to let this little journey say them for me.",
        "",
        "If you're reading this, you made it this far.",
        "And honestly, that's exactly where I wanted you to be.",
        "",
        "There's still more waiting for you.",
        "",
        "— A"
    ],

    // ── Letter ────────────────────────────────────────────────────────────
    // Replace PLACEHOLDER with the real letter text when ready.
    // Supports \n for line breaks.
    LETTER_CONTENT: `PLACEHOLDER

This letter has not been written yet.
It will be provided separately and dropped into this config.

— `,

    // ── Archive Photos ────────────────────────────────────────────────────
    // Each entry: { src: "assets/images/filename.webp", caption: "..." }
    // Replace with real photo filenames when assets are ready.
    ARCHIVE_PHOTOS: [
        { src: "assets/images/PLACEHOLDER_photo1.webp", caption: "" },
        { src: "assets/images/PLACEHOLDER_photo2.webp", caption: "" },
        { src: "assets/images/PLACEHOLDER_photo3.webp", caption: "" },
    ],

    // ── Audio Files ───────────────────────────────────────────────────────
    // Named identifiers → relative file paths.
    // Replace paths when audio assets are ready.
    // If a file is missing, AudioManager will skip gracefully.
    AUDIO: {
        keystroke:      "assets/audio/keystroke.mp3",
        accessGranted:  "assets/audio/access_granted.mp3",
        ambientNight:   "assets/audio/ambient_night.mp3",
        wingBeat:       "assets/audio/wing_beat.mp3",
        chainTension:   "assets/audio/chain_tension.mp3",
        bassPulse:      "assets/audio/bass_pulse.mp3",
        chainRelease:   "assets/audio/chain_release.mp3",
        wingWhoosh:     "assets/audio/wing_whoosh.mp3",
        etherealSwell:  "assets/audio/ethereal_swell.mp3",
        paperRustle:    "assets/audio/paper_rustle.mp3",
        paperTurn:      "assets/audio/paper_turn.mp3",
        narratorRelease:"assets/audio/narrator_release.mp3",
    },

    // ── Asset Paths ───────────────────────────────────────────────────────
    ASSETS: {
        butterfly:      "assets/images/PLACEHOLDER_butterfly.webp",
        letterTexture:  "assets/images/PLACEHOLDER_letter_bg.webp",
        archiveBg:      "assets/images/PLACEHOLDER_archive_bg.webp",
    }
};

// Freeze to prevent accidental mutation from scene code
Object.freeze(CONFIG);
Object.freeze(CONFIG.TIMING);
Object.freeze(CONFIG.NARRATION);
Object.freeze(CONFIG.TERMINAL);
Object.freeze(CONFIG.AUDIO);
Object.freeze(CONFIG.ASSETS);
