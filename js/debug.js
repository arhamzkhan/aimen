/**
 * AIMEN Experience — Debug Utilities
 * =====================================
 * Central debug logging. All debug output goes through here.
 * When CONFIG.DEBUG = false, these are no-ops.
 *
 * Usage:
 *   debugLog("SCENE", "Entering TERMINAL");
 *   debugWarn("AUDIO", "File not found: keystroke.mp3");
 */

function debugLog(category, message) {
    if (typeof CONFIG !== "undefined" && CONFIG.DEBUG) {
        console.log("[" + category + "] " + message);
    }
}

function debugWarn(category, message) {
    if (typeof CONFIG !== "undefined" && CONFIG.DEBUG) {
        console.warn("[" + category + "] " + message);
    }
}

function debugError(category, message) {
    // Errors always log, even in production, but silently
    if (typeof CONFIG !== "undefined" && CONFIG.DEBUG) {
        console.error("[" + category + "] " + message);
    }
}

/**
 * Scene Jump — Debug Only
 * Reads ?scene=NAME from the URL query string.
 * Returns the scene name if found and SCENE_JUMP is enabled, else null.
 */
function getDebugSceneJump() {
    if (!CONFIG.DEBUG || !CONFIG.SCENE_JUMP) return null;
    try {
        var params = new URLSearchParams(window.location.search);
        var scene  = params.get("scene");
        if (scene) return scene.toLowerCase();
    } catch (e) {
        // URLSearchParams may fail in some edge cases under file://
        // Fall back to manual parse
        var match = window.location.search.match(/[?&]scene=([^&]+)/);
        if (match) return match[1].toLowerCase();
    }
    return null;
}

/**
 * Keyboard shortcut for scene jumping (debug only).
 * Press Ctrl+Shift+J in browser console substitute.
 * Also: window.__AIMEN_JUMP("butterfly") from console.
 */
function setupDebugJump() {
    if (!CONFIG.DEBUG) return;

    if (document.body) {
        document.body.classList.add("debug-mode");
    }

    window.__AIMEN_JUMP = function(sceneName) {
        debugLog("DEBUG", "Manual jump → " + sceneName);
        SceneManager.jumpTo(sceneName);
    };

    window.__AIMEN_STATE = function() {
        console.table(AppState);
    };

    window.__AIMEN_SCENES = function() {
        console.log("Available scenes:", CONFIG.SCENE_ORDER.join(", "));
    };

    debugLog("DEBUG", "Debug mode ON. Commands: __AIMEN_JUMP(name), __AIMEN_STATE(), __AIMEN_SCENES()");
}
