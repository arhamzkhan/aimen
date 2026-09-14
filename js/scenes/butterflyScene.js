/**
 * AIMEN — Butterfly Scene (Scene 1)
 * ==================================
 * Atmospheric dark night environment with a large organic tree branch
 * extending from off-screen left, sparse natural stars, and the Silver SVG Butterfly.
 *
 * Sequence Flow:
 *   1. Starts off-screen upper-left.
 *   2. Enters scene and explores naturally along organic curved paths (~7 seconds).
 *   3. Softly responds to mouse position as a subtle environmental drift.
 *   4. Gradually turns toward the tree branch.
 *   5. Hovers briefly above the landing spot on the branch.
 *   6. Gently settles ON the branch and switches to resting animation (setState("rest")).
 *   7. Fades in [ CONTINUE ] button smoothly over 1.4s in lower-middle.
 *   8. Click [ NEXT / CONTINUE ] → butterfly takes off → fade to black → Scene 2.
 */

var ButterflyScene = (function() {

    var _container         = null;
    var _butterflyEl       = null;
    var _btn               = null;
    var _elStars           = null;
    var _landingSpotEl     = null;

    var _timers            = [];
    var _rafId             = null;

    // Flight sequence state
    var _startTime         = 0;
    var _phase             = "explore"; // "explore" | "approach" | "hover" | "rest"
    var _time              = 0;
    var _isSettled         = false;
    var _busy              = false;

    // Mouse tracking for subtle environmental influence
    var _mouseX            = -9999;
    var _mouseY            = -9999;
    var _mouseDriftX       = 0;
    var _mouseDriftY       = 0;

    var _pos               = { x: -100, y: -90 };
    var _butterflyInstance = null;
    var _atmosphereBuilt   = false;

    // ── Helpers ───────────────────────────────────────────────────────────

    function _rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function _getBezierPoint(p0, p1, p2, p3, t) {
        var u = 1 - t;
        var tt = t * t;
        var uu = u * u;
        var uuu = uu * u;
        var ttt = tt * t;

        var x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
        var y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
        return { x: x, y: y };
    }

    function _clearTimers() {
        _timers.forEach(function(t) { clearTimeout(t); });
        _timers = [];
        if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
    }

    function _delay(fn, ms) {
        var t = setTimeout(fn, ms);
        _timers.push(t);
        return t;
    }

    // ── Atmosphere Builder ───────────────────────────────────────────────

    function _buildAtmosphere() {
        if (_atmosphereBuilt || !_container) return;

        // Natural starfield — sparse, clearly visible, varied in size and brightness
        _elStars = document.getElementById("butterfly-stars");
        if (_elStars) {
            _elStars.innerHTML = "";
            var starCount = 28;
            for (var i = 0; i < starCount; i++) {
                var star = document.createElement("div");
                star.className = "butterfly-star";
                // Varied sizes: most small, a few slightly larger
                var size = _rand(0.8, 2.6);
                // Larger stars are brighter — feels like depth
                var brightness = Math.pow(size / 2.6, 0.6); // 0..1
                var minOp = (0.30 + brightness * 0.25).toFixed(2);
                var maxOp = (0.55 + brightness * 0.30).toFixed(2);

                star.style.width  = size.toFixed(1) + "px";
                star.style.height = size.toFixed(1) + "px";
                star.style.top    = _rand(2, 72).toFixed(1) + "%";
                star.style.left   = _rand(2, 98).toFixed(1) + "%";
                star.style.setProperty("--twinkle-duration", _rand(4.0, 9.0).toFixed(1) + "s");
                star.style.setProperty("--min-opacity", minOp);
                star.style.setProperty("--max-opacity", maxOp);
                star.style.animationDelay = _rand(0, 6).toFixed(1) + "s";
                _elStars.appendChild(star);
            }
        }

        _atmosphereBuilt = true;
    }

    // ── Get Landing Spot Position ──────────────────────────────────────────

    function _getLandingSpotCoordinates() {
        _landingSpotEl = document.getElementById("branch-landing-spot");
        var W = window.innerWidth || 1280;
        var H = window.innerHeight || 720;

        if (_landingSpotEl) {
            var rect = _landingSpotEl.getBoundingClientRect();
            if (rect.width > 0 || rect.left > 0) {
                return {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
            }
        }

        // Default fallback position if element bounding box isn't ready
        return {
            x: W * 0.32,
            y: H * 0.46
        };
    }

    // ── Butterfly Initialization ──────────────────────────────────────────

    function _initButterfly() {
        _pos.x = -100;
        _pos.y = -90;
        _phase = "explore";
        _isSettled = false;
        _time = 0;

        if (_butterflyEl) {
            _butterflyEl.innerHTML = "";
            _butterflyEl.style.opacity = "0";
            if (_butterflyInstance) _butterflyInstance.destroy();

            _butterflyInstance = Butterfly.create({
                container: _butterflyEl,
                x: _pos.x,
                y: _pos.y,
                scale: 0.82
            });
            _butterflyInstance.setState("fly");
            _butterflyInstance.setFlappingSpeed(0.24);
        }
    }

    // ── Main Flight Loop ──────────────────────────────────────────────────

    function _startFlightSequence() {
        _startTime = Date.now();
        _phase = "explore";
        _isSettled = false;

        if (_butterflyEl) {
            _butterflyEl.style.transition = "opacity 0.8s ease";
            _butterflyEl.style.opacity    = "1";
        }

        AudioManager.fadeIn("ambientNight", 3000, 0.35, true);

        // Exploration bezier path control points
        var W = window.innerWidth || 1280;
        var H = window.innerHeight || 720;

        var p0 = { x: -100, y: -90 };
        var p1 = { x: W * 0.28, y: H * 0.18 };
        var p2 = { x: W * 0.55, y: H * 0.30 };
        var p3 = { x: W * 0.42, y: H * 0.44 };

        var exploreDuration = 7200; // 7.2s natural flight exploration
        var approachStartTime = 0;
        var hoverStartTime = 0;
        var touchdownStartTime = 0;

        var landingSpot = _getLandingSpotCoordinates();
        var hoverTarget = { x: landingSpot.x + 8, y: landingSpot.y - 24 };

        function updateLoop() {
            var now = Date.now();
            var elapsed = now - _startTime;
            _time += 0.016;

            // Recalculate landing spot dynamically in case of resize
            landingSpot = _getLandingSpotCoordinates();
            hoverTarget.x = landingSpot.x + 6;
            hoverTarget.y = landingSpot.y - 22;

            // Soft environmental mouse drift (max 14px influence, decays smoothly when still)
            if (_mouseX > 0 && _mouseY > 0) {
                var mDx = (_mouseX - _pos.x) * 0.018;
                var mDy = (_mouseY - _pos.y) * 0.018;
                // Clamp
                mDx = Math.max(-12, Math.min(12, mDx));
                mDy = Math.max(-12, Math.min(12, mDy));
                _mouseDriftX += (mDx - _mouseDriftX) * 0.04;
                _mouseDriftY += (mDy - _mouseDriftY) * 0.04;
            } else {
                _mouseDriftX *= 0.95;
                _mouseDriftY *= 0.95;
            }

            // ── PHASE 1: EXPLORE ──────────────────────────────────────────
            if (_phase === "explore") {
                var t = Math.min(1.0, elapsed / exploreDuration);
                var easeT = 1 - Math.pow(1 - t, 2.5); // smooth ease out

                var bezierPos = _getBezierPoint(p0, p1, p2, p3, easeT);

                // Organic multi-harmonic sway
                var swayX = Math.sin(_time * 2.8) * 14 + Math.cos(_time * 1.4) * 6 + _mouseDriftX;
                var swayY = Math.cos(_time * 2.2) * 10 + Math.sin(_time * 3.6) * 5 + _mouseDriftY;

                var currX = bezierPos.x + swayX;
                var currY = bezierPos.y + swayY;

                // Scale variation for 3D depth (0.82 -> 1.05 -> 0.92)
                var currScale = 0.82 + Math.sin(easeT * Math.PI) * 0.24;

                // Heading angle calculation
                var nextBezier = _getBezierPoint(p0, p1, p2, p3, Math.min(1.0, easeT + 0.012));
                var dx = (nextBezier.x + swayX) - currX;
                var dy = (nextBezier.y + swayY) - currY;
                var headingAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

                if (_butterflyInstance) {
                    _butterflyInstance.setPosition(currX, currY);
                    _butterflyInstance.setScale(currScale);
                    _butterflyInstance.setAngle(headingAngle);
                }

                if (t >= 1.0) {
                    _phase = "approach";
                    approachStartTime = now;
                    if (_butterflyInstance) {
                        _butterflyInstance.setState("hover");
                        _butterflyInstance.setFlappingSpeed(0.28);
                    }
                }

            // ── PHASE 2: APPROACH HOVER POINT ABOVE BRANCH ───────────────
            } else if (_phase === "approach") {
                var appElapsed = now - approachStartTime;
                var appT = Math.min(1.0, appElapsed / 2200); // 2.2s approach
                var appEase = 1 - Math.pow(1 - appT, 3);

                var startX = _butterflyInstance.pos.x;
                var startY = _butterflyInstance.pos.y;

                var appX = startX + (hoverTarget.x - startX) * appEase + Math.sin(_time * 2.0) * 3;
                var appY = startY + (hoverTarget.y - startY) * appEase + Math.cos(_time * 1.8) * 2;

                var appAngle = -15 + Math.sin(_time * 1.5) * 4;

                if (_butterflyInstance) {
                    _butterflyInstance.setPosition(appX, appY);
                    _butterflyInstance.setScale(0.92);
                    _butterflyInstance.setAngle(appAngle);
                }

                if (appT >= 1.0) {
                    _phase = "hover";
                    hoverStartTime = now;
                }

            // ── PHASE 3: BRIEF HOVER ADJUSTMENT ───────────────────────────
            } else if (_phase === "hover") {
                var hovElapsed = now - hoverStartTime;

                var hovX = hoverTarget.x + Math.sin(_time * 1.8) * 4;
                var hovY = hoverTarget.y + Math.cos(_time * 2.2) * 3;
                var hovAngle = -18 + Math.sin(_time * 1.2) * 3;

                if (_butterflyInstance) {
                    _butterflyInstance.setPosition(hovX, hovY);
                    _butterflyInstance.setAngle(hovAngle);
                }

                if (hovElapsed >= 1400) { // hover for 1.4s
                    _phase = "touchdown";
                    touchdownStartTime = now;
                }

            // ── PHASE 4: SOFT TOUCHDOWN ON BRANCH & REST ──────────────────
            } else if (_phase === "touchdown") {
                var tdElapsed = now - touchdownStartTime;
                var tdT = Math.min(1.0, tdElapsed / 1000); // 1s gentle landing
                var tdEase = 1 - Math.pow(1 - tdT, 2);

                var landX = hoverTarget.x + (landingSpot.x - hoverTarget.x) * tdEase;
                var landY = hoverTarget.y + (landingSpot.y - hoverTarget.y) * tdEase;
                var landAngle = -18;

                if (_butterflyInstance) {
                    _butterflyInstance.setPosition(landX, landY);
                    _butterflyInstance.setAngle(landAngle);
                    _butterflyInstance.setScale(0.88);
                }

                if (tdT >= 1.0 && !_isSettled) {
                    _isSettled = true;
                    _phase = "rest";
                    if (_butterflyInstance) {
                        _butterflyInstance.setState("rest");
                    }
                    _revealContinueButton();
                }

            // ── PHASE 5: RESTING ON BRANCH ────────────────────────────────
            } else if (_phase === "rest") {
                // Micro breathing sway while perched on branch
                var restX = landingSpot.x + Math.sin(_time * 0.8) * 0.8;
                var restY = landingSpot.y + Math.cos(_time * 0.6) * 0.5;

                if (_butterflyInstance) {
                    _butterflyInstance.setPosition(restX, restY);
                    _butterflyInstance.setAngle(-18);
                }
            }

            _rafId = requestAnimationFrame(updateLoop);
        }

        _rafId = requestAnimationFrame(updateLoop);
    }

    // ── Reveal [ CONTINUE ] Button ─────────────────────────────────────────

    function _revealContinueButton() {
        if (!_btn) return;
        _btn.style.display    = "inline-block";
        _btn.style.transition = "none";
        _btn.style.opacity    = "0";

        void _btn.offsetWidth; // force reflow

        _btn.style.transition = "opacity 1.4s ease, border-color 0.3s ease, color 0.3s ease, background 0.3s ease";
        _btn.style.opacity    = "1";
    }

    // ── Mouse Move Listener ───────────────────────────────────────────────

    function _onMouseMove(e) {
        _mouseX = e.clientX;
        _mouseY = e.clientY;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    function enter() {
        _container   = document.getElementById("scene-butterfly");
        _butterflyEl = document.getElementById("butterfly-element");
        _btn         = document.getElementById("butterfly-continue");

        if (!_container) {
            debugError("SCENE:BUTTERFLY", "#scene-butterfly not found.");
            return;
        }

        _clearTimers();
        _busy = false;
        _container.style.display = "";

        if (_btn) {
            _btn.style.display = "none";
            _btn.style.opacity = "0";
        }

        _buildAtmosphere();
        _initButterfly();

        // Listen for mouse moves for environmental influence
        InputManager.on("mousemove", _onMouseMove, window);

        // Fade scene in from black, then begin organic flight sequence
        Transition.fadeFromBlack(CONFIG.TIMING.TRANSITION_FADE, function() {
            _delay(function() {
                _startFlightSequence();
            }, 300);
        });

        // Continue button click handler
        if (_btn) {
            InputManager.on("click", function() {
                if (!_isSettled || _busy) return; // guard: only clickable after landing
                _busy = true;

                AudioManager.play("wingBeat", 0.5);
                AudioManager.fadeOut("ambientNight", 1200);

                // Butterfly take-off escape trajectory
                if (_butterflyInstance) {
                    _butterflyInstance.setState("fly");
                    _butterflyInstance.setFlappingSpeed(0.14);
                    _butterflyInstance.setTarget(_butterflyInstance.pos.x + 350, _butterflyInstance.pos.y - 450);
                }

                Transition.fadeToBlack(CONFIG.TIMING.TRANSITION_FADE, function() {
                    SceneManager.next();
                });
            }, _btn);
        }
    }

    function exit(done) {
        _clearTimers();
        _busy = true;

        if (_butterflyInstance) {
            _butterflyInstance.destroy();
            _butterflyInstance = null;
        }
        if (_container) {
            _container.style.display = "none";
        }

        done();
    }

    return {
        name:  "butterfly",
        enter: enter,
        exit:  exit,
    };

})();
