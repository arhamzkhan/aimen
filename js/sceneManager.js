/**
 * AIMEN Experience — Scene Manager
 * ==================================
 * Controls the lifecycle of all scenes.
 * This is the single authority for scene transitions.
 *
 * Scene contract:
 *   Each scene object in js/scenes/ must expose:
 *     - scene.name        {string}   — matches CONFIG.SCENE_ORDER entry
 *     - scene.enter()     {void}     — called when scene becomes active
 *     - scene.exit()      {Function} — called with a `done` callback before leaving
 *
 *   Optionally:
 *     - scene.update()    {void}     — called on rAF if needed (rare)
 *
 * Usage:
 *   SceneManager.init(sceneRegistry);
 *   SceneManager.goTo("terminal");
 *   SceneManager.next();
 *   SceneManager.jumpTo("butterfly");   // debug only
 *
 * DO NOT MODIFY this file to change scene content.
 * DO NOT call SceneManager.goTo() from within enter() — use next() from scene logic.
 */

var SceneManager = (function() {

    var _scenes      = {};       // { name: sceneObject }
    var _current     = null;     // current scene object
    var _busy        = false;    // guard: prevents double transitions
    var _timers      = [];       // timeouts owned by scene manager
    var _rafId       = null;     // requestAnimationFrame id

    /**
     * Register all scene objects.
     * @param {Object[]} sceneList — array of scene objects
     */
    function init(sceneList) {
        // Enforce clean slate: hide all scene containers by default
        var allScenes = document.querySelectorAll(".scene");
        for (var i = 0; i < allScenes.length; i++) {
            allScenes[i].classList.remove("active");
            allScenes[i].style.display = "none";
        }

        sceneList.forEach(function(scene) {
            if (!scene.name) {
                debugError("SCENE", "Scene registered without a name property.");
                return;
            }
            _scenes[scene.name] = scene;
            debugLog("SCENE", "Registered scene: " + scene.name);
        });
        debugLog("SCENE", "SceneManager initialized with " + sceneList.length + " scenes.");
    }

    /**
     * Transition to a named scene.
     * Handles: exit current → fade → enter next.
     * @param {string} sceneName
     */
    function goTo(sceneName) {
        if (_busy) {
            debugWarn("SCENE", "Transition in progress. Ignoring goTo: " + sceneName);
            return;
        }

        var nextScene = _scenes[sceneName];
        if (!nextScene) {
            debugError("SCENE", "Scene not found: " + sceneName);
            return;
        }

        _busy = true;
        debugLog("SCENE", "→ Transitioning to: " + sceneName);

        // Step 1: Exit current scene
        if (_current && typeof _current.exit === "function") {
            debugLog("SCENE", "Exiting: " + _current.name);
            setState("previousScene", _current.name);

            // Stop rAF loop if running
            _stopUpdateLoop();

            // Clear all scene-registered input handlers
            InputManager.clear();

            _current.exit(function() {
                _enterScene(nextScene);
            });
        } else {
            _enterScene(nextScene);
        }
    }

    /**
     * Go to the next scene in CONFIG.SCENE_ORDER.
     */
    function next() {
        var order   = CONFIG.SCENE_ORDER;
        var current = AppState.currentScene;
        var idx     = order.indexOf(current);

        if (idx === -1) {
            debugWarn("SCENE", "Current scene not in SCENE_ORDER: " + current);
            return;
        }

        if (idx + 1 >= order.length) {
            debugLog("SCENE", "Already at last scene: " + current);
            return;
        }

        goTo(order[idx + 1]);
    }

    /**
     * Jump directly to a scene — for debug only.
     * Does NOT run the normal exit sequence.
     */
    function jumpTo(sceneName) {
        if (!CONFIG.DEBUG) {
            debugWarn("SCENE", "jumpTo() is only available in DEBUG mode.");
            return;
        }

        var scene = _scenes[sceneName];
        if (!scene) {
            debugError("SCENE", "jumpTo: scene not found: " + sceneName);
            return;
        }

        debugLog("DEBUG", "Jumping directly to: " + sceneName);

        // Forcefully clean up current scene
        _stopUpdateLoop();
        InputManager.clear();
        AudioManager.stopAll();

        // Hide all scene containers to guarantee clean slate
        var allScenes = document.querySelectorAll(".scene");
        for (var i = 0; i < allScenes.length; i++) {
            allScenes[i].style.display = "none";
        }

        _busy    = false;
        _current = null;

        Transition.reset();
        _enterScene(scene);
    }

    /**
     * Get the name of the currently active scene.
     */
    function getCurrentName() {
        return _current ? _current.name : null;
    }

    // ── Private ──────────────────────────────────────────────────────────

    function _enterScene(scene) {
        debugLog("SCENE", "Entering: " + scene.name);
        setState("currentScene", scene.name);
        setState("_sceneEnteredAt", Date.now());

        // Deactivate all scenes, activate target scene container
        var allScenes = document.querySelectorAll(".scene");
        for (var i = 0; i < allScenes.length; i++) {
            allScenes[i].classList.remove("active");
            allScenes[i].style.display = "none";
        }

        var sceneEl = document.getElementById("scene-" + scene.name);
        if (sceneEl) {
            sceneEl.classList.add("active");
            sceneEl.style.display = "";
        }

        _current = scene;

        try {
            scene.enter();
        } catch(e) {
            debugError("SCENE", "Error in " + scene.name + ".enter(): " + e.message);
            console.error(e);
        }

        // Start rAF loop if scene has an update method
        if (typeof scene.update === "function") {
            _startUpdateLoop(scene);
        }

        _busy = false;
    }

    function _startUpdateLoop(scene) {
        _stopUpdateLoop();
        function loop() {
            try {
                scene.update();
            } catch(e) {
                debugError("SCENE", "Error in " + scene.name + ".update(): " + e.message);
                _stopUpdateLoop();
                return;
            }
            _rafId = requestAnimationFrame(loop);
        }
        _rafId = requestAnimationFrame(loop);
    }

    function _stopUpdateLoop() {
        if (_rafId) {
            cancelAnimationFrame(_rafId);
            _rafId = null;
        }
    }

    // ── Public API ────────────────────────────────────────────────────────

    return {
        init:           init,
        goTo:           goTo,
        next:           next,
        jumpTo:         jumpTo,
        getCurrentName: getCurrentName,
    };

})();
