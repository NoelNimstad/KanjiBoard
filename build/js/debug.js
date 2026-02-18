import { context } from "./kb.js";
const DEBUG_RADIUS = 3;
const TAU = 2 * Math.PI;
function debugDrawStrokePoints(stroke) {
    context.fillStyle = "red";
    for (let i = 0; i < stroke.length; i++) {
        context.beginPath();
        context.arc(stroke[i][0], stroke[i][1], DEBUG_RADIUS, 0, TAU);
        context.fill();
    }
}
export { debugDrawStrokePoints };
//# sourceMappingURL=debug.js.map