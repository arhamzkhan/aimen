/**
 * AIMEN Experience — Audio Manager
 * ==================================
 * Central audio system. All audio interaction goes through here.
 * Scenes must NOT create their own Audio objects directly.
 *
 * Features:
 *   - Named sound identifiers (mapped in CONFIG.AUDIO)
 *   - Graceful fallback if assets are missing
 *   - Volume control per sound
 *   - Fade in / fade out
 *   - Loop support
 *   - Cleanup on scene exit
 *
 * Usage:
 *   AudioManager.play("keystroke");
 *   AudioManager.playLoop("ambientNight", 0.4);
 *   AudioManager.stop("ambientNight");
 *   AudioManager.fadeOut("ambientNight", 1000);
 *   AudioManager.stopAll();
 */

var AudioManager = (function() {

    // Internal registry: { id: HTMLAudioElement }
    var _sounds = {};
    // Active fade intervals: { id: intervalId }
    var _fades  = {};

    /**
     * Pre-load an audio element for a named sound.
     * Called lazily on first play; can also be called explicitly to pre-warm.
     */
    function _load(soundId) {
        if (_sounds[soundId]) return _sounds[soundId];

        var path = CONFIG.AUDIO[soundId];
        if (!path) {
            debugWarn("AUDIO", "No path configured for: " + soundId);
            return null;
        }

        try {
            var audio       = new Audio();
            audio.src       = path;
            audio.preload   = "auto";
            _sounds[soundId] = audio;
            debugLog("AUDIO", "Loaded: " + soundId + " ← " + path);
            return audio;
        } catch(e) {
            debugError("AUDIO", "Failed to create Audio for: " + soundId + " — " + e.message);
            return null;
        }
    }

    /**
     * Play a sound by named ID.
     * @param {string} soundId
     * @param {number} [volume=1.0]
     * @param {Function} [onEnd] — optional callback when sound finishes
     */
    function play(soundId, volume, onEnd) {
        if (!AppState.audioUnlocked) {
            debugWarn("AUDIO", "AudioContext not yet unlocked. Skipping: " + soundId);
            return;
        }

        var audio = _load(soundId);
        if (!audio) return;

        // Cancel any in-progress fade
        _clearFade(soundId);

        audio.loop   = false;
        audio.volume = (volume !== undefined) ? Math.max(0, Math.min(1, volume)) : 1.0;
        audio.currentTime = 0;

        var playPromise = audio.play();
        if (playPromise && playPromise.catch) {
            playPromise.catch(function(e) {
                debugWarn("AUDIO", "Play failed for: " + soundId + " — " + e.message);
            });
        }

        if (typeof onEnd === "function") {
            audio.onended = onEnd;
        }

        debugLog("AUDIO", "Playing: " + soundId);
    }

    /**
     * Play a sound in a loop.
     */
    function playLoop(soundId, volume) {
        if (!AppState.audioUnlocked) {
            debugWarn("AUDIO", "AudioContext not yet unlocked. Skipping loop: " + soundId);
            return;
        }

        var audio = _load(soundId);
        if (!audio) return;

        _clearFade(soundId);

        audio.loop        = true;
        audio.volume      = (volume !== undefined) ? Math.max(0, Math.min(1, volume)) : 0.5;
        audio.currentTime = 0;

        var playPromise = audio.play();
        if (playPromise && playPromise.catch) {
            playPromise.catch(function(e) {
                debugWarn("AUDIO", "Loop play failed: " + soundId + " — " + e.message);
            });
        }

        debugLog("AUDIO", "Looping: " + soundId);
    }

    /**
     * Stop a sound immediately.
     */
    function stop(soundId) {
        _clearFade(soundId);
        var audio = _sounds[soundId];
        if (!audio) return;
        try {
            audio.pause();
            audio.currentTime = 0;
        } catch(e) {}
        debugLog("AUDIO", "Stopped: " + soundId);
    }

    /**
     * Stop all currently playing sounds.
     */
    function stopAll() {
        Object.keys(_sounds).forEach(function(id) {
            stop(id);
        });
        debugLog("AUDIO", "All sounds stopped.");
    }

    /**
     * Fade out a sound over `durationMs` milliseconds, then stop it.
     */
    function fadeOut(soundId, durationMs, onComplete) {
        var audio = _sounds[soundId];
        if (!audio || audio.paused) {
            if (typeof onComplete === "function") onComplete();
            return;
        }

        _clearFade(soundId);

        var startVolume = audio.volume;
        var steps       = 30;
        var stepTime    = durationMs / steps;
        var decrement   = startVolume / steps;
        var count       = 0;

        _fades[soundId] = setInterval(function() {
            count++;
            audio.volume = Math.max(0, startVolume - decrement * count);
            if (count >= steps) {
                _clearFade(soundId);
                stop(soundId);
                if (typeof onComplete === "function") onComplete();
            }
        }, stepTime);

        debugLog("AUDIO", "Fading out: " + soundId + " over " + durationMs + "ms");
    }

    /**
     * Fade in a sound from silence to target volume.
     */
    function fadeIn(soundId, durationMs, targetVolume, loop) {
        if (!AppState.audioUnlocked) return;

        var audio = _load(soundId);
        if (!audio) return;

        _clearFade(soundId);

        var target  = (targetVolume !== undefined) ? targetVolume : 0.8;
        audio.loop   = !!loop;
        audio.volume = 0;
        audio.currentTime = 0;

        var playPromise = audio.play();
        if (playPromise && playPromise.catch) {
            playPromise.catch(function(e) {
                debugWarn("AUDIO", "FadeIn play failed: " + soundId);
            });
        }

        var steps    = 30;
        var stepTime = durationMs / steps;
        var count    = 0;

        _fades[soundId] = setInterval(function() {
            count++;
            audio.volume = Math.min(target, (target / steps) * count);
            if (count >= steps) {
                _clearFade(soundId);
            }
        }, stepTime);

        debugLog("AUDIO", "Fading in: " + soundId + " to " + target + " over " + durationMs + "ms");
    }

    /**
     * Set volume of a playing sound.
     */
    function setVolume(soundId, volume) {
        var audio = _sounds[soundId];
        if (audio) audio.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Must be called once from a user gesture (click/keypress).
     * Unlocks Web Audio on browsers that require a gesture first.
     */
    function unlock() {
        if (AppState.audioUnlocked) return;
        setState("audioUnlocked", true);
        debugLog("AUDIO", "Audio unlocked via user gesture.");

        // Warm up any pre-cached sounds silently
        Object.keys(_sounds).forEach(function(id) {
            var a = _sounds[id];
            if (a && a.readyState === 0) {
                a.load();
            }
        });
    }

    /**
     * Pre-warm audio assets for a set of named IDs.
     * Call this during a scene that will use sounds in the next scene.
     */
    function preload(soundIds) {
        soundIds.forEach(function(id) {
            _load(id);
        });
    }

    // ── Private ──────────────────────────────────────────────────────────

    function _clearFade(soundId) {
        if (_fades[soundId]) {
            clearInterval(_fades[soundId]);
            delete _fades[soundId];
        }
    }

    // ── Public API ────────────────────────────────────────────────────────

    return {
        play:      play,
        playLoop:  playLoop,
        stop:      stop,
        stopAll:   stopAll,
        fadeOut:   fadeOut,
        fadeIn:    fadeIn,
        setVolume: setVolume,
        unlock:    unlock,
        preload:   preload,
    };

})();
