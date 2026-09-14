/**
 * AIMEN Component — Silver Butterfly (SVG, procedurally generated)
 * ================================================================
 * All-vector, no external images.
 * Every anatomical part is a separately addressable SVG group.
 *
 * Architecture:
 *   root (.butterfly-root)
 *   └── svg.butterfly-svg
 *       ├── defs  (gradients, patterns)
 *       ├── g#bf-wing-left-upper
 *       ├── g#bf-wing-left-lower
 *       ├── g#bf-wing-right-upper
 *       ├── g#bf-wing-right-lower
 *       ├── g#bf-body
 *       │   ├── ellipse (abdomen)
 *       │   ├── ellipse (thorax)
 *       │   └── circle  (head)
 *       └── g#bf-antennae
 *           ├── path + circle (left)
 *           └── path + circle (right)
 *
 * States:
 *   "fly"   — active wing flap (flight speed)
 *   "hover" — calmer flap (hovering)
 *   "rest"  — wings mostly folded, occasional micro-adjust
 *
 * Public API (matches old component contract for scene compatibility):
 *   var b = Butterfly.create({ container, x, y, scale });
 *   b.setPosition(x, y)
 *   b.setTarget(x, y)
 *   b.setAngle(deg)
 *   b.setScale(s)
 *   b.setFlappingSpeed(seconds)
 *   b.setState("fly" | "hover" | "rest")
 *   b.update(dt, lerpSpeed)
 *   b.destroy()
 *   b.pos  — { x, y }
 *   b.element — root DOM node
 */

var Butterfly = (function() {

    // ── SVG namespace helper ───────────────────────────────────────────────

    var NS = "http://www.w3.org/2000/svg";

    function _svgEl(tag, attrs) {
        var el = document.createElementNS(NS, tag);
        if (attrs) {
            Object.keys(attrs).forEach(function(k) {
                el.setAttribute(k, attrs[k]);
            });
        }
        return el;
    }

    // ── Gradient / Defs builder ────────────────────────────────────────────

    function _buildDefs(svg, id) {
        var defs = _svgEl("defs");

        // ── Wing gradients (silver pearl) ──────────────────────────────────

        // Upper wing primary surface — light center fading to charcoal edge
        var gUpper = _svgEl("radialGradient", {
            id: id + "-grad-wing-upper",
            cx: "38%", cy: "35%", r: "62%",
            gradientUnits: "objectBoundingBox"
        });
        _appendStops(gUpper, [
            { offset: "0%",   color: "#d8dde6", opacity: "0.97" },
            { offset: "28%",  color: "#b8bfc9", opacity: "0.95" },
            { offset: "58%",  color: "#8e959f", opacity: "0.92" },
            { offset: "82%",  color: "#606570", opacity: "0.88" },
            { offset: "100%", color: "#3a3d42", opacity: "0.80" }
        ]);
        defs.appendChild(gUpper);

        // Lower wing surface — slightly warmer silver, more translucent
        var gLower = _svgEl("radialGradient", {
            id: id + "-grad-wing-lower",
            cx: "42%", cy: "30%", r: "68%",
            gradientUnits: "objectBoundingBox"
        });
        _appendStops(gLower, [
            { offset: "0%",   color: "#ccd2db", opacity: "0.92" },
            { offset: "35%",  color: "#a2a9b4", opacity: "0.88" },
            { offset: "65%",  color: "#787e87", opacity: "0.84" },
            { offset: "90%",  color: "#525659", opacity: "0.76" },
            { offset: "100%", color: "#2e3033", opacity: "0.65" }
        ]);
        defs.appendChild(gLower);

        // Wing highlight overlay (bright specular reflection near leading edge)
        var gHighlight = _svgEl("linearGradient", {
            id: id + "-grad-highlight",
            x1: "0%", y1: "0%", x2: "80%", y2: "100%"
        });
        _appendStops(gHighlight, [
            { offset: "0%",   color: "#ffffff", opacity: "0.28" },
            { offset: "22%",  color: "#e8ecf2", opacity: "0.14" },
            { offset: "60%",  color: "#c0c8d0", opacity: "0.04" },
            { offset: "100%", color: "#8090a0", opacity: "0.0"  }
        ]);
        defs.appendChild(gHighlight);

        // Body gradient — dark charcoal with silver sheen
        var gBody = _svgEl("linearGradient", {
            id: id + "-grad-body",
            x1: "0%", y1: "0%", x2: "100%", y2: "0%"
        });
        _appendStops(gBody, [
            { offset: "0%",   color: "#1e2024", opacity: "1" },
            { offset: "30%",  color: "#3a3e44", opacity: "1" },
            { offset: "55%",  color: "#52575e", opacity: "1" },
            { offset: "78%",  color: "#3a3e44", opacity: "1" },
            { offset: "100%", color: "#1a1c20", opacity: "1" }
        ]);
        defs.appendChild(gBody);

        // Vein color — slightly lighter than wing edge for subtle visibility
        var gVein = _svgEl("linearGradient", {
            id: id + "-grad-vein",
            x1: "0%", y1: "0%", x2: "100%", y2: "100%"
        });
        _appendStops(gVein, [
            { offset: "0%",   color: "#7a8290", opacity: "0.55" },
            { offset: "100%", color: "#4a5058", opacity: "0.30" }
        ]);
        defs.appendChild(gVein);

        svg.appendChild(defs);
    }

    function _appendStops(gradient, stops) {
        stops.forEach(function(s) {
            var stop = _svgEl("stop");
            stop.setAttribute("offset", s.offset);
            stop.setAttribute("stop-color", s.color);
            stop.setAttribute("stop-opacity", s.opacity);
            gradient.appendChild(stop);
        });
    }

    // ── Wing builders ──────────────────────────────────────────────────────
    //
    // Coordinate system: body center at (0,0).
    // Upper wings extend to the sides and upward.
    // Lower wings extend slightly downward/outward.
    // All shapes are mirrored for right side via scaleX(-1) transform.

    /**
     * Build left upper wing group.
     * Leading edge is concave at top, convex sweep to apex, rounded trailing edge.
     * Includes: primary surface, structural dark edge, veins, highlight.
     */
    function _buildUpperWing(id, side) {
        var g = _svgEl("g");
        g.setAttribute("class", "bf-wing bf-wing-upper bf-wing-" + side);
        g.setAttribute("id", "bf-wing-" + side + "-upper");

        // Mirror right side
        if (side === "right") {
            g.setAttribute("transform", "scale(-1,1)");
        }

        // Primary wing surface path (left wing, origin at thorax attachment ~(0,0))
        // The wing attaches at thorax, sweeps up-left to apex, curves back down
        var surface = _svgEl("path", {
            d: [
                "M 0,-2",          // attachment at thorax top
                "C -8,-18 -28,-26 -42,-20",   // sweep to upper apex
                "C -52,-16 -54,-8  -50, 2",   // outer leading edge curve
                "C -44, 10 -34, 16 -22, 18",  // apex curve down
                "C -14, 20  -6, 16  -2, 10",  // inner trailing curve
                "C  -1,  6   0,  2   0, -2",  // close back to attachment
                "Z"
            ].join(" "),
            fill: "url(#" + id + "-grad-wing-upper)",
            stroke: "none"
        });
        g.appendChild(surface);

        // Structural dark edge — slightly inset, narrow, traces outer silhouette
        var edge = _svgEl("path", {
            d: [
                "M 0,-2",
                "C -8,-18 -28,-26 -42,-20",
                "C -52,-16 -54,-8  -50, 2",
                "C -44, 10 -34, 16 -22, 18",
                "C -14, 20  -6, 16  -2, 10"
            ].join(" "),
            fill: "none",
            stroke: "rgba(30,32,38,0.65)",
            "stroke-width": "1.2",
            "stroke-linecap": "round"
        });
        g.appendChild(edge);

        // Specular highlight overlay (near top of wing)
        var highlight = _svgEl("path", {
            d: [
                "M -2,-1",
                "C -9,-14 -22,-22 -36,-18",
                "C -42,-15 -44,-10 -40, -4",
                "C -32, -1 -18,  1  -4,  2",
                "Z"
            ].join(" "),
            fill: "url(#" + id + "-grad-highlight)",
            stroke: "none",
            opacity: "0.7"
        });
        g.appendChild(highlight);

        // Vein network — costal vein (leading edge)
        var veinCostal = _svgEl("path", {
            d: "M 0,-2 C -12,-14 -30,-20 -44,-16",
            fill: "none",
            stroke: "url(#" + id + "-grad-vein)",
            "stroke-width": "0.9",
            "stroke-linecap": "round",
            opacity: "0.75"
        });
        g.appendChild(veinCostal);

        // Radial veins from thorax
        var veinData = [
            "M 0,-1 C -8,-8  -18,-14 -28,-16",
            "M 0, 0 C -7,-4  -16, -8 -26,-10",
            "M 0, 2 C -6, 2  -14,  4 -22,  8",
            "M 0, 4 C -5, 6  -12, 10 -18, 14",
        ];
        veinData.forEach(function(d) {
            var v = _svgEl("path", {
                d: d,
                fill: "none",
                stroke: "rgba(90,98,108,0.45)",
                "stroke-width": "0.55",
                "stroke-linecap": "round"
            });
            g.appendChild(v);
        });

        // Discal cell — small closed cell near body, characteristic of real wings
        var discal = _svgEl("path", {
            d: "M -3,-1 C -7,-5 -14,-7 -18,-5 C -16,-2 -12, 1 -6, 2 Z",
            fill: "rgba(160,170,180,0.12)",
            stroke: "rgba(90,98,108,0.35)",
            "stroke-width": "0.45"
        });
        g.appendChild(discal);

        // Subtle darker area near outer trailing edge (tonal variation)
        var shadow = _svgEl("path", {
            d: [
                "M -40, -2",
                "C -48, -6 -52, -2 -50,  4",
                "C -46,  8 -38, 12 -30, 14",
                "Z"
            ].join(" "),
            fill: "rgba(20,22,26,0.20)",
            stroke: "none"
        });
        g.appendChild(shadow);

        return g;
    }

    /**
     * Build left lower wing group.
     * Shorter, rounder. Attaches behind thorax, extends down-outward.
     */
    function _buildLowerWing(id, side) {
        var g = _svgEl("g");
        g.setAttribute("class", "bf-wing bf-wing-lower bf-wing-" + side);
        g.setAttribute("id", "bf-wing-" + side + "-lower");

        if (side === "right") {
            g.setAttribute("transform", "scale(-1,1)");
        }

        var surface = _svgEl("path", {
            d: [
                "M 0, 4",           // attachment at thorax lower
                "C -6, 8  -16, 10 -26,  8",   // out to side
                "C -34,  6 -38, 10 -36, 18",  // drop down to lower apex
                "C -32, 26 -22, 28 -14, 24",  // sweep inward-down
                "C  -8, 22  -4, 18  -2, 14",  // inner trailing edge
                "C  -1, 10   0,  7   0,  4",  // close
                "Z"
            ].join(" "),
            fill: "url(#" + id + "-grad-wing-lower)",
            stroke: "none"
        });
        g.appendChild(surface);

        var edge = _svgEl("path", {
            d: [
                "M 0, 4",
                "C -6, 8  -16, 10 -26,  8",
                "C -34,  6 -38, 10 -36, 18",
                "C -32, 26 -22, 28 -14, 24",
                "C  -8, 22  -4, 18  -2, 14"
            ].join(" "),
            fill: "none",
            stroke: "rgba(28,30,35,0.60)",
            "stroke-width": "1.0",
            "stroke-linecap": "round"
        });
        g.appendChild(edge);

        var highlight = _svgEl("path", {
            d: [
                "M -2, 5",
                "C -8, 7  -16,  8 -22,  7",
                "C -28,  6 -30,  9 -28, 14",
                "C -22, 16 -14, 14  -6, 12",
                "Z"
            ].join(" "),
            fill: "url(#" + id + "-grad-highlight)",
            stroke: "none",
            opacity: "0.55"
        });
        g.appendChild(highlight);

        // Veins
        var lowerVeins = [
            "M 0, 4 C -6,  8 -16, 12 -24, 14",
            "M 0, 5 C -5, 10 -12, 16 -18, 20",
            "M 0, 6 C -4, 12  -8, 18 -10, 22",
        ];
        lowerVeins.forEach(function(d) {
            var v = _svgEl("path", {
                d: d,
                fill: "none",
                stroke: "rgba(80,88,96,0.40)",
                "stroke-width": "0.5",
                "stroke-linecap": "round"
            });
            g.appendChild(v);
        });

        // Darker outer margin
        var margin = _svgEl("path", {
            d: [
                "M -28, 10",
                "C -36,  8 -38, 14 -36, 20",
                "C -32, 26 -24, 28 -16, 24",
                "Z"
            ].join(" "),
            fill: "rgba(18,20,24,0.18)",
            stroke: "none"
        });
        g.appendChild(margin);

        return g;
    }

    // ── Body builder ───────────────────────────────────────────────────────

    function _buildBody(id) {
        var g = _svgEl("g");
        g.setAttribute("id", "bf-body");
        g.setAttribute("class", "bf-body");

        // Abdomen — elongated, segmented appearance via subtle pattern
        var abdomen = _svgEl("ellipse", {
            cx: "0", cy: "12", rx: "2.6", ry: "12",
            fill: "url(#" + id + "-grad-body)",
            stroke: "rgba(10,12,15,0.7)",
            "stroke-width": "0.4"
        });
        g.appendChild(abdomen);

        // Abdomen segmentation lines (subtle, 4 rings)
        [5, 9, 13, 17].forEach(function(y) {
            var seg = _svgEl("line", {
                x1: "-2.2", y1: y, x2: "2.2", y2: y,
                stroke: "rgba(8,10,13,0.45)",
                "stroke-width": "0.35"
            });
            g.appendChild(seg);
        });

        // Abdomen silver sheen highlight (narrow left strip)
        var sheen = _svgEl("ellipse", {
            cx: "-0.7", cy: "10", rx: "0.8", ry: "8",
            fill: "rgba(180,188,196,0.22)",
            stroke: "none"
        });
        g.appendChild(sheen);

        // Thorax — slightly wider oval
        var thorax = _svgEl("ellipse", {
            cx: "0", cy: "1", rx: "3.2", ry: "4.5",
            fill: "url(#" + id + "-grad-body)",
            stroke: "rgba(10,12,15,0.65)",
            "stroke-width": "0.4"
        });
        g.appendChild(thorax);

        // Thorax highlight
        var thoraxSheen = _svgEl("ellipse", {
            cx: "-0.8", cy: "0", rx: "1.0", ry: "2.8",
            fill: "rgba(190,196,206,0.20)",
            stroke: "none"
        });
        g.appendChild(thoraxSheen);

        // Head — small circle
        var head = _svgEl("circle", {
            cx: "0", cy: "-4.2", r: "2.4",
            fill: "url(#" + id + "-grad-body)",
            stroke: "rgba(10,12,15,0.60)",
            "stroke-width": "0.4"
        });
        g.appendChild(head);

        // Head highlight
        var headSheen = _svgEl("circle", {
            cx: "-0.5", cy: "-4.8", r: "0.9",
            fill: "rgba(190,196,206,0.28)",
            stroke: "none"
        });
        g.appendChild(headSheen);

        return g;
    }

    // ── Antennae builder ───────────────────────────────────────────────────

    function _buildAntennae(id) {
        var g = _svgEl("g");
        g.setAttribute("id", "bf-antennae");
        g.setAttribute("class", "bf-antennae");

        // Left antenna — slight organic curve
        var antL = _svgEl("path", {
            d: "M -1,-6 C -3,-10 -8,-16 -13,-22",
            fill: "none",
            stroke: "rgba(80,86,94,0.75)",
            "stroke-width": "0.7",
            "stroke-linecap": "round"
        });
        g.appendChild(antL);

        var clubL = _svgEl("circle", {
            cx: "-13", cy: "-22", r: "1.6",
            fill: "rgba(68,72,80,0.90)",
            stroke: "rgba(50,54,60,0.6)",
            "stroke-width": "0.3"
        });
        g.appendChild(clubL);

        // Right antenna
        var antR = _svgEl("path", {
            d: "M 1,-6 C 3,-10 8,-16 13,-22",
            fill: "none",
            stroke: "rgba(80,86,94,0.75)",
            "stroke-width": "0.7",
            "stroke-linecap": "round"
        });
        g.appendChild(antR);

        var clubR = _svgEl("circle", {
            cx: "13", cy: "-22", r: "1.6",
            fill: "rgba(68,72,80,0.90)",
            stroke: "rgba(50,54,60,0.6)",
            "stroke-width": "0.3"
        });
        g.appendChild(clubR);

        return g;
    }

    // ── Assembly ───────────────────────────────────────────────────────────

    function _buildSVG(id) {
        // viewBox: wing span ~110 wide, ~60 tall, centered on body (0,0)
        var svg = _svgEl("svg", {
            viewBox: "-58 -28 116 72",
            xmlns: NS,
            "class": "butterfly-svg",
            "aria-hidden": "true",
            overflow: "visible"
        });

        _buildDefs(svg, id);

        // Layer order matters: lower wings behind upper wings, body on top
        svg.appendChild(_buildLowerWing(id, "left"));
        svg.appendChild(_buildLowerWing(id, "right"));
        svg.appendChild(_buildUpperWing(id, "left"));
        svg.appendChild(_buildUpperWing(id, "right"));
        svg.appendChild(_buildBody(id));
        svg.appendChild(_buildAntennae(id));

        return svg;
    }

    // ── Public factory ─────────────────────────────────────────────────────

    function create(opts) {
        opts = opts || {};

        // Unique ID prefix for gradients (avoids collisions if multiple instances)
        var id = "bfly" + (Date.now() % 100000);

        // Root container — positioned by butterflyScene.js via transform
        var root = document.createElement("div");
        root.className = "butterfly-root";

        // Inner SVG wrapper — carries CSS animation classes for wing flap
        var inner = document.createElement("div");
        inner.className = "butterfly-inner";

        var svg = _buildSVG(id);
        inner.appendChild(svg);
        root.appendChild(inner);

        if (opts.container) {
            opts.container.appendChild(root);
        }

        // ── State ──────────────────────────────────────────────────────────
        var _pos          = { x: opts.x || 0, y: opts.y || 0 };
        var _target       = { x: opts.x || 0, y: opts.y || 0 };
        var _currentAngle = opts.angle || 0;
        var _scale        = (opts.scale !== undefined) ? opts.scale : 1.0;
        var _time         = Math.random() * 20;
        var _state        = "fly";    // "fly" | "hover" | "rest"
        var _flapDur      = null;     // null = CSS default; otherwise string like "0.22s"

        _applyState(_state);
        _renderTransform();

        // ── State Helpers ──────────────────────────────────────────────────

        function _applyState(s) {
            root.classList.remove("bfly-state-fly", "bfly-state-hover", "bfly-state-rest");
            root.classList.add("bfly-state-" + s);
            _state = s;
        }

        function _renderTransform() {
            var bobY = Math.sin(_time * 3.1) * 2.8;
            var bobX = Math.cos(_time * 2.0) * 1.8;

            // Subtle tilt into direction of travel (heading-aware tilt)
            var tiltRoll = _currentAngle * 0.08;

            root.style.transform =
                "translate3d(" + (_pos.x + bobX).toFixed(2) + "px, " +
                                 (_pos.y + bobY).toFixed(2) + "px, 0) " +
                "rotate("  + _currentAngle.toFixed(2) + "deg) " +
                "scale("   + _scale.toFixed(3) + ")";
        }

        // ── Public API ─────────────────────────────────────────────────────

        function setPosition(x, y) {
            _pos.x = x;
            _pos.y = y;
            _renderTransform();
        }

        function setTarget(x, y) {
            _target.x = x;
            _target.y = y;
        }

        function setScale(s) {
            _scale = s;
            _renderTransform();
        }

        function setAngle(deg) {
            _currentAngle = deg;
            _renderTransform();
        }

        /**
         * Override flap cycle duration.
         * @param {number} speedSec — full flap cycle in seconds
         */
        function setFlappingSpeed(speedSec) {
            _flapDur = speedSec + "s";
            inner.style.setProperty("--flap-upper-dur", _flapDur);
            // Lower wings slightly slower for natural phase offset
            inner.style.setProperty("--flap-lower-dur", (speedSec * 1.12).toFixed(3) + "s");
        }

        /**
         * Switch animation state.
         * @param {string} state — "fly" | "hover" | "rest"
         */
        function setState(state) {
            _applyState(state);
        }

        /**
         * Per-frame update — moves toward target, rotates toward heading.
         * @param {number} dt        — delta time in seconds
         * @param {number} lerpSpeed — position lerp speed (0..1)
         */
        function update(dt, lerpSpeed) {
            _time += (dt || 0.016);
            var speed = lerpSpeed || 0.03;

            var dx = _target.x - _pos.x;
            var dy = _target.y - _pos.y;

            _pos.x += dx * speed;
            _pos.y += dy * speed;

            var distSq = dx * dx + dy * dy;
            if (distSq > 2) {
                var targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                var diff = (targetAngle - _currentAngle + 540) % 360 - 180;
                _currentAngle += diff * 0.06;
            }

            _renderTransform();
        }

        function destroy() {
            if (root && root.parentNode) {
                root.parentNode.removeChild(root);
            }
        }

        return {
            element:          root,
            setPosition:      setPosition,
            setTarget:        setTarget,
            setAngle:         setAngle,
            setScale:         setScale,
            setFlappingSpeed: setFlappingSpeed,
            setState:         setState,
            update:           update,
            destroy:          destroy,
            get pos() { return _pos; }
        };
    }

    return { create: create };

})();
