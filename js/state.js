/**
 * AIMEN Experience — Global Application State
 * =============================================
 * Single mutable state object for the experience.
 * All reads/writes go through AppState — never use scattered globals.
 *
 * DO NOT add unnecessary fields. Keep this minimal.
 */

var AppState = {
    currentScene:           null,   // string: name of active scene
    previousScene:          null,   // string: name of previous scene
    audioUnlocked:          false,  // bool: user gesture has unlocked AudioContext
    terminalAuthenticated:  false,  // bool: correct password was entered
    archiveProgress:        false,  // bool: archive section was viewed
    letterRead:             false,  // bool: letter scene was completed
    releaseComplete:        false,  // bool: butterfly release sequence finished
    experienceComplete:     false,  // bool: epilogue has been shown

    // Internal: timestamp of scene entry (for timing guards)
    _sceneEnteredAt: 0,
};

/**
 * Update a state key and emit a debug log if DEBUG is on.
 * Always use this instead of direct assignment when you want logging.
 */
function setState(key, value) {
    if (!(key in AppState)) {
        debugWarn("STATE", "Unknown state key: " + key);
    }
    AppState[key] = value;
    debugLog("STATE", key + " = " + JSON.stringify(value));
}
