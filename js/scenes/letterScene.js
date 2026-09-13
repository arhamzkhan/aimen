/**
 * AIMEN — Letter Scene
 * ======================
 * A physical, handwritten letter on paper.
 * NOT a terminal. NOT a typewriter. NOT hacker UI.
 *
 * PLACEHOLDER NOTE:
 *   Letter content lives in CONFIG.LETTER_CONTENT — not here.
 *   The letter texture lives in CONFIG.ASSETS.letterTexture.
 *   The handwriting font loads from assets/fonts/.
 *
 * Visual: paper card with subtle shadows, handwriting font,
 *         natural proportions, gentle unfold animation.
 */

var LetterScene = (function() {

    var _container = null;
    var _envelope  = null;
    var _paper     = null;
    var _body      = null;
    var _narration = null;

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

    // ── Letter build ──────────────────────────────────────────────────────

    function _populateLetter() {
        if (!_body) return;

        // Convert newlines to paragraphs
        var lines = CONFIG.LETTER_CONTENT.split("\n");
        _body.innerHTML = "";

        lines.forEach(function(line) {
            if (line.trim() === "") {
                _body.appendChild(document.createElement("br"));
            } else {
                var p = document.createElement("p");
                p.className    = "letter-paragraph";
                p.textContent  = line;
                _body.appendChild(p);
            }
        });
    }

    function _unfoldLetter(callback) {
        if (!_paper) { if (callback) callback(); return; }
        AudioManager.play("paperRustle", 0.5);
        _paper.classList.add("letter-paper--unfolding");
        _delay(function() {
            _paper.classList.add("letter-paper--open");
            _paper.classList.remove("letter-paper--unfolding");
            if (callback) callback();
        }, 900);
    }

    function _showNarration() {
        if (!_narration) return;
        _narration.textContent = CONFIG.NARRATION.LETTER_INTRO;
        _narration.style.opacity = "0";
        _narration.style.display = "";
        void _narration.offsetWidth;
        _narration.style.transition = "opacity 1.5s ease";
        _narration.style.opacity    = "1";
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    function enter() {
        _container = document.getElementById("scene-letter");
        _envelope  = document.getElementById("letter-envelope");
        _paper     = document.getElementById("letter-paper");
        _body      = document.getElementById("letter-body");
        _narration = document.getElementById("letter-narration");

        if (!_container) {
            debugError("SCENE:LETTER", "#scene-letter not found.");
            return;
        }

        _clearTimers();
        _container.style.display = "";

        if (_paper) {
            _paper.classList.remove("letter-paper--open", "letter-paper--unfolding");
        }
        var cont = document.getElementById("letter-continue");
        if (cont) {
            cont.style.display = "none";
            cont.style.opacity = "0";
        }

        _populateLetter();

        Transition.fadeFromBlack(CONFIG.TIMING.TRANSITION_FADE, function() {

            // Brief pause before narration
            _delay(_showNarration, 800);

            // Unfold the letter
            _delay(function() {
                _unfoldLetter(function() {

                    // User must scroll/read the letter.
                    // A subtle "continue" appears at the bottom after enough time.
                    _delay(function() {
                        if (cont) {
                            cont.style.display = "";
                            void cont.offsetWidth;
                            cont.style.transition = "opacity 1s ease";
                            cont.style.opacity    = "1";
                            InputManager.on("click", function() {
                                setState("letterRead", true);
                                AudioManager.play("paperTurn", 0.3);
                                Transition.fadeToBlack(CONFIG.TIMING.TRANSITION_FADE, function() {
                                    SceneManager.next();
                                });
                            }, cont);
                        }
                    }, 6000);
                });
            }, CONFIG.TIMING.LETTER_OPEN_DELAY);
        });
    }

    function exit(done) {
        _clearTimers();
        if (_container) _container.style.display = "none";
        done();
    }

    return {
        name:  "letter",
        enter: enter,
        exit:  exit,
    };

})();
