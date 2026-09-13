/**
 * AIMEN — Butterfly Scene
 * =========================
 * Dark night environment with atmospheric depth and slow, hand-held camera feel.
 * The butterfly emerges organically, wanders, hovers above the [ CONTINUE ] button,
 * and cinematic-flies away upon selection before transitioning.
 */

var ButterflyScene = (function() {

    var _container     = null;
    var _butterfly     = null;
    var _btn           = null;

    // Atmospheric layer refs
    var _elStars       = null;
    var _elMoon        = null;
    var _elSilhouette  = null;
    var _elWater       = null;
    var _elGrass       = null;

    var _timers        = [];
    var _rafId         = null;

    // Position, movement, and flight sequence state
    var _pos           = { x: 0, y: 0 };
    var _target        = { x: 0, y: 0 };
    var _angle         = 0;
    var _time          = 0;

    var _currentWaypointIdx = 0;
    var _approachMode       = false;
    var _hoverActive        = false;
    var _flyAwayMode        = false;
    var _flyAwayStartTime   = 0;

    var _butterflyInstance = null;

    // ── Helpers ───────────────────────────────────────────────────────────

    function _clearTimers() {
        _timers.forEach(function(t) { clearTimeout(t); });
        _timers = [];
        if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
    }

    function _delay(fn, ms) {
        var t = setTimeout(fn, ms);
        _timers.push(t);
    }

    function _setFlappingSpeed(speed) {
        if (_butterflyInstance) {
            _butterflyInstance.setFlappingSpeed(speed);
        }
    }

    function _getWaypoint(idx) {
        var W = window.innerWidth;
        var H = window.innerHeight;
        var points = [
            { x: W * 0.32, y: H * 0.38, speed: "0.18s" },
            { x: W * 0.50, y: H * 0.22, speed: "0.28s" }, // drawn near moon
            { x: W * 0.72, y: H * 0.45, speed: "0.16s" },
            { x: W * 0.40, y: H * 0.54, speed: "0.22s" }
        ];
        return points[idx % points.length];
    }

    // ── Butterfly Movement ────────────────────────────────────────────────

    function _initButterfly() {
        var W = window.innerWidth || 1280;
        var H = window.innerHeight || 720;

        // Start near center-upper viewport (deterministic & immediately visible)
        _pos.x = W * 0.45;
        _pos.y = H * 0.35;

        // Initial wander target — center area
        _target.x = W * 0.50;
        _target.y = H * 0.38;

        _time = 0;
        _approachMode = false;

        if (_butterfly) {
            _butterfly.innerHTML = "";
            _butterfly.style.opacity = "1";
            if (_butterflyInstance) _butterflyInstance.destroy();
            _butterflyInstance = Butterfly.create({
                container: _butterfly,
                x: _pos.x,
                y: _pos.y
            });
        }
    }

    function _updateButterfly() {
        _time += 0.012;

        // Sinusoidal drift offsets
        var driftX = Math.sin(_time * 1.3) * 18;
        var driftY = Math.cos(_time * 0.9) * 12;

        // Lerp toward target
        var speed = _approachMode ? 0.025 : 0.012;
        _pos.x += (_target.x + driftX - _pos.x) * speed;
        _pos.y += (_target.y + driftY - _pos.y) * speed;

        if (_butterflyInstance) {
            _butterflyInstance.setTarget(_target.x + driftX, _target.y + driftY);
            _butterflyInstance.update(0.016, speed);
        }
    }

    function _startMovement() {
        function loop() {
            _updateButterfly();
            _rafId = requestAnimationFrame(loop);
        }
        _rafId = requestAnimationFrame(loop);

        // Fade in butterfly
        _delay(function() {
            if (_butterfly) {
                _butterfly.style.transition = "opacity 1.8s ease";
                _butterfly.style.opacity    = "1";
            }
            AudioManager.fadeIn("ambientNight", 3000, 0.35, true);
        }, 400);

        // After approach time, drift toward button and reveal it
        _delay(function() {
            _approachMode = true;
            _moveTowardButton();
        }, CONFIG.TIMING.BUTTERFLY_APPROACH);
    }

    function _moveTowardButton() {
        if (!_btn) return;

        var W = window.innerWidth || 1280;
        var H = window.innerHeight || 720;
        var btnRect = _btn.getBoundingClientRect();

        if (btnRect.width > 0 && btnRect.height > 0) {
            _target.x = btnRect.left + btnRect.width * 0.5 - 40;
            _target.y = btnRect.top  - 60;
        } else {
            // Deterministic target position above continue button area
            _target.x = W * 0.5 - 40;
            _target.y = H * 0.68 - 60;
        }

        // Reveal button after butterfly gets close
        _delay(function() {
            Transition.fadeElement(_btn, "in", 800, function() {
                // Update target once button is visible in layout
                var bRect = _btn.getBoundingClientRect();
                if (bRect.width > 0) {
                    _target.x = bRect.left + bRect.width * 0.5 - 40;
                    _target.y = bRect.top  - 60;
                }
            });
            if (_butterfly) {
                _butterfly.classList.add("butterfly--near-button");
            }
        }, 1800);
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    function enter() {
        _container = document.getElementById("scene-butterfly");
        _butterfly = document.getElementById("butterfly-element");
        _btn       = document.getElementById("butterfly-continue");

        if (!_container) {
            debugError("SCENE:BUTTERFLY", "#scene-butterfly not found.");
            return;
        }

        _clearTimers();
        _container.style.display = "";
        if (_btn) _btn.style.display = "none";

        _initButterfly();

        Transition.fadeFromBlack(CONFIG.TIMING.TRANSITION_FADE, function() {
            _startMovement();
        });

        // Continue button click
        if (_btn) {
            InputManager.on("click", function() {
                if (!_approachMode) return; // guard: only after butterfly approaches
                AudioManager.play("wingBeat", 0.5);
                AudioManager.fadeOut("ambientNight", 1200);
                Transition.fadeToBlack(CONFIG.TIMING.TRANSITION_FADE, function() {
                    SceneManager.next();
                });
            }, _btn);
        }
    }

    function exit(done) {
        _clearTimers();
        if (_butterflyInstance) {
            _butterflyInstance.destroy();
            _butterflyInstance = null;
        }
        if (_container) _container.style.display = "none";
        done();
    }

    return {
        name:  "butterfly",
        enter: enter,
        exit:  exit,
    };

})();
