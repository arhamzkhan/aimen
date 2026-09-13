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
        SceneManager.goTo("terminal");
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
