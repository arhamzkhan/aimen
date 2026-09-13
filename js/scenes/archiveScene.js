/**
 * AIMEN — Archive Scene
 * =======================
 * Empty archive / memory environment.
 * Shows 2–3 photographs (from CONFIG.ARCHIVE_PHOTOS).
 * Narration is separate from on-screen text.
 *
 * PLACEHOLDER NOTE:
 *   Photos listed in CONFIG.ARCHIVE_PHOTOS will appear as
 *   grey placeholder frames until real images are placed in assets/images/.
 *   Dropping in real webp files and updating CONFIG paths is all that's needed.
 *
 * DO NOT add photographs or captions here. Modify CONFIG.ARCHIVE_PHOTOS only.
 */

var ArchiveScene = (function() {

    var _container     = null;
    var _intro         = null;
    var _gallery       = null;
    var _narration     = null;
    var _outroLines    = null;

    var _timers = [];
    var _photoComponents = [];

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

    function _showText(el, text) {
        if (!el) return;
        el.textContent = text;
        el.style.opacity = "0";
        el.style.display = "";
        void el.offsetWidth;
        el.style.transition = "opacity 1.2s ease";
        el.style.opacity    = "1";
    }

    function _hideText(el, cb) {
        if (!el) { if (cb) cb(); return; }
        el.style.transition = "opacity 0.8s ease";
        el.style.opacity    = "0";
        _delay(function() {
            el.style.display = "none";
            if (cb) cb();
        }, 800);
    }

    // ── Photo Reveal ──────────────────────────────────────────────────────

    function _buildPhotoFrames() {
        if (!_gallery) return;
        _gallery.innerHTML = "";
        _photoComponents = [];

        CONFIG.ARCHIVE_PHOTOS.forEach(function(photo, i) {
            var frame = PhotoFrame.create({
                src:     photo.src,
                caption: photo.caption,
                index:   i
            });
            frame.style.opacity = "0";
            frame.style.display = "none";
            _gallery.appendChild(frame);
            _photoComponents.push(frame);
        });
    }

    function _revealPhotos(callback) {
        var interval = CONFIG.TIMING.ARCHIVE_PHOTO_INTERVAL;
        var i = 0;

        function revealNext() {
            if (i >= _photoComponents.length) {
                _delay(callback, interval);
                return;
            }
            var frame = _photoComponents[i++];
            frame.style.display = "";
            AudioManager.play("paperTurn", 0.3);
            void frame.offsetWidth;
            frame.style.transition = "opacity 1.4s ease";
            frame.style.opacity    = "1";
            _delay(revealNext, interval);
        }

        revealNext();
    }

    function _hidePhotos(callback) {
        var total = _photoComponents.length;
        if (total === 0) { callback(); return; }

        var done = 0;
        _photoComponents.forEach(function(frame) {
            frame.style.transition = "opacity 1s ease";
            frame.style.opacity    = "0";
            _delay(function() {
                frame.style.display = "none";
                done++;
                if (done === total) callback();
            }, 1000);
        });
    }

    // ── Narration Lines ───────────────────────────────────────────────────

    function _showOutroNarration(callback) {
        var lines = [
            CONFIG.NARRATION.ARCHIVE_OUTRO_1,
            CONFIG.NARRATION.ARCHIVE_OUTRO_2,
            CONFIG.NARRATION.ARCHIVE_OUTRO_3,
        ];

        if (!_outroLines) { callback(); return; }
        _outroLines.style.display = "";
        _outroLines.innerHTML     = "";

        var i = 0;
        function nextLine() {
            if (i >= lines.length) {
                _delay(callback, 2000);
                return;
            }
            var p = document.createElement("p");
            p.className = "archive-outro-line";
            p.textContent = lines[i++];
            p.style.opacity = "0";
            _outroLines.appendChild(p);
            void p.offsetWidth;
            p.style.transition = "opacity 1.2s ease";
            p.style.opacity    = "1";
            _delay(nextLine, 2400);
        }

        nextLine();
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    function enter() {
        _container  = document.getElementById("scene-archive");
        _intro      = document.getElementById("archive-intro-text");
        _gallery    = document.getElementById("archive-gallery");
        _narration  = document.getElementById("archive-narration");
        _outroLines = document.getElementById("archive-outro-lines");

        if (!_container) {
            debugError("SCENE:ARCHIVE", "#scene-archive not found.");
            return;
        }

        _clearTimers();
        _container.style.display = "";
        if (_intro)      _intro.style.display      = "none";
        if (_gallery)    _gallery.style.display     = "none";
        if (_outroLines) _outroLines.style.display  = "none";

        _buildPhotoFrames();

        Transition.fadeFromBlack(CONFIG.TIMING.TRANSITION_FADE, function() {

            // Step 1: Show intro text
            _showText(_intro, CONFIG.NARRATION.ARCHIVE_EMPTY);

            _delay(function() {

                // Step 2: Fade intro, show gallery
                _hideText(_intro, function() {
                    if (_gallery) _gallery.style.display = "";

                    _revealPhotos(function() {

                        // Step 3: Hide photos, show outro narration
                        _hidePhotos(function() {
                            if (_gallery) _gallery.style.display = "none";
                            _showOutroNarration(function() {

                                // Step 4: Transition to next scene
                                setState("archiveProgress", true);
                                Transition.fadeToBlack(CONFIG.TIMING.TRANSITION_FADE, function() {
                                    SceneManager.next();
                                });
                            });
                        });
                    });
                });

            }, 3500);
        });
    }

    function exit(done) {
        _clearTimers();
        if (_container) _container.style.display = "none";
        done();
    }

    return {
        name:  "archive",
        enter: enter,
        exit:  exit,
    };

})();
