/**
 * AIMEN — Main App Entry Point
 * ==============================
 * Wires everything together. Runs on DOMContentLoaded.
 * This file should remain thin — no scene logic here.
 *
 * Load order in index.html (must match):
 *   1. config.js
 *   2. debug.js
 *   3. state.js
 *   4. audioManager.js
 *   5. inputManager.js
 *   6. transitionManager.js
 *   7. components/*.js
 *   8. scenes/*.js
 *   9. sceneManager.js
 *  10. app.js  ← this file, last
 */

(function() {

    function init() {
        debugLog("APP", "Initializing AIMEN experience.");

        // Set up input manager (first gesture audio unlock)
        InputManager.init();
        InputManager.onFirstGesture(function() {
            AudioManager.unlock();
        });

        // Reset transition overlay
        Transition.reset();

        // Register all scenes in order
        SceneManager.init([
            BootScene,
            TerminalScene,
            ButterflyScene,
            ArchiveScene,
            LetterScene,
            ReleaseScene,
            EpilogueScene,
        ]);

        // Set up debug console commands
        setupDebugJump();

        // Check for debug scene jump via URL param
        var jumpScene = getDebugSceneJump();
        if (jumpScene) {
            debugLog("DEBUG", "URL scene jump requested: " + jumpScene);
            // Small delay to let DOM settle, then jump
            setTimeout(function() {
                SceneManager.jumpTo(jumpScene);
            }, 200);
            return;
        }

        // Normal start: begin at boot
        SceneManager.goTo("boot");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
