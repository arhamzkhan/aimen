/**
 * AIMEN — Boot Scene
 * ===================
 * Pure black screen.
 * Brief pause, then transition to Terminal.
 * No user interaction required.
 */

var BootScene = (function() {

    var _container = null;
    var _timer     = null;

    function enter() {
        _container = document.getElementById("scene-boot");
        if (_container) _container.style.display = "none";

        // Deferred: SceneManager is still mid-transition while boot's own
        // enter() is running (the busy lock only clears after enter()
        // returns), so calling goTo() synchronously here gets silently
        // ignored and the app stalls on a black screen. Pushing this to
        // the next tick lets that lock clear first.
        _timer = setTimeout(function() {
            SceneManager.goTo("terminal");
        }, 0);
    }

    function exit(done) {
        if (_timer) { clearTimeout(_timer); _timer = null; }
        if (_container) _container.style.display = "none";
        done();
    }

    return {
        name:  "boot",
        enter: enter,
        exit:  exit,
    };

})();
