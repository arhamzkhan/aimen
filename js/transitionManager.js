/**
 * AIMEN Experience — Transition Manager
 * ========================================
 * Reusable, centralized transition system.
 * Scenes must NOT write fade/transition logic themselves.
 *
 * Usage:
 *   Transition.fadeToBlack(800, callback);
 *   Transition.fadeFromBlack(800, callback);
 *   Transition.fadeElement(el, "out", 500, callback);
 *   Transition.crossfade(outEl, inEl, 600, callback);
 *
 * The overlay element (#transition-overlay) is created automatically.
 */

var Transition = (function() {

    var _overlay = null;

    /**
     * Lazily get or create the full-screen transition overlay.
     */
    function _getOverlay() {
        if (_overlay) return _overlay;
        _overlay = document.getElementById("transition-overlay");
        if (!_overlay) {
            _overlay = document.createElement("div");
            _overlay.id = "transition-overlay";
            document.body.appendChild(_overlay);
        }
        return _overlay;
    }

    /**
     * Fade the screen to black over `durationMs`.
     * @param {number} durationMs
     * @param {Function} [callback] — called when fade is complete
     */
    function fadeToBlack(durationMs, callback) {
        var duration = durationMs || CONFIG.TIMING.TRANSITION_FADE;
        var overlay  = _getOverlay();

        // Ensure overlay is visible and starting transparent
        overlay.style.transition = "none";
        overlay.style.opacity    = "0";
        overlay.style.display    = "block";
        overlay.style.background = "#000000";

        // Force reflow
        void overlay.offsetWidth;

        overlay.style.transition = "opacity " + duration + "ms ease";
        overlay.style.opacity    = "1";

        debugLog("TRANSITION", "Fade to black over " + duration + "ms");

        setTimeout(function() {
            if (typeof callback === "function") callback();
        }, duration);
    }

    /**
     * Fade the screen from black over `durationMs`.
     * @param {number} durationMs
     * @param {Function} [callback] — called when fade is complete
     */
    function fadeFromBlack(durationMs, callback) {
        var duration = durationMs || CONFIG.TIMING.TRANSITION_FADE;
        var overlay  = _getOverlay();

        overlay.style.background = "#000000";
        overlay.style.display    = "block";
        overlay.style.transition = "none";
        overlay.style.opacity    = "1";

        void overlay.offsetWidth;

        overlay.style.transition = "opacity " + duration + "ms ease";
        overlay.style.opacity    = "0";

        debugLog("TRANSITION", "Fade from black over " + duration + "ms");

        setTimeout(function() {
            overlay.style.display = "none";
            if (typeof callback === "function") callback();
        }, duration);
    }

    /**
     * Fade to black, run callback at darkest point, then fade back in.
     * Useful for between-scene cuts.
     * @param {number} halfDuration — duration of each half
     * @param {Function} midCallback — called at darkest point (scene swap happens here)
     * @param {Function} [doneCallback] — called when fully revealed
     */
    function cutThrough(halfDuration, midCallback, doneCallback) {
        fadeToBlack(halfDuration, function() {
            if (typeof midCallback === "function") midCallback();
            setTimeout(function() {
                fadeFromBlack(halfDuration, doneCallback);
            }, 80); // tiny pause at peak black
        });
    }

    /**
     * Fade a single DOM element in or out.
     * @param {HTMLElement} el
     * @param {"in"|"out"} direction
     * @param {number} durationMs
     * @param {Function} [callback]
     */
    function fadeElement(el, direction, durationMs, callback) {
        if (!el) {
            if (typeof callback === "function") callback();
            return;
        }

        var duration  = durationMs || CONFIG.TIMING.TRANSITION_FADE;
        var startOpacity = direction === "in" ? "0" : "1";
        var endOpacity   = direction === "in" ? "1" : "0";

        el.style.transition = "none";
        el.style.opacity    = startOpacity;
        if (direction === "in") el.style.display = "";

        void el.offsetWidth;

        el.style.transition = "opacity " + duration + "ms ease";
        el.style.opacity    = endOpacity;

        setTimeout(function() {
            if (direction === "out") el.style.display = "none";
            if (typeof callback === "function") callback();
        }, duration);
    }

    /**
     * Hard cut — instantly swap visibility between two elements.
     */
    function hardCut(outEl, inEl) {
        if (outEl) { outEl.style.display = "none"; outEl.style.opacity = "0"; }
        if (inEl)  { inEl.style.display  = "";     inEl.style.opacity  = "1"; }
    }

    /**
     * Ensure overlay is hidden (call on startup).
     */
    function reset() {
        var overlay = _getOverlay();
        overlay.style.opacity    = "0";
        overlay.style.display    = "none";
        overlay.style.transition = "none";
    }

    return {
        fadeToBlack:   fadeToBlack,
        fadeFromBlack: fadeFromBlack,
        cutThrough:    cutThrough,
        fadeElement:   fadeElement,
        hardCut:       hardCut,
        reset:         reset,
    };

})();
