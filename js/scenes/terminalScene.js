/**
 * AIMEN — Terminal Scene
 * ========================
 * Minimal, dark, old-school computer terminal.
 *
 * Flow:
 *   1. PASSWORD REQUIRED: _ prompt immediately on load
 *   2. User types "Not Yet" + Enter
 *   3. Show "Permission granted." → fade completely to black
 *   4. System Boot Sequence (messages one at a time + subtle loader)
 *      - INITIALIZING ARCHIVE...
 *      - CONNECTING TO MEMORY STORAGE...
 *      - SEARCHING FOR FRAGMENTS...
 *      - RESTORING ARCHIVE...
 *      - SYSTEM READY
 *   5. Fade out to black → transition to Act II (Butterfly Scene)
 */

var TerminalScene = (function() {

    var _container    = null;
    var _inputLine    = null;
    var _inputField   = null;
    var _feedback     = null;
    var _bootWrapper  = null;
    var _bootMsg      = null;
    var _bootLoader   = null;

    var _timers  = [];
    var _busy    = false;

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

    // ── Password handling ─────────────────────────────────────────────────

    function _handleSubmit() {
        if (_busy) return;

        var rawValue = _inputField ? _inputField.value : "";
        var entered  = rawValue.trim();

        if (!entered) return;

        var normalizedEntered = entered.toLowerCase().replace(/\s+/g, " ");
        var normalizedTarget  = CONFIG.TERMINAL_PASSWORD.toLowerCase().replace(/\s+/g, " ");

        if (normalizedEntered === normalizedTarget || entered === CONFIG.TERMINAL_PASSWORD) {
            _busy = true;
            if (_inputField) _inputField.disabled = true;
            setState("terminalAuthenticated", true);
            _onPasswordSuccess();
        } else {
            _onPasswordDenied();
        }
    }

    function _onPasswordSuccess() {
        AudioManager.play("accessGranted", 0.5);

        // Step 1: Hide input prompt, show "Permission granted."
        if (_inputLine) _inputLine.style.display = "none";
        if (_feedback) {
            _feedback.textContent = CONFIG.TERMINAL.GRANTED_TEXT || "Permission granted.";
            _feedback.className = "terminal-feedback terminal-feedback--granted";
            _feedback.style.display = "block";
            _feedback.style.opacity = "1";
        }

        // Hold "Permission granted." for 1.1s, then fade terminal completely into black
        _delay(function() {
            Transition.fadeToBlack(700, function() {
                // Begin system boot sequence on pure black
                _startSystemBootSequence();
            });
        }, 1100);
    }

    function _onPasswordDenied() {
        if (_feedback) {
            _feedback.textContent = CONFIG.TERMINAL.DENIED_TEXT || "Access denied.";
            _feedback.className = "terminal-feedback terminal-feedback--denied";
            _feedback.style.display = "block";
            _feedback.style.opacity = "1";
        }

        if (_inputField) {
            _inputField.value = "";
            _inputField.focus();
        }

        _delay(function() {
            if (_feedback) _feedback.style.display = "none";
        }, 1500);
    }

    // ── System Boot Sequence (Messages one at a time) ──────────────────────

    function _startSystemBootSequence() {
        if (_feedback)    _feedback.style.display    = "none";
        if (_bootWrapper) _bootWrapper.style.display = "flex";
        if (_bootLoader)  _bootLoader.style.display  = "flex";

        var messages = CONFIG.TERMINAL.BOOT_SEQUENCE || [
            "INITIALIZING ARCHIVE...",
            "CONNECTING TO MEMORY STORAGE...",
            "SEARCHING FOR FRAGMENTS...",
            "RESTORING ARCHIVE...",
            "SYSTEM READY"
        ];

        // Fade overlay from black so boot messages render over pure black background
        Transition.fadeFromBlack(300);

        var index = 0;

        function showNextMessage() {
            if (index >= messages.length) {
                // Boot complete: hide loader, fade to black, then transition to Act II
                _delay(function() {
                    if (_bootLoader) _bootLoader.style.display = "none";
                    Transition.fadeToBlack(800, function() {
                        _delay(function() {
                            SceneManager.next();
                        }, 500);
                    });
                }, 400);
                return;
            }

            var text = messages[index++];
            if (_bootMsg) {
                _bootMsg.textContent = text;
                _bootMsg.style.transition = "none";
                _bootMsg.style.opacity = "0";

                // Force reflow
                void _bootMsg.offsetWidth;

                // 1. Fade in (0.5s)
                _bootMsg.style.transition = "opacity 0.5s ease";
                _bootMsg.style.opacity = "1";

                // 2. Visible hold (1.1s)
                _delay(function() {
                    // 3. Fade out (0.5s)
                    _bootMsg.style.transition = "opacity 0.5s ease";
                    _bootMsg.style.opacity = "0";

                    // 4. Pause before next message (0.5s)
                    _delay(function() {
                        showNextMessage();
                    }, 500);
                }, 1100);
            }
        }

        _delay(showNextMessage, 400);
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    function enter() {
        _container   = document.getElementById("scene-terminal");
        _inputLine   = document.getElementById("terminal-input-line");
        _inputField  = document.getElementById("terminal-input-field");
        _feedback    = document.getElementById("terminal-feedback");
        _bootWrapper = document.getElementById("terminal-boot-wrapper");
        _bootMsg     = document.getElementById("terminal-boot-msg");
        _bootLoader  = document.getElementById("terminal-loader");

        if (!_container || !_inputLine || !_inputField) {
            debugError("SCENE:TERMINAL", "Required DOM elements not found.");
            return;
        }

        _clearTimers();
        _busy = false;

        _container.classList.add("active");
        _container.style.display = "flex";

        // Initial State: Password prompt visible immediately
        if (_inputLine)   _inputLine.style.display   = "flex";
        if (_feedback)    _feedback.style.display    = "none";
        if (_bootWrapper) _bootWrapper.style.display = "none";

        if (_inputField) {
            _inputField.value    = "";
            _inputField.disabled = false;
            _inputField.focus();
        }

        // Auto-focus input when clicking anywhere in terminal
        InputManager.on("click", function() {
            if (_inputField && !_inputField.disabled && _inputLine.style.display !== "none") {
                _inputField.focus();
            }
        }, _container);

        // Submit on Enter key
        InputManager.on("keydown", function(e) {
            if (e.key === "Enter" && _inputLine && _inputLine.style.display !== "none") {
                e.preventDefault();
                _handleSubmit();
            }
        });

        var submitBtn = document.getElementById("terminal-submit");
        if (submitBtn) {
            InputManager.on("click", _handleSubmit, submitBtn);
        }

        // Immediate fade from black
        Transition.fadeFromBlack(300);
    }

    function exit(done) {
        _clearTimers();
        _busy = true;
        if (_container) {
            _container.classList.remove("active");
            _container.style.display = "none";
        }
        done();
    }

    return {
        name:  "terminal",
        enter: enter,
        exit:  exit,
    };

})();
