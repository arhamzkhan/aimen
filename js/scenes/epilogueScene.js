/**
 * AIMEN — Epilogue Scene
 * ========================
 * Final scene. Intimate, quiet, complete.
 * Lines appear slowly, one at a time.
 * The last line ("Not yet.") echoes the opening password.
 *
 * All text lives in CONFIG.NARRATION.EPILOGUE and CONFIG.NARRATION.EPILOGUE_CODA.
 * DO NOT put personal text in this file.
 */

var EpilogueScene = (function() {

    var _container = null;
    var _linesEl   = null;

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

    // ── Line reveal ───────────────────────────────────────────────────────

    function _showLine(text, styleClass, callback) {
        if (!_linesEl) { if (callback) callback(); return; }

        var el = document.createElement("p");
        el.className  = "epilogue-line " + (styleClass || "");
        el.textContent = text;
        el.style.opacity    = "0";
        el.style.transform  = "translateY(8px)";
        _linesEl.appendChild(el);

        void el.offsetWidth;
        el.style.transition = "opacity 1.4s ease, transform 1.4s ease";
        el.style.opacity    = "1";
        el.style.transform  = "translateY(0)";

        if (typeof callback === "function") {
            _delay(callback, 1400);
        }
    }

    function _runEpilogueLines(callback) {
        var lines     = CONFIG.NARRATION.EPILOGUE;
        var interval  = CONFIG.TIMING.EPILOGUE_LINE_DELAY;
        var i = 0;

        function next() {
            if (i >= lines.length) {
                _delay(callback, interval);
                return;
            }
            _showLine(lines[i++], "", function() {
                _delay(next, interval - 1400); // account for fade duration
            });
        }

        next();
    }

    function _runCodaLines(callback) {
        var lines    = CONFIG.NARRATION.EPILOGUE_CODA;
        var interval = CONFIG.TIMING.EPILOGUE_LINE_DELAY;
        var i = 0;

        // Add a separator blank before coda
        if (_linesEl) {
            var sep = document.createElement("p");
            sep.className = "epilogue-sep";
            sep.innerHTML = "&nbsp;";
            _linesEl.appendChild(sep);
        }

        function next() {
            if (i >= lines.length) {
                if (typeof callback === "function") _delay(callback, interval);
                return;
            }
            // Last line gets special class for "Not yet." echo effect
            var isLast    = (i === lines.length - 1);
            var styleClass = isLast ? "epilogue-line--echo" : "";
            _showLine(lines[i++], styleClass, function() {
                _delay(next, interval - 1400);
            });
        }

        _delay(next, 800);
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    function enter() {
        _container = document.getElementById("scene-epilogue");
        _linesEl   = document.getElementById("epilogue-lines");

        if (!_container) {
            debugError("SCENE:EPILOGUE", "#scene-epilogue not found.");
            return;
        }

        _clearTimers();
        _container.style.display = "";

        if (_linesEl) _linesEl.innerHTML = "";

        Transition.fadeFromBlack(CONFIG.TIMING.TRANSITION_FADE, function() {

            _delay(function() {

                _runEpilogueLines(function() {
                    _delay(function() {
                        _runCodaLines(function() {
                            setState("experienceComplete", true);
                            debugLog("SCENE:EPILOGUE", "Experience complete.");
                            // End — no further navigation. Experience rests here.
                        });
                    }, 1200);
                });

            }, 1000);
        });
    }

    function exit(done) {
        _clearTimers();
        if (_container) _container.style.display = "none";
        done();
    }

    return {
        name:  "epilogue",
        enter: enter,
        exit:  exit,
    };

})();
