/**
 * AIMEN Component — Photo Frame
 * ================================
 * Reusable photo frame for the Archive scene.
 * Creates a styled DOM element for a single photograph.
 *
 * Usage:
 *   var frame = PhotoFrame.create({ src, caption, index });
 *   gallery.appendChild(frame);
 *
 * To replace photos: update CONFIG.ARCHIVE_PHOTOS. Do not modify this file.
 */

var PhotoFrame = (function() {

    /**
     * Create a photo frame element.
     * @param {Object} opts
     * @param {string} opts.src       — image path (from CONFIG.ARCHIVE_PHOTOS)
     * @param {string} [opts.caption] — optional caption text
     * @param {number} [opts.index]   — used for stagger/positioning
     * @returns {HTMLElement}
     */
    function create(opts) {
        opts = opts || {};

        var wrapper = document.createElement("div");
        wrapper.className = "photo-frame";
        if (opts.index !== undefined) {
            wrapper.setAttribute("data-index", opts.index);
        }

        // Inner frame (for shadow/border styling)
        var inner = document.createElement("div");
        inner.className = "photo-frame__inner";

        // Image
        var img = document.createElement("img");
        img.className = "photo-frame__img";
        img.alt       = opts.caption || "Memory";
        img.loading   = "lazy";

        var imgNum = (opts.index !== undefined ? opts.index + 1 : 1);
        var labelText = "Image " + imgNum;

        if (opts.src && opts.src.indexOf("PLACEHOLDER") === -1) {
            img.src = opts.src;
            img.onerror = function() {
                img.style.display = "none";
                inner.classList.add("photo-frame__inner--missing");
                inner.setAttribute("data-label", labelText);
            };
        } else {
            // Placeholder frame
            img.style.display = "none";
            inner.classList.add("photo-frame__inner--placeholder");
            inner.setAttribute("data-label", labelText);
        }

        inner.appendChild(img);

        // Caption (optional)
        if (opts.caption && opts.caption.trim() !== "") {
            var cap = document.createElement("p");
            cap.className   = "photo-frame__caption";
            cap.textContent = opts.caption;
            inner.appendChild(cap);
        }

        wrapper.appendChild(inner);
        return wrapper;
    }

    return { create: create };

})();
