/**
 * AIMEN Component — Animated Butterfly
 * =====================================
 * Reusable 5-part PNG butterfly component.
 * Assembles insect_body, left_upper_wing, right_upper_wing,
 * left_lower_wing, and right_lower_wing into one organic animated asset.
 *
 * Features:
 *   - Correct 3D wing layering and attachment points (thorax origin)
 *   - Continuous, natural wing flapping with lower wing phase differential
 *   - Autonomous flight drift, smooth acceleration, and heading rotation
 *   - Fully reusable across scenes (Act II Butterfly Awakening, Act V Release)
 *
 * Usage:
 *   var b = Butterfly.create({
 *       container: parentElement,
 *       x: 100,
 *       y: 150,
 *       scale: 1.0
 *   });
 *   b.setTarget(300, 400);
 *   b.update(dt);
 */

var Butterfly = (function() {

    function create(opts) {
        opts = opts || {};

        var root = document.createElement("div");
        root.className = "butterfly-component";
        if (opts.className) root.classList.add(opts.className);

        // Body Layer (z-index: 3)
        var bodyWrap = document.createElement("div");
        bodyWrap.className = "butterfly-body-wrap";
        var bodyImg = document.createElement("img");
        bodyImg.className = "butterfly-part butterfly-body";
        bodyImg.src = "assets/images/insect_body.png";
        bodyImg.alt = "";
        bodyWrap.appendChild(bodyImg);
        root.appendChild(bodyWrap);

        // Left Wing Group (z-index: 2)
        var groupLeft = document.createElement("div");
        groupLeft.className = "butterfly-wing-group wing-group-left";

        var leftUpper = document.createElement("img");
        leftUpper.className = "butterfly-part wing-upper wing-left-upper";
        leftUpper.src = "assets/images/left_upper_wing.png";
        leftUpper.alt = "";

        var leftLower = document.createElement("img");
        leftLower.className = "butterfly-part wing-lower wing-left-lower";
        leftLower.src = "assets/images/left_lower_wing.png";
        leftLower.alt = "";

        groupLeft.appendChild(leftUpper);
        groupLeft.appendChild(leftLower);
        root.appendChild(groupLeft);

        // Right Wing Group (z-index: 2)
        var groupRight = document.createElement("div");
        groupRight.className = "butterfly-wing-group wing-group-right";

        var rightUpper = document.createElement("img");
        rightUpper.className = "butterfly-part wing-upper wing-right-upper";
        rightUpper.src = "assets/images/right_upper_wing.png";
        rightUpper.alt = "";

        var rightLower = document.createElement("img");
        rightLower.className = "butterfly-part wing-lower wing-right-lower";
        rightLower.src = "assets/images/right_lower_wing.png";
        rightLower.alt = "";

        groupRight.appendChild(rightUpper);
        groupRight.appendChild(rightLower);
        root.appendChild(groupRight);

        if (opts.container) {
            opts.container.appendChild(root);
        }

        // Internal State
        var _pos          = { x: opts.x || 0, y: opts.y || 0 };
        var _target       = { x: opts.x || 0, y: opts.y || 0 };
        var _currentAngle = opts.angle || 0; // heading angle in degrees
        var _scale        = (opts.scale !== undefined) ? opts.scale : 1.0;
        var _time         = Math.random() * 20;

        _renderTransform();

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

        function setFlappingSpeed(speedSec) {
            var val = speedSec + "s";
            groupLeft.style.animationDuration = val;
            groupRight.style.animationDuration = val;
            leftLower.style.animationDuration = val;
            rightLower.style.animationDuration = val;
        }

        function _renderTransform() {
            // Gentle floating bobbing
            var bobY = Math.sin(_time * 3.2) * 3.5;
            var bobX = Math.cos(_time * 2.1) * 2.5;

            var totalX = _pos.x + bobX;
            var totalY = _pos.y + bobY;

            root.style.transform =
                "translate3d(" + totalX.toFixed(2) + "px, " + totalY.toFixed(2) + "px, 0px) " +
                "rotate(" + _currentAngle.toFixed(2) + "deg) " +
                "scale(" + _scale.toFixed(2) + ")";
        }

        function update(dt, lerpSpeed) {
            _time += (dt || 0.016);
            var speed = lerpSpeed || 0.03;

            // Move towards target smoothly
            var dx = _target.x - _pos.x;
            var dy = _target.y - _pos.y;

            _pos.x += dx * speed;
            _pos.y += dy * speed;

            // Rotate towards movement heading smoothly
            var distSq = dx * dx + dy * dy;
            if (distSq > 2) {
                // Target angle in degrees (+90 because butterfly image naturally faces upward)
                var targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                // Shortest path angle lerp
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
            element: root,
            setPosition: setPosition,
            setTarget: setTarget,
            setScale: setScale,
            setFlappingSpeed: setFlappingSpeed,
            update: update,
            destroy: destroy,
            get pos() { return _pos; }
        };
    }

    return {
        create: create
    };

})();
