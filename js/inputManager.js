/**
 * AIMEN Experience — Input Manager
 * ==================================
 * Centralized input handling.
 * Manages keyboard, click, and touch events so scenes
 * don't accidentally leave orphaned listeners.
 *
 * Usage:
 *   InputManager.on("keydown", myHandler);    // add listener
 *   InputManager.off("keydown", myHandler);   // remove listener
 *   InputManager.clear();                     // remove ALL scene listeners
 *   InputManager.onFirstGesture(callback);    // fire once on any user interaction
 */

var InputManager = (function() {

    // All registered scene handlers, keyed by event type
    var _handlers = {};
    // One-shot first-gesture callbacks
    var _gestureCallbacks = [];
    var _gestureTriggered = false;

    /**
     * Register an event handler.
     * @param {string} eventType  — e.g. "keydown", "click"
     * @param {Function} handler
     * @param {EventTarget} [target] — defaults to window
     */
    function on(eventType, handler, target) {
        var t = target || window;
        if (!_handlers[eventType]) _handlers[eventType] = [];
        _handlers[eventType].push({ handler: handler, target: t });
        t.addEventListener(eventType, handler);
    }

    /**
     * Remove a specific event handler.
     */
    function off(eventType, handler, target) {
        var t = target || window;
        t.removeEventListener(eventType, handler);
        if (_handlers[eventType]) {
            _handlers[eventType] = _handlers[eventType].filter(function(entry) {
                return entry.handler !== handler;
            });
        }
    }

    /**
     * Remove ALL registered scene handlers.
     * Call this from SceneManager on scene exit to prevent listener leaks.
     */
    function clear() {
        Object.keys(_handlers).forEach(function(eventType) {
            var entries = _handlers[eventType] || [];
            entries.forEach(function(entry) {
                try {
                    entry.target.removeEventListener(eventType, entry.handler);
                } catch(e) {}
            });
        });
        _handlers = {};
        debugLog("INPUT", "All handlers cleared.");
    }

    /**
     * Register a one-time callback for the first user gesture.
     * Used to unlock audio context.
     */
    function onFirstGesture(callback) {
        if (_gestureTriggered) {
            callback();
            return;
        }
        _gestureCallbacks.push(callback);
    }

    /**
     * Internal: set up the global first-gesture listener (called once).
     */
    function _setupGestureUnlock() {
        function _handleGesture() {
            if (_gestureTriggered) return;
            _gestureTriggered = true;
            debugLog("INPUT", "First user gesture detected.");
            _gestureCallbacks.forEach(function(cb) { try { cb(); } catch(e) {} });
            _gestureCallbacks = [];
            window.removeEventListener("click",    _handleGesture);
            window.removeEventListener("keydown",  _handleGesture);
            window.removeEventListener("touchstart", _handleGesture);
        }
        window.addEventListener("click",     _handleGesture);
        window.addEventListener("keydown",   _handleGesture);
        window.addEventListener("touchstart", _handleGesture);
    }

    /**
     * Initialize InputManager. Call once from app.js.
     */
    function init() {
        _setupGestureUnlock();
        debugLog("INPUT", "InputManager initialized.");
    }

    return {
        on:             on,
        off:            off,
        clear:          clear,
        onFirstGesture: onFirstGesture,
        init:           init,
    };

})();
