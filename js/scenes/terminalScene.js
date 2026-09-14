/**
 * AIMEN — Terminal Scene
 * ========================
 * Cinematic Hacker / Unix Terminal styled like authentic macOS Terminal.
 *
 * Strict State Machine Flow:
 *   TERMINAL_BOOT → PASSWORD → ACCESS_GRANTED → TERMINAL_FADE → BLACK_SEQUENCE → NEXT_SCENE
 *
 * 1. TERMINAL_BOOT:
 *    Typewriter output of shell boot initialization lines character-by-character.
 *
 * 2. PASSWORD:
 *    Displays green "ENTER PASSWORD:" prompt.
 *    Green masked input and cursor.
 *    Wrong password: shows red "ACCESS DENIED — INCORRECT PASSWORD", keeps terminal, allows retry.
 *    Correct password: advances to ACCESS_GRANTED.
 *
 * 3. ACCESS_GRANTED:
 *    Displays green "ACCESS GRANTED", plays audio, holds briefly.
 *
 * 4. TERMINAL_FADE:
 *    The ENTIRE terminal window smoothly dissolves out over pitch-black background.
 *    Terminal NEVER reappears.
 *
 * 5. BLACK_SEQUENCE:
 *    Displays cinematic setup messages one-by-one centered on pure pitch-black screen.
 *    Messages fade in, hold, and fade out smoothly.
 *
 * 6. NEXT_SCENE:
 *    Brief pitch-black pause, then transition to Butterfly Scene (Act II).
 */

var TerminalScene = (function() {

    // States
    var STATE_TERMINAL_BOOT = "TERMINAL_BOOT";
    var STATE_PASSWORD      = "PASSWORD";
    var STATE_ACCESS_GRANTED= "ACCESS_GRANTED";
    var STATE_TERMINAL_FADE = "TERMINAL_FADE";
    var STATE_BLACK_SEQUENCE= "BLACK_SEQUENCE";
    var STATE_NEXT_SCENE    = "NEXT_SCENE";

    var _currentState = STATE_TERMINAL_BOOT;

    // DOM References
    var _container     = null;
    var _windowEl      = null;
    var _outputEl      = null;
    var _promptRow     = null;
    var _inputField    = null;
    var _maskedDisplay = null;
    var _feedback      = null;
    var _cinematicWrap = null;
    var _cinematicMsg  = null;

    var _timers        = [];
    var _busy          = false;

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

    function _updateMaskedDisplay() {
        if (!_maskedDisplay || !_inputField) return;
        var len = _inputField.value.length;
        _maskedDisplay.textContent = "•".repeat(len);
    }

    function _focusInput() {
        if (_inputField && !_inputField.disabled && _currentState === STATE_PASSWORD) {
            _inputField.focus();
        }
    }

    // ── State 1: TERMINAL_BOOT (Typewriter Sequence) ──────────────────────

    function _startTerminalBoot() {
        _currentState = STATE_TERMINAL_BOOT;
        _busy = true;

        if (_outputEl)      _outputEl.innerHTML      = "";
        if (_promptRow)     _promptRow.style.display = "none";
        if (_feedback)      _feedback.style.display  = "none";
        if (_cinematicWrap) _cinematicWrap.style.display = "none";

        var initLines = CONFIG.TERMINAL.INIT_LINES || [
            "aimen@archive ~ % establish_session --secure",
            "[SYS] Initializing core environment...",
            "[SYS] Mounting Virtual Archive [/dev/disk2s1]...",
            "[SYS] Security protocols loaded."
        ];

        var lineIndex = 0;

        function typeLine() {
            if (lineIndex >= initLines.length) {
                // Typewriter boot finished → transition to PASSWORD prompt
                _busy = false;
                _startPasswordState();
                return;
            }

            var fullText = initLines[lineIndex++];
            var lineDiv  = document.createElement("div");
            lineDiv.className = "terminal-line";

            // If prompt line, color command appropriately
            if (fullText.indexOf("%") !== -1) {
                var parts = fullText.split("%");
                lineDiv.innerHTML = '<span class="prompt-user">' + parts[0] + '%</span> <span class="prompt-cmd"></span>';
                _outputEl.appendChild(lineDiv);
                var targetSpan = lineDiv.querySelector(".prompt-cmd");
                _typeTextIntoSpan(targetSpan, parts[1].trim(), 0, typeLine);
            } else {
                lineDiv.innerHTML = '<span class="terminal-system-msg"></span>';
                _outputEl.appendChild(lineDiv);
                var sysSpan = lineDiv.querySelector(".terminal-system-msg");
                _typeTextIntoSpan(sysSpan, fullText, 0, typeLine);
            }
        }

        _delay(typeLine, 300);
    }

    function _typeTextIntoSpan(spanEl, text, charIdx, onComplete) {
        if (charIdx >= text.length) {
            _delay(onComplete, 250);
            return;
        }

        spanEl.textContent += text.charAt(charIdx);
        AudioManager.play("keystroke", 0.15);

        _delay(function() {
            _typeTextIntoSpan(spanEl, text, charIdx + 1, onComplete);
        }, 22);
    }

    // ── State 2: PASSWORD ─────────────────────────────────────────────────

    function _startPasswordState() {
        _currentState = STATE_PASSWORD;

        if (_promptRow) {
            _promptRow.style.display = "flex";
            _promptRow.style.opacity = "0";

            void _promptRow.offsetWidth;

            _promptRow.style.transition = "opacity 0.4s ease";
            _promptRow.style.opacity    = "1";
        }

        if (_inputField) {
            _inputField.value    = "";
            _inputField.disabled = false;
            _updateMaskedDisplay();
            _focusInput();
        }
    }

    function _handleSubmit() {
        if (_busy || _currentState !== STATE_PASSWORD) return;

        var rawValue = _inputField ? _inputField.value : "";
        var entered  = rawValue.trim();

        if (!entered) return;

        var normalizedEntered = entered.toLowerCase().replace(/\s+/g, " ");
        var normalizedTarget  = CONFIG.TERMINAL_PASSWORD.toLowerCase().replace(/\s+/g, " ");

        if (normalizedEntered === normalizedTarget || entered === CONFIG.TERMINAL_PASSWORD) {
            _onPasswordSuccess();
        } else {
            _onPasswordDenied();
        }
    }

    // ── State 3: ACCESS_GRANTED ───────────────────────────────────────────

    function _onPasswordSuccess() {
        _busy = true;
        _currentState = STATE_ACCESS_GRANTED;

        if (_inputField) _inputField.disabled = true;

        AudioManager.play("accessGranted", 0.5);

        // Display GREEN ACCESS GRANTED
        if (_feedback) {
            _feedback.textContent = CONFIG.TERMINAL.GRANTED_TEXT || "ACCESS GRANTED";
            _feedback.className   = "terminal-line terminal-granted";
            _feedback.style.display = "block";
            _feedback.style.opacity = "1";
        }

        setState("terminalAuthenticated", true);

        // Hold ACCESS GRANTED for a beat, then transition to TERMINAL_FADE
        _delay(function() {
            _startTerminalFade();
        }, 1100);
    }

    function _onPasswordDenied() {
        _busy = true;

        // Display RED ACCESS DENIED / WRONG PASSWORD
        if (_feedback) {
            _feedback.textContent = CONFIG.TERMINAL.DENIED_TEXT || "ACCESS DENIED — INCORRECT PASSWORD";
            _feedback.className   = "terminal-line terminal-denied";
            _feedback.style.display = "block";
            _feedback.style.opacity = "1";
        }

        if (_inputField) {
            _inputField.value = "";
            _updateMaskedDisplay();
        }

        // Keep terminal visible! Clear error & allow user to try again
        _delay(function() {
            if (_feedback) _feedback.style.display = "none";
            _busy = false;
            _focusInput();
        }, 1500);
    }

    // ── State 4: TERMINAL_FADE ─────────────────────────────────────────────

    function _startTerminalFade() {
        _currentState = STATE_TERMINAL_FADE;

        // Smoothly dissolve the ENTIRE terminal window out over pitch-black background
        if (_windowEl) {
            _windowEl.classList.add("terminal-window--dissolve");
        }

        // After dissolve finishes, hide terminal window completely and start BLACK_SEQUENCE
        _delay(function() {
            if (_windowEl) _windowEl.style.display = "none";
            _startBlackSequence();
        }, 1200);
    }

    // ── State 5: BLACK_SEQUENCE (Cinematic Setup Text) ─────────────────────

    function _startBlackSequence() {
        _currentState = STATE_BLACK_SEQUENCE;

        if (_cinematicWrap) {
            _cinematicWrap.style.display = "flex";
        }

        var messages = CONFIG.TERMINAL.BLACK_SEQUENCE || [
            "Getting things ready for you...",
            "Preparing your environment...",
            "Loading core systems...",
            "Establishing secure connection...",
            "Initializing Aimen...",
            "Almost there..."
        ];

        var index = 0;

        function showNextMessage() {
            if (index >= messages.length) {
                // Cinematic sequence complete → transition to NEXT_SCENE
                _startNextSceneTransition();
                return;
            }

            var text = messages[index++];
            if (_cinematicMsg) {
                _cinematicMsg.textContent = text;
                _cinematicMsg.style.transition = "none";
                _cinematicMsg.style.opacity = "0";

                void _cinematicMsg.offsetWidth; // force reflow

                // 1. Fade IN (~1.0s)
                _cinematicMsg.style.transition = "opacity 1.0s ease-in-out";
                _cinematicMsg.style.opacity = "1";

                // 2. Remain visible (~1.4s)
                _delay(function() {
                    // 3. Fade OUT (~1.0s)
                    _cinematicMsg.style.transition = "opacity 1.0s ease-in-out";
                    _cinematicMsg.style.opacity = "0";

                    // 4. Pause before next message (~0.4s)
                    _delay(showNextMessage, 1100);
                }, 1500);
            }
        }

        _delay(showNextMessage, 400);
    }

    // ── State 6: NEXT_SCENE ───────────────────────────────────────────────

    function _startNextSceneTransition() {
        _currentState = STATE_NEXT_SCENE;

        if (_cinematicWrap) {
            _cinematicWrap.style.transition = "opacity 0.6s ease";
            _cinematicWrap.style.opacity    = "0";
        }

        // Brief pitch-black screen beat, then transition to Butterfly Scene
        _delay(function() {
            SceneManager.next();
        }, 700);
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    function enter() {
        _container     = document.getElementById("scene-terminal");
        _windowEl      = document.getElementById("terminal-window");
        _outputEl      = document.getElementById("terminal-output");
        _promptRow     = document.getElementById("terminal-prompt-row");
        _inputField    = document.getElementById("terminal-input-field");
        _maskedDisplay = document.getElementById("terminal-masked-display");
        _feedback      = document.getElementById("terminal-feedback");
        _cinematicWrap = document.getElementById("cinematic-text-wrapper");
        _cinematicMsg  = document.getElementById("cinematic-text-msg");

        if (!_container || !_windowEl) {
            debugError("SCENE:TERMINAL", "Required DOM elements not found.");
            return;
        }

        // Guard: If already authenticated, skip terminal completely!
        if (AppState.terminalAuthenticated) {
            SceneManager.next();
            return;
        }

        _clearTimers();
        _busy = false;

        // Ensure clean window & container state on pitch-black background
        _windowEl.classList.remove("terminal-window--dissolve");
        _windowEl.style.display   = "flex";
        _windowEl.style.opacity   = "1";
        _windowEl.style.transform = "none";

        _container.classList.add("active");
        _container.style.display = "flex";

        // Bind password input event handlers
        if (_inputField) {
            _inputField.value = "";
            InputManager.on("input", function() {
                _updateMaskedDisplay();
                AudioManager.play("keystroke", 0.2);
            }, _inputField);
        }

        // Auto-focus input on clicking terminal window
        InputManager.on("click", function() {
            _focusInput();
        }, _container);

        // Submit on Enter key
        InputManager.on("keydown", function(e) {
            if (e.key === "Enter" && _currentState === STATE_PASSWORD) {
                e.preventDefault();
                _handleSubmit();
            }
        });

        var submitBtn = document.getElementById("terminal-submit");
        if (submitBtn) {
            InputManager.on("click", _handleSubmit, submitBtn);
        }

        // Start strict state machine at TERMINAL_BOOT
        _startTerminalBoot();
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
