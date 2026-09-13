/**
 * AIMEN — Release Scene
 * =======================
 * Emotional centerpiece. The butterfly becomes silver and unlit.
 * A silver chain (elegant, necklace-like) connects to it.
 * The butterfly glows, chain releases, butterfly flies free.
 *
 * IMPORTANT:
 *   - No user click required. The sequence is automatic.
 *   - The chain visually represents an elegant necklace, NOT a cage.
 *   - All timing and narration text live in CONFIG — not here.
 *
 * Audio sequence (driven by this scene):
 *   wingBeat → chainTension → [silence] → bassPulse → bassPulse
 *   → etherealSwell → chainRelease → wingWhoosh → [silence]
 *
 * Text: "It's finally free." — synced with narrator audio.
 */

var ReleaseScene = (function() {

    var _container    = null;
    var _butterfly    = null;
    var _chain        = null;
    var _glowEl       = null;
    var _finalText    = null;
    var _butterflyInstance = null;

    var _timers = [];

    // ── Helpers ───────────────────────────────────────────────────────────

    function _clearTimers() {
        _timers.forEach(function(t) { clearTimeout(t); });
        _timers = [];
    }

    function _delay(fn, ms) {
        var t = setTimeout(fn, ms);
        _timers.push(t);
        return t;
    }

    function _addClass(el, cls) { if (el) el.classList.add(cls); }
    function _removeClass(el, cls) { if (el) el.classList.remove(cls); }

    // ── Release Sequence ──────────────────────────────────────────────────
    // Cinematic, fully automatic. Timing driven by CONFIG and audio.

    function _runSequence() {
        var T = 0; // Cumulative time offset

        // Phase 1: Butterfly is silver and still. Chain visible.
        // (Initial state set in HTML/CSS — no-glow state)

        T += 800;
        _delay(function() {
            AudioManager.play("wingBeat", 0.3);
        }, T);

        T += 1400;
        _delay(function() {
            // Faint glow begins
            _addClass(_butterfly, "butterfly--glowing-faint");
            AudioManager.play("chainTension", 0.5);
        }, T);

        T += 1800;
        _delay(function() {
            // Silence — hold
        }, T);

        T += 1200;
        _delay(function() {
            AudioManager.play("bassPulse", 0.7);
        }, T);

        T += 900;
        _delay(function() {
            AudioManager.play("bassPulse", 0.65);
        }, T);

        T += 700;
        _delay(function() {
            // Glow intensifies
            _removeClass(_butterfly, "butterfly--glowing-faint");
            _addClass(_butterfly, "butterfly--glowing-full");
            AudioManager.fadeIn("etherealSwell", 2000, 0.6);
        }, T);

        T += 1800;
        _delay(function() {
            // Chain releases
            _addClass(_chain, "chain--released");
            AudioManager.play("chainRelease", 0.8);
        }, T);

        T += 600;
        _delay(function() {
            // Butterfly flies upward — CSS animation handles the movement
            _addClass(_butterfly, "butterfly--ascending");
            AudioManager.play("wingWhoosh", 0.6);
            AudioManager.play("narratorRelease", 0.9);
        }, T);

        T += 1200;
        _delay(function() {
            // Show "It's finally free."
            _showFinalText();
        }, T);

        T += 2000;
        _delay(function() {
            // Fade out swell
            AudioManager.fadeOut("etherealSwell", 1500);
        }, T);

        T += 1800;
        _delay(function() {
            // Transition to epilogue
            setState("releaseComplete", true);
            Transition.fadeToBlack(CONFIG.TIMING.TRANSITION_FADE, function() {
                SceneManager.next();
            });
        }, T);
    }

    function _showFinalText() {
        if (!_finalText) return;
        _finalText.textContent = CONFIG.NARRATION.RELEASE_FINAL;
        _finalText.style.opacity = "0";
        _finalText.style.display = "";
        void _finalText.offsetWidth;
        _finalText.style.transition = "opacity 1.2s ease";
        _finalText.style.opacity    = "1";
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    function enter() {
        _container = document.getElementById("scene-release");
        _butterfly = document.getElementById("release-butterfly");
        _chain     = document.getElementById("release-chain");
        _glowEl    = document.getElementById("release-glow");
        _finalText = document.getElementById("release-final-text");

        if (!_container) {
            debugError("SCENE:RELEASE", "#scene-release not found.");
            return;
        }

        _clearTimers();
        _container.style.display = "";

        // Reset states
        if (_butterfly) {
            _butterfly.className = "butterfly-release";
            _butterfly.innerHTML = "";
            if (_butterflyInstance) _butterflyInstance.destroy();
            _butterflyInstance = Butterfly.create({ container: _butterfly, x: 0, y: 0 });
        }
        if (_chain) {
            _chain.className = "release-chain";
        }
        if (_finalText) {
            _finalText.style.display = "none";
        }

        Transition.fadeFromBlack(CONFIG.TIMING.TRANSITION_FADE, function() {
            _delay(_runSequence, CONFIG.TIMING.RELEASE_AUTO_TRIGGER);
        });
    }

    function exit(done) {
        _clearTimers();
        AudioManager.stopAll();
        if (_butterflyInstance) {
            _butterflyInstance.destroy();
            _butterflyInstance = null;
        }
        if (_container) _container.style.display = "none";
        done();
    }

    return {
        name:  "release",
        enter: enter,
        exit:  exit,
    };

})();
