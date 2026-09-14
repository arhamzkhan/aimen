/**
 * AIMEN — Archive Scene (Scene 2)
 * ================================
 * Deterministic Sequence:
 *   LINE 1
 *   ↓
 *   LINE 2
 *   ↓
 *   IMAGE 1 PLACEHOLDER
 *   ↓
 *   IMAGE 2 PLACEHOLDER
 *   ↓
 *   IMAGE 3 PLACEHOLDER
 *   ↓
 *   DEAR AIMEN LETTER (from CONFIG.ARCHIVE_LETTER)
 *   ↓
 *   [ NEXT ]
 *   ↓
 *   RELEASE SCENE (letter scene removed from flow)
 */

var ArchiveScene = (function() {

    // States
    var STATE_LINE_1          = "SCENE_2_LINE_1";
    var STATE_LINE_1_FADE_OUT = "SCENE_2_LINE_1_FADE_OUT";
    var STATE_PAUSE           = "SCENE_2_PAUSE";
    var STATE_LINE_2          = "SCENE_2_LINE_2";
    var STATE_LINE_2_FADE_OUT = "SCENE_2_LINE_2_FADE_OUT";
    var STATE_IMAGE_1         = "SCENE_2_IMAGE_1";
    var STATE_IMAGE_2         = "SCENE_2_IMAGE_2";
    var STATE_IMAGE_3         = "SCENE_2_IMAGE_3";
    var STATE_MESSAGE         = "SCENE_2_MESSAGE";
    var STATE_NEXT_BUTTON     = "SCENE_2_NEXT_BUTTON";

    var _currentState = STATE_LINE_1;

    // DOM References
    var _container   = null;
    var _intro       = null;
    var _gallery     = null;
    var _nextBtn     = null;

    var _timers      = [];
    var _photoFrames = [];
    var _busy        = false;

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

    // ── Build Image Placeholders ──────────────────────────────────────────

    function _buildPhotoComponents() {
        if (!_gallery) return;
        _gallery.innerHTML = "";
        _photoFrames = [];

        var photos = CONFIG.ARCHIVE_PHOTOS || [
            { src: "assets/images/PLACEHOLDER_photo1.webp", caption: "" },
            { src: "assets/images/PLACEHOLDER_photo2.webp", caption: "" },
            { src: "assets/images/PLACEHOLDER_photo3.webp", caption: "" }
        ];

        photos.forEach(function(photo, i) {
            var frame = PhotoFrame.create({
                src:     photo.src,
                caption: photo.caption,
                index:   i
            });
            frame.style.display = "none";
            frame.style.opacity = "0";
            _gallery.appendChild(frame);
            _photoFrames.push(frame);
        });
    }

    // ── Sequence Steps ────────────────────────────────────────────────────

    function _runState_LINE_1() {
        _currentState = STATE_LINE_1;
        debugLog("SCENE_2", "State → " + _currentState);

        if (_intro) {
            _intro.textContent      = "There isn't much here.";
            _intro.style.display    = "block";
            _intro.style.transition = "none";
            _intro.style.opacity    = "0";
            _intro.style.transform  = "translateY(4px)";

            void _intro.offsetWidth;

            _intro.style.transition = "opacity 1.0s ease, transform 1.0s ease";
            _intro.style.opacity    = "1";
            _intro.style.transform  = "translateY(0px)";

            _delay(_runState_LINE_1_FADE_OUT, 2800);
        }
    }

    function _runState_LINE_1_FADE_OUT() {
        _currentState = STATE_LINE_1_FADE_OUT;
        debugLog("SCENE_2", "State → " + _currentState);

        if (_intro) {
            _intro.style.transition = "opacity 1.0s ease, transform 1.0s ease";
            _intro.style.opacity    = "0";
            _intro.style.transform  = "translateY(-4px)";

            _delay(_runState_PAUSE, 1000);
        }
    }

    function _runState_PAUSE() {
        _currentState = STATE_PAUSE;
        debugLog("SCENE_2", "State → " + _currentState);

        if (_intro) _intro.style.display = "none";
        _delay(_runState_LINE_2, 400);
    }

    function _runState_LINE_2() {
        _currentState = STATE_LINE_2;
        debugLog("SCENE_2", "State → " + _currentState);

        if (_intro) {
            _intro.textContent      = "At least, not anymore.";
            _intro.style.display    = "block";
            _intro.style.transition = "none";
            _intro.style.opacity    = "0";
            _intro.style.transform  = "translateY(4px)";

            void _intro.offsetWidth;

            _intro.style.transition = "opacity 1.0s ease, transform 1.0s ease";
            _intro.style.opacity    = "1";
            _intro.style.transform  = "translateY(0px)";

            _delay(_runState_LINE_2_FADE_OUT, 2800);
        }
    }

    function _runState_LINE_2_FADE_OUT() {
        _currentState = STATE_LINE_2_FADE_OUT;
        debugLog("SCENE_2", "State → " + _currentState);

        if (_intro) {
            _intro.style.transition = "opacity 1.0s ease, transform 1.0s ease";
            _intro.style.opacity    = "0";
            _intro.style.transform  = "translateY(-4px)";

            _delay(_runState_IMAGE_1, 1000);
        }
    }

    function _runState_IMAGE_1() {
        _currentState = STATE_IMAGE_1;
        debugLog("SCENE_2", "State → " + _currentState);

        if (_intro) _intro.style.display = "none";
        if (_gallery) _gallery.style.display = "flex";

        var frame1 = _photoFrames[0];
        if (frame1) {
            frame1.style.display   = "block";
            frame1.style.transition= "none";
            frame1.style.opacity   = "0";
            frame1.style.transform = "translate(-50%, -50%) scale(0.96)";

            void frame1.offsetWidth;

            AudioManager.play("paperTurn", 0.3);

            frame1.style.transition = "opacity 1.0s ease, transform 1.0s ease";
            frame1.style.opacity    = "1";
            frame1.style.transform  = "translate(-50%, -50%) scale(1.0)";

            _delay(function() {
                frame1.style.opacity = "0";
                _delay(_runState_IMAGE_2, 900);
            }, 2800);
        } else {
            _runState_IMAGE_2();
        }
    }

    function _runState_IMAGE_2() {
        _currentState = STATE_IMAGE_2;
        debugLog("SCENE_2", "State → " + _currentState);

        if (_photoFrames[0]) _photoFrames[0].style.display = "none";

        var frame2 = _photoFrames[1];
        if (frame2) {
            frame2.style.display   = "block";
            frame2.style.transition= "none";
            frame2.style.opacity   = "0";
            frame2.style.transform = "translate(-50%, -50%) scale(0.96)";

            void frame2.offsetWidth;

            AudioManager.play("paperTurn", 0.3);

            frame2.style.transition = "opacity 1.0s ease, transform 1.0s ease";
            frame2.style.opacity    = "1";
            frame2.style.transform  = "translate(-50%, -50%) scale(1.0)";

            _delay(function() {
                frame2.style.opacity = "0";
                _delay(_runState_IMAGE_3, 900);
            }, 2800);
        } else {
            _runState_IMAGE_3();
        }
    }

    function _runState_IMAGE_3() {
        _currentState = STATE_IMAGE_3;
        debugLog("SCENE_2", "State → " + _currentState);

        if (_photoFrames[1]) _photoFrames[1].style.display = "none";

        var frame3 = _photoFrames[2];
        if (frame3) {
            frame3.style.display   = "block";
            frame3.style.transition= "none";
            frame3.style.opacity   = "0";
            frame3.style.transform = "translate(-50%, -50%) scale(0.96)";

            void frame3.offsetWidth;

            AudioManager.play("paperTurn", 0.3);

            frame3.style.transition = "opacity 1.0s ease, transform 1.0s ease";
            frame3.style.opacity    = "1";
            frame3.style.transform  = "translate(-50%, -50%) scale(1.0)";

            _delay(function() {
                frame3.style.opacity = "0";
                _delay(function() {
                    if (frame3) frame3.style.display = "none";
                    if (_gallery) _gallery.style.display = "none";
                    _runState_MESSAGE();
                }, 900);
            }, 2800);
        } else {
            if (_gallery) _gallery.style.display = "none";
            _runState_MESSAGE();
        }
    }

    function _runState_MESSAGE() {
        _currentState = STATE_MESSAGE;
        debugLog("SCENE_2", "State → " + _currentState);

        if (_gallery) _gallery.style.display = "none";

        var letterEl = document.getElementById("archive-letter");
        if (!letterEl) {
            // fallback — skip straight to next button if element missing
            _runState_NEXT_BUTTON();
            return;
        }

        // Build letter lines from config (once only)
        letterEl.innerHTML = "";
        var lines = CONFIG.ARCHIVE_LETTER || [
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
        ];

        lines.forEach(function(lineText, i) {
            var p = document.createElement("p");
            // Salutation = first non-empty line; signature = last non-empty line
            if (i === 0) {
                p.className = "archive-letter-line archive-letter-line--salutation";
            } else if (i === lines.length - 1 && lineText.trim() !== "") {
                p.className = "archive-letter-line archive-letter-line--signature";
            } else {
                p.className = "archive-letter-line";
            }
            // Blank lines become non-breaking space to preserve vertical rhythm
            p.textContent = lineText || "\u00A0";
            letterEl.appendChild(p);
        });

        // Fade entire letter in as one block
        letterEl.style.display    = "flex";
        letterEl.style.opacity    = "0";
        letterEl.style.transition = "none";

        void letterEl.offsetWidth; // force reflow

        letterEl.style.transition = "opacity 1.4s ease";
        letterEl.style.opacity    = "1";

        // Hold for comfortable reading, then show [ NEXT ] button beneath
        _delay(_runState_NEXT_BUTTON, 3500);
    }

    function _runState_NEXT_BUTTON() {
        _currentState = STATE_NEXT_BUTTON;
        debugLog("SCENE_2", "State → " + _currentState);

        if (_nextBtn) {
            _nextBtn.style.display    = "inline-block";
            _nextBtn.style.transition = "none";
            _nextBtn.style.opacity    = "0";

            void _nextBtn.offsetWidth;

            _nextBtn.style.transition = "opacity 0.8s ease";
            _nextBtn.style.opacity    = "1";
        }
    }

    function _handleNextClick() {
        if (_busy) return;
        _busy = true;

        setState("archiveProgress", true);
        Transition.fadeToBlack(CONFIG.TIMING.TRANSITION_FADE, function() {
            SceneManager.next();
        });
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    function enter() {
        _container  = document.getElementById("scene-archive");
        _intro      = document.getElementById("archive-intro-text");
        _gallery    = document.getElementById("archive-gallery");
        _nextBtn    = document.getElementById("archive-next-btn");

        if (!_container) {
            debugError("SCENE:ARCHIVE", "#scene-archive not found.");
            return;
        }

        // Cancel all background timers from Scene 0/1
        _clearTimers();
        _busy = false;

        _container.style.display = "";

        var _letterEl = document.getElementById("archive-letter");
        if (_intro)    { _intro.style.display    = "none"; _intro.style.opacity  = "0"; }
        if (_gallery)  { _gallery.style.display  = "none"; }
        if (_letterEl) { _letterEl.style.display = "none"; _letterEl.style.opacity = "0"; _letterEl.innerHTML = ""; }
        if (_nextBtn)  { _nextBtn.style.display  = "none"; _nextBtn.style.opacity  = "0"; }

        _buildPhotoComponents();

        if (_nextBtn) {
            InputManager.on("click", _handleNextClick, _nextBtn);
        }

        Transition.fadeFromBlack(CONFIG.TIMING.TRANSITION_FADE, function() {
            _runState_LINE_1();
        });
    }

    function exit(done) {
        _clearTimers();
        _busy = true;

        if (_container) {
            _container.style.display = "none";
        }

        done();
    }

    return {
        name:  "archive",
        enter: enter,
        exit:  exit,
    };

})();
